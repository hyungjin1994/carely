-- 0024: 사진 회상 — 회상 질문에 사진을 붙인다.
--
-- 왜 새 테이블이 아닌가: 사진 질문은 "질문 하나 → 답 여러 개" 라는 기존 구조와
-- 완전히 같다. family_questions 에 photo_id 한 칸을 더하면 오늘의 질문 선택,
-- 답변 저장, 자녀 답장, 알림, 주간 리포트 집계가 전부 그대로 돌아간다.
-- 별도 테이블을 만들면 그 다섯 군데를 다 분기해야 한다.
--
-- 왜 photos.caption 이 아닌가: caption 은 사진 자체의 설명이고, 사진 주인만
-- 고칠 수 있다(0003 photos_owner). 자녀가 올린 사진에 어머니가 답을 쓰려면
-- 어머니가 남의 사진 행을 update 해야 해서 권한 모양이 어그러진다.
-- 답은 어머니 것이므로 family_answers 에 그대로 쌓는 게 맞다.
--
-- 사진은 회상 요법의 표준 도구다. 글로만 묻는 질문보다 훨씬 강하게 기억을 연다
-- ("이 사진 어디서 찍은 거예요?" 가 "여행 중 기억나는 일" 보다 잘 열린다).

alter table public.family_questions
  add column if not exists photo_id uuid references public.photos(id) on delete set null;

comment on column public.family_questions.photo_id is
  '이 질문과 함께 보여줄 사진. null 이면 글만 있는 질문.';

-- 사진 하나로 질문이 몇 개 걸려 있는지 보는 경로(삭제 트리거)가 있어서 색인을 둔다.
create index if not exists family_questions_photo_idx
  on public.family_questions(photo_id)
  where photo_id is not null;

-- ── 중복 방지 키에 사진을 포함시킨다 ──
--
-- 원래 unique (senior_id, prompt) 였다. seed 재실행을 안전하게 만들려고 둔 것인데
-- 사진 질문에는 그대로 쓸 수 없다. 사진 회상에서 제일 잘 먹는 문구는 사진마다
-- 같기 때문이다 — "이 사진, 어디서 찍은 거예요?" 를 두 번째 사진에 쓰면
-- 중복으로 막힌다. 사진이 다르면 다른 질문이다.
--
-- nulls not distinct: 글만 있는 질문(photo_id is null)은 예전처럼 문구로 중복을
-- 막아야 한다. 기본 동작은 NULL 을 서로 다른 값으로 봐서 같은 문구가 계속
-- 들어가므로, 명시해 준다. (PostgreSQL 15+)
alter table public.family_questions
  drop constraint if exists family_questions_senior_id_prompt_key;

do $$
begin
  alter table public.family_questions
    add constraint family_questions_senior_prompt_photo_key
    unique nulls not distinct (senior_id, prompt, photo_id);
exception
  when duplicate_table or duplicate_object then null;  -- 이미 있으면 통과
end $$;

-- ── 사진이 지워지면 그 질문을 내린다 ──
--
-- FK 가 on delete set null 이라 사진만 사라지고 질문은 남는다. 그런데 사진
-- 질문의 문구는 사진 없이는 뜻이 없다 — "이 사진, 어디서 찍은 거예요?" 가
-- 사진 없이 출제되면 답할 수가 없다.
--
-- cascade 로 질문까지 지우는 쪽은 택하지 않았다. 질문이 지워지면 family_answers
-- 도 함께 지워져(0016 cascade) **어머니가 해주신 이야기가 사라진다.** 사진 한 장
-- 정리했다가 이야기를 잃는 건 받아들일 수 없다.
--
-- 그래서 질문은 남기고 active = false 로 내린다. 답변 기록은 그대로 있고,
-- 다시 출제되지만 않는다.
create or replace function public.deactivate_photo_questions()
returns trigger
language plpgsql
-- security definer: 사진 주인이 어머니일 수도 있는데, 어머니는 질문에 select
-- 권한만 있다(0016). 그대로면 update 가 조용히 0행이 되어 깨진 질문이 남는다.
-- 하는 일은 "지워지는 사진을 가리키는 질문을 내리는 것" 하나뿐이다.
security definer
set search_path = public
as $$
begin
  update public.family_questions
     set active = false
   where photo_id = old.id;
  return old;
end $$;

drop trigger if exists photos_deactivate_questions on public.photos;
create trigger photos_deactivate_questions
  before delete on public.photos
  for each row execute function public.deactivate_photo_questions();

-- ── 확인 ──
-- select column_name from information_schema.columns
--  where table_name = 'family_questions' and column_name = 'photo_id';
-- select tgname from pg_trigger where tgname = 'photos_deactivate_questions';
