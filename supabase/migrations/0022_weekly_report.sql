-- 0022: 주간 리포트.
--
-- 무엇: 한 주 활동을 정리해 어머니에게는 시트로 띄우고, 자녀에게는 알림으로 보낸다.
--
-- 왜: 어머니 쪽에는 "내가 나아지고 있다" 는 피드백이 없었다. 포인트는 누적만 되고
-- 게임 레벨은 게임별로 흩어져 있어, 매일 뭔가 하는데 그게 어디로 가는지 안 보였다.
-- 인지 훈련의 최대 실패 원인은 효과가 안 보여서 그만두는 것이다.
-- 자녀 쪽에는 숫자만 있고 해석이 없었다 — 혈당 100, 게임 3판, 복약 2/3 이
-- 좋은 건지 나쁜 건지 알 수 없었다.
--
-- 수치는 저장하지 않는다. game_scores · daily_habits · measurements · med_doses ·
-- family_answers 를 주 단위로 집계해 매번 계산한다. 저장하면 나중에 원본이
-- 바뀔 때 어긋난다.
--
-- 크론에 의존하지 않는다. Vercel Hobby 는 크론이 하루 1회라 일요일 저녁 생성을
-- 맞출 수 없다. 앱을 열 때 "이번 주 것을 봤는지" 만 확인하면 된다.

-- ── 어머니가 이번 주 시트를 봤는지 ──
-- 이게 없으면 앱을 열 때마다 시트가 떠서 짜증 요소가 된다.
-- week_start = KST 기준 그 주 월요일.
create table public.weekly_report_seen (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  seen_at    timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.weekly_report_seen enable row level security;

create policy weekly_report_seen_self on public.weekly_report_seen
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

/**
 * 자녀에게 주간 리포트 알림을 만든다. 한 주에 한 번만.
 *
 * notify_managers 와 따로 두는 이유: 주간 리포트는 중복 생성을 막아야 한다.
 * 어머니가 주중에 앱을 여러 번 열어도 알림은 한 건이어야 한다.
 *
 * SECURITY DEFINER 인 이유는 notify_managers 와 같다 — notifications 의
 * insert 정책이 본인 앞으로만 허용하므로 어머니가 자녀 앞으로 넣을 수 없다.
 * 대상은 호출자와 active 로 연결된 manager 로만 한정된다.
 *
 * sent = true 로 넣는다. 푸시는 서버 액션이 그 자리에서 직접 보내므로
 * 크론이 다시 집어 중복 발송하면 안 된다(0020 과 같은 이유).
 */
create or replace function public.notify_managers_weekly(
  p_week_start date, p_title text, p_body text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n integer;
begin
  if uid is null then
    raise exception 'unauthenticated';
  end if;

  insert into public.notifications (user_id, kind, title, body, send_at, sent)
  select fl.manager_id, 'weekly', p_title, p_body, now(), true
    from public.family_links fl
   where fl.senior_id = uid
     and fl.status = 'active'
     and not exists (
       select 1
         from public.notifications x
        where x.user_id = fl.manager_id
          and x.kind = 'weekly'
          and (x.send_at at time zone 'Asia/Seoul')::date >= p_week_start
     );

  get diagnostics n = row_count;
  return n;
end;
$$;
