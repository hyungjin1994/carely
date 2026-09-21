-- 0018: 가족 알림 — 어머니의 환전 신청을 자녀가 앱에서 바로 보게 한다.
--
-- ── 왜 지금은 알림이 오지 않았나 (원인 셋) ──
-- 1) requestExchange 가 exchange_requests 행만 넣고 알림을 만들지 않았다.
--    약(meds/actions.ts)·일정(calendar/actions.ts)은 notifications 에 넣는데 환전만 빠졌다.
-- 2) 코드를 넣어도 RLS 가 막는다. notifications_insert_self 는
--    `with check (user_id = auth.uid())` 라 본인 앞으로만 넣을 수 있다.
--    어머니가 자녀 앞으로 알림을 만드는 것은 차단되고, 조용히 실패한다.
--    (0012 주석이 경고한 것과 같은 함정이다.)
-- 3) VAPID 키가 배포 환경에 없어 크론이 푸시를 못 보낸다.
--
-- 이 마이그레이션은 1)과 2)를 해결한다. 3)은 앱 내 알림으로 우회한다 —
-- 푸시 없이도 자녀가 /connect 를 열면 바로 보이게 한다.

-- ── 읽음(확인) 처리용 ──
-- sent 는 푸시/이메일 발송 여부라 "사람이 확인했는지" 와 다른 개념이다.
alter table public.notifications add column if not exists read_at timestamptz;

create index if not exists notifications_unread_idx
  on public.notifications(user_id, read_at)
  where read_at is null;

-- 본인 알림을 읽음으로 바꿀 수 있게. select 만 있어서 확인 처리가 막혀 있었다.
create policy notifications_update_self on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

/**
 * 어르신이 연결된 자녀(관리자) 전원에게 알림을 만든다.
 *
 * SECURITY DEFINER 가 필요한 이유: notifications 의 insert 정책이 본인 앞으로만
 * 허용하므로 어머니가 자녀 앞으로 행을 넣을 수 없다.
 *
 * 남용 방지: 대상은 호출자(auth.uid())와 active 로 연결된 manager 로만 한정된다.
 * 임의 사용자에게 알림을 보낼 수는 없다.
 *
 * send_at 을 now() 로 두므로 크론이 푸시도 시도한다. VAPID 키가 없으면 실패 후
 * sent=true 로 표시되고(무한 재시도 방지) 앱 내 알림으로는 그대로 남는다.
 */
create or replace function public.notify_managers(
  p_kind text, p_title text, p_body text
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

  insert into public.notifications (user_id, kind, title, body, send_at)
  select fl.manager_id, p_kind, p_title, p_body, now()
    from public.family_links fl
   where fl.senior_id = uid
     and fl.status = 'active';

  get diagnostics n = row_count;
  return n;
end;
$$;
