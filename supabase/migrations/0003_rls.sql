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
