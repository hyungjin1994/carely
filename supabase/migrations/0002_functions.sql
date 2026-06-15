-- 함수/트리거. RLS(0003)가 is_linked() 를 참조하므로 먼저 생성.

-- ── 신규 가입 시 profiles 행 자동 생성 + role 을 app_metadata 로 승격 ──
-- role 을 app_metadata 에 넣어야 JWT 에 담겨 proxy 에서 역할 게이팅 가능.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'parent');
  v_name text := new.raw_user_meta_data->>'name';
begin
  if v_role not in ('parent','grandparent','manager') then
    v_role := 'parent';
  end if;

  insert into public.profiles (id, name, role)
  values (new.id, v_name, v_role)
  on conflict (id) do nothing;

  -- app_metadata.role 갱신 (JWT 클레임)
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', v_role)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 가족 연결 판정 헬퍼 (RLS 교차 읽기의 단일 진실) ──
create or replace function public.is_linked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_links fl
    where fl.status = 'active'
      and ((fl.senior_id = a and fl.manager_id = b)
        or (fl.senior_id = b and fl.manager_id = a))
  );
$$;

-- ── 포인트 적립 (하루 1000 한도, KST date, 동시성 안전) ──
create or replace function public.award_points(
  p_user uuid, p_raw integer, p_reason text, p_game_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'Asia/Seoul')::date;
  cur integer;
  g integer;
begin
  if p_user <> auth.uid() then
    raise exception 'forbidden';
  end if;

  insert into public.daily_points(user_id, date, total)
  values (p_user, d, 0)
  on conflict (user_id, date) do nothing;

  select total into cur from public.daily_points
    where user_id = p_user and date = d
    for update;                       -- 행 잠금으로 동시 적립 직렬화

  g := least(greatest(p_raw, 0), greatest(0, 1000 - cur));

  if g > 0 then
    update public.daily_points set total = total + g
      where user_id = p_user and date = d;
    insert into public.point_ledger(user_id, delta, reason, game_id)
      values (p_user, g, p_reason, p_game_id);
  end if;

  return g;
end;
$$;

-- ── 게임 결과 제출 (서버 권위 채점 + 적립 + 기록) ──
create or replace function public.submit_game_result(
  p_game_id text, p_difficulty text, p_correct integer, p_total integer, p_points integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  awarded integer;
begin
  if uid is null then
    raise exception 'unauthenticated';
  end if;

  awarded := public.award_points(uid, greatest(p_points, 0), 'game', p_game_id);

  insert into public.game_scores(user_id, game_id, difficulty, correct, total, points)
  values (uid, p_game_id, p_difficulty, greatest(p_correct,0), greatest(p_total,0), awarded);

  return awarded;
end;
$$;

-- ── 연결 코드 사용 (자녀가 mom 을 볼 수 없는 상태에서 family_links 생성) ──
create or replace function public.redeem_connect_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_senior uuid;
  v_link uuid;
begin
  if uid is null then
    raise exception 'unauthenticated';
  end if;

  select senior_id into v_senior from public.connect_codes
    where code = upper(p_code) and used_by is null and expires_at > now()
    for update;

  if v_senior is null then
    raise exception 'invalid_code';
  end if;
  if v_senior = uid then
    raise exception 'cannot_link_self';
  end if;

  insert into public.family_links(senior_id, manager_id, status)
  values (v_senior, uid, 'active')
  on conflict (senior_id, manager_id) do update set status = 'active'
  returning id into v_link;

  update public.connect_codes set used_by = uid where code = upper(p_code);

  return v_senior;
end;
$$;

-- ── 환전 승인/거절 (자녀 전용, status/approved_by 만 변경) ──
create or replace function public.decide_exchange(p_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_owner uuid;
begin
  select user_id into v_owner from public.exchange_requests where id = p_id for update;
  if v_owner is null then
    raise exception 'not_found';
  end if;
  if not public.is_linked(uid, v_owner) then
    raise exception 'forbidden';
  end if;

  update public.exchange_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      approved_by = uid
  where id = p_id and status = 'pending';
end;
$$;

-- ── 환전 완료 (관리자, status=done + 어르신 포인트 차감) ──
create or replace function public.complete_exchange(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_owner uuid;
  v_amount integer;
  v_status text;
begin
  select user_id, amount, status into v_owner, v_amount, v_status
    from public.exchange_requests where id = p_id for update;
  if v_owner is null then
    raise exception 'not_found';
  end if;
  if not public.is_linked(uid, v_owner) then
    raise exception 'forbidden';
  end if;
  if v_status <> 'pending' then
    raise exception 'not_pending';
  end if;

  update public.exchange_requests
    set status = 'done', approved_by = uid
    where id = p_id;

  insert into public.point_ledger(user_id, delta, reason, game_id)
    values (v_owner, -v_amount, 'exchange', null);
end;
$$;
