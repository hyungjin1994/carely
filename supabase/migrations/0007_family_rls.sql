-- 0007: 관리자(연결된 가족)가 어르신의 모니터링 데이터를 읽을 수 있도록 가족 읽기 정책 추가.
-- is_linked(auth.uid(), user_id) = 연결된 가족이면 true. 기존 self 정책과 OR 로 결합(permissive).
-- 쓰기는 여전히 본인만 — 모니터링은 읽기 전용.

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
