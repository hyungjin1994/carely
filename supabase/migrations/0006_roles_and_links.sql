-- 0006: 역할 모델 확장 + family_links/connect_codes 컬럼 rename.
--   role: 'mom'|'child' → 'parent'|'grandparent'|'manager'  (manager = 관리자, 기존 child)
--   family_links.mom_id/child_id → senior_id/manager_id
--   connect_codes.mom_id → senior_id
-- 기존 배포 DB 적용용 forward 마이그레이션. 신규 설치는 갱신된 0001~0003 으로 동일 결과.
-- 주의: 컬럼 rename 은 인덱스/제약/RLS 정책 참조는 자동 갱신하지만, 함수 본문(text)은
--       자동 갱신되지 않으므로 is_linked / redeem_connect_code / handle_new_user 를 재생성한다.

-- ── profiles.role 값 remap + CHECK 3값 ──
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'parent'  where role = 'mom';
update public.profiles set role = 'manager' where role = 'child';
alter table public.profiles alter column role set default 'parent';
alter table public.profiles
  add constraint profiles_role_check check (role in ('parent','grandparent','manager'));

-- ── 관계 라벨(부모님/조부모님) 보존용 — role 이 곧 라벨이라 별도 컬럼 불필요 ──

-- ── family_links 컬럼/인덱스 rename (unique 제약·RLS 는 컬럼 rename 으로 자동 추적) ──
alter table public.family_links rename column mom_id   to senior_id;
alter table public.family_links rename column child_id to manager_id;
alter index if exists public.family_links_mom_idx   rename to family_links_senior_idx;
alter index if exists public.family_links_child_idx rename to family_links_manager_idx;

-- ── connect_codes 컬럼/인덱스 rename ──
alter table public.connect_codes rename column mom_id to senior_id;
alter index if exists public.connect_codes_mom_idx rename to connect_codes_senior_idx;

-- ── auth.users app_metadata role 백필 (JWT 클레임) ──
update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', 'parent')
  where (raw_app_meta_data->>'role') = 'mom';
update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', 'manager')
  where (raw_app_meta_data->>'role') = 'child';

-- ── 함수 재생성 (컬럼명 변경 반영) ──

-- is_linked: 가족 연결 판정 (양방향). 컬럼명만 senior_id/manager_id 로.
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

-- handle_new_user: 기본/검증 role 3값. parent|grandparent|manager.
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

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', v_role)
  where id = new.id;

  return new;
end;
$$;

-- redeem_connect_code: 관리자가 어르신 연결. senior_id/manager_id 사용.
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
