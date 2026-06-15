-- 0008: 일정(events) 강화 — 장소/동행/메모 컬럼 + 카테고리 확장 + 관리자 전체관리 정책.

alter table public.events add column if not exists place text;
alter table public.events add column if not exists with_whom text;
alter table public.events add column if not exists memo text;

-- type 카테고리 확장: 여행/모임/생일 추가
alter table public.events drop constraint if exists events_type_check;
alter table public.events
  add constraint events_type_check
  check (type in ('약','병원','운동','가족','여행','모임','생일','기타'));

-- 관리자(연결된 가족)가 어르신 일정을 추가/수정/삭제할 수 있도록 (events_owner self 정책과 OR).
create policy events_family_manage on public.events
  for all using (public.is_linked(auth.uid(), user_id))
  with check (public.is_linked(auth.uid(), user_id));
