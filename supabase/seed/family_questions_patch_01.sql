-- 회상 질문 보정 01 — 자녀 호칭 자리표시자 · 시점 통일 · 부모와 남편 이야기
--
-- 이미 DB 에 들어간 83개의 문구를 고치고 새 질문 29개를 넣는다.
-- family_questions.prompt 가 unique 키라서 seed 파일만 고치면 문구를 바꾼 것이
-- 아니라 새 질문으로 들어간다. 그래서 기존 것은 update 로 고쳐야 한다.
--
-- 선행: 0023_child_label.sql
-- 한 번만 돌리면 된다. 다시 돌려도 안전하다 (update 는 대상이 없으면 0건,
-- insert 는 on conflict do nothing).
--
-- ── 무엇을 고치나 ──
-- (1) 자녀 이름이 문구에 박혀 있었다 — "형진이가 좋아하는 음식이 뭘까요?".
--     이 앱은 다른 가족도 쓴다. `{자녀}` 자리표시자로 바꾸고 출제할 때
--     family_links.child_label 로 치환한다(lib/korean.ts).
--     조사가 받침 유무로 갈리므로 문구에 조사 쌍을 적는다 — "{자녀}이/가".
--
-- (2) 사람 지칭의 시점이 섞여 있었다. 같은 단어가 다른 사람을 가리켰다.
--       "형진이가 어머니랑 제일 닮은 데"          어머니 = 읽는 분 본인
--       "어머니가 해주시던 음식 중에"             어머니 = 읽는 분의 어머니
--       "아버지랑 어머니 중에 누가 더 엄했어요"   아버지 = 읽는 분의 아버지
--       "아버지 처음 봤을 때 어떤 생각"           아버지 = 읽는 분의 배우자
--     읽는 분 시점으로 통일한다.
--       자녀 → {자녀} · 배우자 → 남편 · 본인의 부모 → 엄마·아빠
--       본인은 지칭하지 않는다 ("~하셨어요" 로 충분하다)
--
-- (3) 엄마·아빠와 남편 이야기를 묻는 질문이 거의 없었다. 22개를 넣는다.
--     돌아가신 분이어도 **좋았던 기억을 묻는 질문은 혼자 답해도 괜찮다.**
--     회상 요법에서 긍정적 회상은 슬픔을 덧내지 않고 관계를 이어가는 쪽으로
--     작동한다(continuing bonds). 상실 자체를 건드리는 질문만 active = false 로
--     분리해 자녀가 곁에 있을 때만 연다.

begin;

-- ── 1. 문구 교체 ──
update public.family_questions
   set prompt = '{자녀}이/가 처음 학교 가던 날, 어떠셨어요?'
 where prompt = '형진이가 처음 학교 가던 날, 어떠셨어요?';

update public.family_questions
   set prompt = '{자녀}이/가 좋아하는 음식이 뭘까요?'
 where prompt = '형진이가 좋아하는 음식이 뭘까요?';

update public.family_questions
   set prompt = '{자녀} 낳으실 때 어떤 기분이었어요?'
 where prompt = '형진이 낳으실 때 어떤 기분이었어요?';

update public.family_questions
   set prompt = '{자녀} 키우면서 제일 힘들었던 일이 뭐예요?'
 where prompt = '형진이 키우면서 제일 힘들었던 일이 뭐예요?';

update public.family_questions
   set prompt = '{자녀} 이름은 누가 지었어요? 무슨 뜻이에요?'
 where prompt = '형진이 이름은 누가 지었어요? 무슨 뜻이에요?';

update public.family_questions
   set prompt = '{자녀}이/가 어릴 때 뭐가 되고 싶다고 했어요?'
 where prompt = '형진이가 어릴 때 뭐가 되고 싶다고 했어요?';

update public.family_questions
   set prompt = '{자녀} 어릴 때 별명이 있었어요?'
 where prompt = '형진이 어릴 때 별명이 있었어요?';

update public.family_questions
   set prompt = '{자녀}이/가 어릴 때 제일 안 먹던 음식이 뭐예요?'
 where prompt = '형진이가 어릴 때 제일 안 먹던 음식이 뭐예요?';

update public.family_questions
   set prompt = '{자녀} 어릴 때 제일 좋아했던 장난감이 뭐였어요?'
 where prompt = '형진이 어릴 때 제일 좋아했던 장난감이 뭐였어요?';

update public.family_questions
   set prompt = '{자녀} 때문에 제일 놀라셨던 적이 언제예요?'
 where prompt = '형진이 때문에 제일 놀라셨던 적이 언제예요?';

update public.family_questions
   set prompt = '{자녀}이랑/랑 둘이 제일 많이 갔던 데가 어디예요?'
 where prompt = '형진이랑 둘이 제일 많이 갔던 데가 어디예요?';

update public.family_questions
   set prompt = '{자녀}이/가 어릴 때 제일 웃겼던 일이 뭐예요?'
 where prompt = '형진이가 어릴 때 제일 웃겼던 일이 뭐예요?';

update public.family_questions
   set prompt = '{자녀}이/가 누구를 제일 많이 닮았어요?'
 where prompt = '형진이가 어머니랑 제일 닮은 데가 어디예요?';

update public.family_questions
   set prompt = '{자녀}한테 제일 자주 하시던 말이 뭐였어요?'
 where prompt = '형진이한테 제일 자주 하시던 말이 뭐였어요?';

update public.family_questions
   set prompt = '{자녀}한테 바라는 게 있어요?'
 where prompt = '형진이한테 바라는 게 있어요?';

update public.family_questions
   set prompt = '남편 처음 봤을 때 어떤 생각 드셨어요?'
 where prompt = '아버지 처음 봤을 때 어떤 생각 드셨어요?';

update public.family_questions
   set prompt = '남편 어디가 제일 마음에 드셨어요?'
 where prompt = '아버지 어디가 제일 마음에 드셨어요?';

update public.family_questions
   set prompt = '남편이 제일 잘하시던 게 뭐였어요?'
 where prompt = '아버지가 제일 잘하시던 게 뭐였어요?';

update public.family_questions
   set prompt = '남편이 제일 좋아하시던 음식이 뭐였어요?'
 where prompt = '아버지가 제일 좋아하시던 음식이 뭐였어요?';

update public.family_questions
   set prompt = '남편이랑 제일 많이 갔던 데가 어디예요?'
 where prompt = '아버지랑 제일 많이 갔던 데가 어디예요?';

update public.family_questions
   set prompt = '남편한테 제일 고마웠던 게 뭐예요?'
 where prompt = '아버지한테 제일 고마웠던 게 뭐예요?';

update public.family_questions
   set prompt = '아빠랑 엄마 중에 누가 더 엄했어요?'
 where prompt = '아버지랑 어머니 중에 누가 더 엄했어요?';

update public.family_questions
   set prompt = '엄마가 해주시던 음식 중에 제일 생각나는 게 뭐예요?'
 where prompt = '어머니가 해주시던 음식 중에 제일 생각나는 게 뭐예요?';

-- ── 2. 엄마 아빠 · 남편 이야기 ──
do $$
declare
  v_senior uuid;
  v_author uuid;
begin
  select l.senior_id, l.manager_id
    into v_senior, v_author
    from public.family_links l
   where l.status = 'active'
   order by l.created_at
   limit 1;

  if v_senior is null then
    raise exception '연결된 가족이 없습니다.';
  end if;

  insert into public.family_questions (senior_id, author_id, prompt, active) values
    -- ── 엄마 아빠 ──
    (v_senior, v_author, '아빠는 어떤 분이셨어요?', true),
    (v_senior, v_author, '엄마는 어떤 분이셨어요?', true),
    (v_senior, v_author, '엄마한테 제일 많이 들었던 말이 뭐예요?', true),
    (v_senior, v_author, '엄마한테 배운 음식이 있어요?', true),
    (v_senior, v_author, '엄마가 제일 잘하시던 게 뭐였어요?', true),
    (v_senior, v_author, '엄마랑 같이 하던 일 중에 제일 기억나는 게 뭐예요?', true),
    (v_senior, v_author, '아빠가 제일 좋아하시던 음식이 뭐였어요?', true),
    (v_senior, v_author, '아빠랑 제일 기억에 남는 일이 뭐예요?', true),
    (v_senior, v_author, '아빠가 일하시던 모습, 기억나세요?', true),
    (v_senior, v_author, '엄마 아빠는 어떻게 만나셨는지 들으신 적 있어요?', true),
    (v_senior, v_author, '엄마 아빠가 제일 자랑스러워하셨던 일이 뭐예요?', true),

    -- ── 남편 ──
    --
    -- 전부 과거형이고 좋았던 기억만 묻는다. 병·임종은 넣지 않았다.
    (v_senior, v_author, '두 분은 어떻게 만나셨어요?', true),
    (v_senior, v_author, '남편이 제일 자주 하시던 말이 뭐예요?', true),
    (v_senior, v_author, '남편 웃는 모습, 어땠어요?', true),
    (v_senior, v_author, '남편이랑 제일 많이 웃었던 일이 뭐예요?', true),
    (v_senior, v_author, '남편이 좋아하시던 노래가 뭐였어요?', true),
    (v_senior, v_author, '남편 젊었을 때 어떤 모습이었어요?', true),
    (v_senior, v_author, '남편이 {자녀}을/를 제일 예뻐했던 순간이 뭐예요?', true),
    (v_senior, v_author, '남편이 {자녀}한테 자주 하시던 말이 있어요?', true),
    (v_senior, v_author, '남편이랑 같이 간 여행 중에 제일 좋았던 데가 어디예요?', true),
    (v_senior, v_author, '남편이랑 같이 본 영화나 드라마가 있어요?', true),
    (v_senior, v_author, '남편이 제일 아끼던 물건이 뭐였어요?', true),

    -- ── 곁에 있을 때만 (active = false) ──
    --
    -- 자녀가 옆에 있을 때 열고, 끝나면 다시 닫는다.
    (v_senior, v_author, '남편이랑 제일 크게 다퉜던 일, 기억나세요?', false),
    (v_senior, v_author, '요즘 제일 보고 싶은 사람이 누구예요?', false),
    (v_senior, v_author, '요즘 제일 자주 생각나는 사람이 누구예요?', false),
    (v_senior, v_author, '남편한테 지금 제일 하고 싶은 말이 뭐예요?', false),
    (v_senior, v_author, '남편이 제일 그리울 때가 언제예요?', false),
    (v_senior, v_author, '엄마 아빠가 제일 보고 싶을 때가 언제예요?', false),
    (v_senior, v_author, '남편이 {자녀}을/를 보면 뭐라고 하실 것 같아요?', false)
  on conflict (senior_id, prompt) do nothing;
end $$;

-- ── 3. 이미 active 로 들어간 질문 하나를 닫는다 ──
--
-- '요즘 제일 자주 생각나는 사람이 누구예요?' 는 active = true 로 들어가 있었다.
-- 부모와 배우자가 모두 고인이면 이 질문은 거의 확실히 그분들로 이어지는데
-- 혼자 답하게 되어 있었다. '요즘 제일 보고 싶은 사람' 은 민감 질문으로 분리해
-- 두고 이건 놓친 것이라 같이 닫는다.
update public.family_questions
   set active = false
 where prompt = '요즘 제일 자주 생각나는 사람이 누구예요?';

commit;

-- ── 확인 ──
-- select active, count(*) from public.family_questions group by active;
--   → true 104 · false 7
-- select prompt from public.family_questions where prompt like '%{자녀}%';
--   → 18개
-- select prompt from public.family_questions where prompt like '%형진%';
--   → 0개
--
-- ── 자녀 호칭 정하기 (비워두면 관리자 이름, 그것도 없으면 "아이") ──
-- update public.family_links set child_label = '형진이' where status = 'active';
--
-- ── 곁에 있을 때만 하는 질문 열기 ──
-- update public.family_questions set active = true
--  where prompt = '남편한테 지금 제일 하고 싶은 말이 뭐예요?';
-- (끝나면 다시 false 로)
