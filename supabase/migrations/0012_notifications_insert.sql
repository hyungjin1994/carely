-- 0012: notifications INSERT 정책 추가.
-- 약/일정 등록 시 본인 알림을 예약(insert)할 수 있게 한다.
-- 지금까지는 RLS 에 insert 정책이 없어 예약이 조용히 실패 → 크론이 보낼 알림이 안 쌓였음.
create policy notifications_insert_self on public.notifications
  for insert with check (user_id = auth.uid());
