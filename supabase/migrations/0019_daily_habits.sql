-- 0019: 오늘의 한 가지(daily_habits) — 매일 작은 건강 행동 하나.
--
-- 왜: 인지 건강은 게임보다 생활 습관의 영향이 크다. 운동·수면·사회적 교류가
-- 효과가 검증된 축인데 앱에 그 축이 없었다. 게임 6종은 인지 자극만 다룬다.
--
-- 하루에 한 가지만 권한다. 여러 개를 주면 목록이 되고, 목록은 부담이 된다.
-- 행동 문구는 코드 상수(lib/habits.ts)에서 날짜로 결정한다 — DB 아님.
-- 카테고리를 날마다 돌려서 이틀 연속 같은 종류가 나오지 않게 한다.

create table public.daily_habits (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  date     date not null,
  -- lib/habits.ts 의 행동 id. 문구를 고쳐도 기록은 남는다.
  habit_id text not null,
  done_at  timestamptz not null default now(),
  -- 하루 한 건만. 중복 적립도 이 제약으로 막는다.
  primary key (user_id, date)
);

create index daily_habits_user_idx on public.daily_habits(user_id, date desc);

alter table public.daily_habits enable row level security;

create policy daily_habits_self on public.daily_habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 자녀가 어르신의 실천 여부를 볼 수 있게 (모니터링은 읽기 전용).
create policy daily_habits_family_read on public.daily_habits
  for select using (public.is_linked(auth.uid(), user_id));

-- point_ledger.reason 에 'habit' 추가. 없으면 적립이 제약 위반으로 실패한다.
alter table public.point_ledger drop constraint if exists point_ledger_reason_check;
alter table public.point_ledger
  add constraint point_ledger_reason_check
  check (reason in ('game','photo','exchange','habit'));
