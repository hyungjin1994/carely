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
  -- 어르신 초기 설정(온보딩) 정보
  birth_date    date,
  gender        text,
  height_cm     numeric,
  weight_kg     numeric,
  wake_time     text,
  sleep_time    text,
  meal_morning  text,
  meal_noon     text,
  meal_evening  text,
  exercise_time text,
  conditions    text[],
  allergies     text,
  living        text,
  emergency_name  text,
  emergency_phone text,
  onboarded     boolean not null default false,
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
