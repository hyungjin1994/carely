-- Carely 전체 마이그레이션 (0001~0004 합본). Supabase SQL Editor 에 붙여넣고 Run.


-- ============================================================
-- supabase/migrations/0001_schema.sql
-- ============================================================
-- Carely 스키마 (핸드오프 §5). Supabase Postgres.
-- 모든 시간은 timestamptz(UTC 저장), 날짜는 KST 기준 date.

-- ── 프로필 (auth.users 확장) ──
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text,
  role          text not null default 'parent' check (role in ('parent','grandparent','manager')),
  font_scale    numeric not null default 1.0,
  high_contrast boolean not null default false,
  notify_on     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── 가족 연결 ──
create table public.family_links (
  id         uuid primary key default gen_random_uuid(),
  senior_id  uuid not null references public.profiles(id) on delete cascade,
  manager_id uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz not null default now(),
  unique (senior_id, manager_id)
);
create index family_links_senior_idx on public.family_links(senior_id);
create index family_links_manager_idx on public.family_links(manager_id);

-- ── 연결 코드 (짧은 코드, 만료/단일사용) ──
create table public.connect_codes (
  code       text primary key,
  senior_id  uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  used_by    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index connect_codes_senior_idx on public.connect_codes(senior_id);

-- ── 포인트 적립 내역 ──
create table public.point_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  delta      integer not null,
  reason     text not null check (reason in ('game','photo','exchange')),
  game_id    text,
  created_at timestamptz not null default now()
);
create index point_ledger_user_idx on public.point_ledger(user_id, created_at desc);

-- ── 하루 포인트 (KST date 키로 자연 리셋, max 1000) ──
create table public.daily_points (
  user_id uuid not null references public.profiles(id) on delete cascade,
  date    date not null,
  total   integer not null default 0,
  primary key (user_id, date)
);

-- ── 게임 점수 기록 ──
create table public.game_scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  game_id    text not null,
  difficulty text not null,
  correct    integer not null,
  total      integer not null,
  points     integer not null,
  created_at timestamptz not null default now()
);
create index game_scores_user_idx on public.game_scores(user_id, created_at desc);

-- ── 환전 신청 ──
create table public.exchange_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null,
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected','done')),
  approved_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index exchange_requests_user_idx on public.exchange_requests(user_id, created_at desc);

-- ── 일정 ──
create table public.events (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  date      date not null,
  type      text not null check (type in ('약','병원','운동','가족','여행','모임','생일','기타')),
  title     text not null,
  time      text,                 -- "HH:MM"
  place     text,                 -- 어디서
  with_whom text,                 -- 누구와
  memo      text,
  done      boolean not null default false
);
create index events_user_date_idx on public.events(user_id, date);

-- ── 약 ──
create table public.medications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  dose       text not null,
  times      text[] not null,   -- ['아침','저녁']
  created_at timestamptz not null default now()
);
create index medications_user_idx on public.medications(user_id);

-- ── 복용 스케줄 (등록 시 2주치 자동 생성) ──
create table public.med_doses (
  id           uuid primary key default gen_random_uuid(),
  med_id       uuid not null references public.medications(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  taken        boolean not null default false
);
create index med_doses_user_idx on public.med_doses(user_id, scheduled_at);

-- ── 사진 (Supabase Storage 경로) ──
create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  caption      text,
  created_at   timestamptz not null default now()
);
create index photos_owner_idx on public.photos(owner_id, created_at desc);

-- ── 가족 메시지 ──
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.family_links(id) on delete cascade,
  from_id    uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  photo_id   uuid references public.photos(id) on delete set null,
  created_at timestamptz not null default now()
);
create index messages_family_idx on public.messages(family_id, created_at desc);

-- ── 측정 (건강수치) ──
-- 매핑: glucose_fasting/glucose_post → v1=mg/dL · bp → v1=수축/v2=이완/v3=맥박 · weight → v1=kg
create table public.measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('glucose_fasting','glucose_post','bp','weight')),
  v1          numeric,
  v2          numeric,
  v3          numeric,
  memo        text,
  measured_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index measurements_user_idx on public.measurements(user_id, measured_at desc);

-- ── 웹 푸시 구독 ──
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);

-- ── 예약 알림 (크론이 발송) ──
create table public.notifications (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind    text not null,                 -- 'med' | 'event'
  title   text not null,
  body    text not null,
  send_at timestamptz not null,
  sent    boolean not null default false,
  channel text not null default 'push' check (channel in ('push','email'))
);
create index notifications_due_idx on public.notifications(sent, send_at);
create index notifications_user_idx on public.notifications(user_id);


-- ============================================================
-- supabase/migrations/0002_functions.sql
-- ============================================================
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

-- ── 게임 결과 제출 (서버 권위 채점 + 게임별/일일 한도 클램프 + 적립 + 기록) ──
-- per_game_cap 은 lib/games/config.ts 의 PER_GAME_DAILY_CAP 과 동일하게 유지 (마이그레이션 0005).
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
  d date := (now() at time zone 'Asia/Seoul')::date;
  per_game_cap constant integer := 200;   -- = lib/games/config.ts PER_GAME_DAILY_CAP
  game_total integer;
  capped integer;
  awarded integer;
begin
  if uid is null then
    raise exception 'unauthenticated';
  end if;

  -- 일일 행 확보 후 잠금: 같은 사용자의 동시 적립을 직렬화한다.
  -- (award_points 도 같은 행을 잠그므로, 여기서 먼저 잠가야 game_total 합산이 race-free)
  insert into public.daily_points(user_id, date, total)
  values (uid, d, 0)
  on conflict (user_id, date) do nothing;

  perform 1 from public.daily_points
    where user_id = uid and date = d
    for update;

  -- 오늘(KST) 이 게임으로 이미 적립한 포인트 합 (game_scores.points 는 실제 적립값)
  select coalesce(sum(points), 0) into game_total
    from public.game_scores
    where user_id = uid
      and game_id = p_game_id
      and (created_at at time zone 'Asia/Seoul')::date = d;

  -- 게임별 한도로 먼저 클램프 → 그 다음 일일 한도(award_points)로 클램프
  capped := least(greatest(p_points, 0), greatest(0, per_game_cap - game_total));
  awarded := public.award_points(uid, capped, 'game', p_game_id);

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


-- ============================================================
-- supabase/migrations/0003_rls.sql
-- ============================================================
-- RLS 정책. 본인 스코프 + is_linked() 교차 읽기. 모든 테이블 RLS 활성화.

alter table public.profiles          enable row level security;
alter table public.family_links      enable row level security;
alter table public.connect_codes     enable row level security;
alter table public.point_ledger      enable row level security;
alter table public.daily_points      enable row level security;
alter table public.game_scores       enable row level security;
alter table public.exchange_requests enable row level security;
alter table public.events            enable row level security;
alter table public.medications       enable row level security;
alter table public.med_doses         enable row level security;
alter table public.photos            enable row level security;
alter table public.messages          enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications     enable row level security;

-- ── profiles: 본인 + 연결된 가족 읽기, 본인만 수정 ──
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_linked(auth.uid(), id));
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── family_links: 당사자만 읽기 (생성/수정은 RPC가 담당) ──
create policy family_links_select on public.family_links
  for select using (senior_id = auth.uid() or manager_id = auth.uid());

-- ── connect_codes: mom 본인 관리 (사용은 RPC) ──
create policy connect_codes_owner on public.connect_codes
  for all using (senior_id = auth.uid()) with check (senior_id = auth.uid());

-- ── 본인 스코프 테이블 (user_id = auth.uid()) ──
create policy point_ledger_self on public.point_ledger
  for select using (user_id = auth.uid());

create policy daily_points_self on public.daily_points
  for select using (user_id = auth.uid());

create policy game_scores_self on public.game_scores
  for select using (user_id = auth.uid());

create policy medications_self on public.medications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy med_doses_self on public.med_doses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy push_subscriptions_self on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notifications_self on public.notifications
  for select using (user_id = auth.uid());

-- ── events: 본인 전체 + 연결 가족 읽기 ──
create policy events_owner on public.events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy events_family_read on public.events
  for select using (public.is_linked(auth.uid(), user_id));
create policy events_family_manage on public.events
  for all using (public.is_linked(auth.uid(), user_id))
  with check (public.is_linked(auth.uid(), user_id));

-- ── photos: 본인 전체 + 연결 가족 읽기 ──
create policy photos_owner on public.photos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy photos_family_read on public.photos
  for select using (public.is_linked(auth.uid(), owner_id));

-- ── exchange_requests: mom 본인 신청/조회 + 자녀 조회 (변경은 decide_exchange RPC) ──
create policy exchange_owner on public.exchange_requests
  for select using (user_id = auth.uid());
create policy exchange_owner_insert on public.exchange_requests
  for insert with check (user_id = auth.uid());
create policy exchange_family_read on public.exchange_requests
  for select using (public.is_linked(auth.uid(), user_id));

-- ── messages: 내가 속한 family_link 의 메시지 읽기/쓰기 ──
create policy messages_member_select on public.messages
  for select using (
    exists (
      select 1 from public.family_links fl
      where fl.id = messages.family_id
        and (fl.senior_id = auth.uid() or fl.manager_id = auth.uid())
    )
  );
create policy messages_member_insert on public.messages
  for insert with check (
    from_id = auth.uid()
    and exists (
      select 1 from public.family_links fl
      where fl.id = messages.family_id
        and (fl.senior_id = auth.uid() or fl.manager_id = auth.uid())
    )
  );

-- ── 가족(관리자) 모니터링 읽기 — 연결된 어르신의 포인트·약 데이터 ──
create policy point_ledger_family_read on public.point_ledger
  for select using (public.is_linked(auth.uid(), user_id));
create policy daily_points_family_read on public.daily_points
  for select using (public.is_linked(auth.uid(), user_id));
create policy game_scores_family_read on public.game_scores
  for select using (public.is_linked(auth.uid(), user_id));
create policy medications_family_read on public.medications
  for select using (public.is_linked(auth.uid(), user_id));
create policy med_doses_family_read on public.med_doses
  for select using (public.is_linked(auth.uid(), user_id));

-- ── measurements: 본인 입력/조회 + 연결 가족 읽기 ──
alter table public.measurements enable row level security;
create policy measurements_self on public.measurements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy measurements_family_read on public.measurements
  for select using (public.is_linked(auth.uid(), user_id));


-- ============================================================
-- supabase/migrations/0004_storage.sql
-- ============================================================
-- 사진 Storage 버킷 + 정책. 경로 규칙: {owner_id}/{filename}
-- 소유자만 쓰기, 본인+연결 가족만 읽기.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- 소유자 업로드 (경로 첫 폴더 = 본인 uid)
create policy photos_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 소유자 수정/삭제
create policy photos_modify on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 본인 + 연결 가족 읽기
create policy photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_linked(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

