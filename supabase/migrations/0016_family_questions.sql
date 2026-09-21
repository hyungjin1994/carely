-- 0016: 가족 회상 질문(family_questions) + 어머니 답변(family_answers).
--
-- 무엇: 자녀가 낸 주관식 질문을 어머니가 읽고 답하고, 자녀가 답장한다.
--
-- 왜 게임이 아닌가: 이건 채점하지 않는다. 목적이 "맞히기"가 아니라 "생각하게 하기"다.
-- 어머니가 당신 고향이나 자식 이름을 틀렸을 때 오답 표시를 띄우는 것은 해롭고,
-- 답을 못 하셔도 질문을 읽고 떠올리신 것으로 이미 목적을 달성한다.
-- 그래서 정답 컬럼도, 점수도, 포인트 적립도 없다.
--   → 포인트가 붙으면 정오 판정이 따라오고, 자녀가 쉬운 질문을 양산해
--     포인트를 몰아주는 구멍도 생긴다.
--
-- 같은 질문을 다시 물어도 된다 (질문 1 : 답변 N):
--   상식 퀴즈는 중복이 결함이지만 회상은 다르다. "제일 행복했던 순간"에 대한 답이
--   작년과 올해 다른 것 자체가 기록으로서 가치가 있다.
--   그래서 quiz_seen(0015) 회전을 재사용하지 않는다 — family_answers.answered_at 이
--   곧 출제 이력이고, "마지막으로 답한 게 가장 오래된 질문" 순으로 뽑으면 된다.

-- ── 자녀가 낸 질문 ──
create table public.family_questions (
  id         uuid primary key default gen_random_uuid(),
  senior_id  uuid not null references public.profiles(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  prompt     text not null,
  -- 제철 질문용 힌트(1~12). 김장 질문은 11월에, 설날 질문은 1~2월에 나와야
  -- 자연스럽다. null 이면 아무 때나 출제 가능.
  month      smallint check (month between 1 and 12),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  -- 같은 어머니에게 같은 질문을 두 번 등록하지 않는다 (seed 재실행도 안전해진다).
  unique (senior_id, prompt)
);
create index family_questions_senior_idx on public.family_questions(senior_id, active);

-- ── 어머니 답변 + 자녀 답장 ──
create table public.family_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.family_questions(id) on delete cascade,
  senior_id   uuid not null references public.profiles(id) on delete cascade,
  -- text 가 비어 있으면 "질문은 봤지만 답은 안 하신" 것으로 읽는다.
  -- 그것도 출제 이력이므로 행을 남긴다.
  -- (음성 답변은 다음 단계 — audio_path 컬럼을 여기에 추가하면 된다.)
  text        text,
  answered_at timestamptz not null default now(),
  replied_by  uuid references public.profiles(id) on delete set null,
  reply_text  text,
  replied_at  timestamptz
);
create index family_answers_question_idx on public.family_answers(question_id, answered_at desc);
create index family_answers_senior_idx on public.family_answers(senior_id, answered_at desc);

alter table public.family_questions enable row level security;
alter table public.family_answers   enable row level security;

-- ── 질문: 어머니는 읽기만, 연결된 자녀는 전권 ──
create policy family_questions_senior_read on public.family_questions
  for select using (senior_id = auth.uid());

create policy family_questions_family_manage on public.family_questions
  for all using (public.is_linked(auth.uid(), senior_id))
  with check (public.is_linked(auth.uid(), senior_id));

-- ── 답변: 어머니가 쓰고, 어머니와 연결된 자녀가 읽고, 자녀가 답장(update) ──
create policy family_answers_senior_write on public.family_answers
  for insert with check (senior_id = auth.uid());

create policy family_answers_senior_read on public.family_answers
  for select using (senior_id = auth.uid());

create policy family_answers_family_read on public.family_answers
  for select using (public.is_linked(auth.uid(), senior_id));

-- 자녀의 답장. 어머니가 쓴 답변 본문(text)까지 고칠 수 있게 되지만,
-- 컬럼 단위 제한은 RLS 로 표현할 수 없다. 자녀가 어머니 답을 고칠 동기가 없고
-- 어차피 어머니 일정·환전까지 관리하는 권한을 이미 가진 관계이므로 허용한다.
create policy family_answers_family_reply on public.family_answers
  for update using (public.is_linked(auth.uid(), senior_id))
  with check (public.is_linked(auth.uid(), senior_id));
