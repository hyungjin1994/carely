-- 0020: notify_managers 가 만든 알림은 크론을 기다리지 않는다.
--
-- 왜: Vercel 무료 플랜은 크론을 하루 1회로 제한한다(vercel.json 은 `0 23 * * *`).
-- 그래서 환전 신청 알림이 최대 13시간 뒤에야 발송된다 — 어머니가 돈을 기다리는
-- 상황이라 쓸 수 없다.
--
-- 해결: 환전 신청처럼 "사건이 일어난 순간" 보내면 되는 알림은 크론이 필요 없다.
-- 서버 액션이 그 자리에서 sendPushToUser 로 직접 발송한다(즉시·무료).
-- 크론은 약·일정처럼 미래 시각에 울려야 하는 예약 알림에만 필요하다.
--
-- 이 함수가 만든 행은 sent = true 로 넣는다. 그래야 크론이 다시 집어 중복
-- 발송하지 않는다. 행 자체는 앱 내 알림 배너(read_at is null)로 계속 보인다.
--   sent   = 발송 시도 완료 여부 (크론용)
--   read_at = 사람이 확인했는지 (배너용)
-- 두 개가 별개 개념이라 이렇게 나눌 수 있다.

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

  insert into public.notifications (user_id, kind, title, body, send_at, sent)
  select fl.manager_id, p_kind, p_title, p_body, now(), true
    from public.family_links fl
   where fl.senior_id = uid
     and fl.status = 'active';

  get diagnostics n = row_count;
  return n;
end;
$$;
