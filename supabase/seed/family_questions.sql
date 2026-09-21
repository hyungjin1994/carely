-- 가족 회상 질문 seed (83개).
--
-- 사용법
--   1. 0016_family_questions.sql 을 먼저 실행한다.
--   2. /connect 에서 어머니와 연결이 되어 있어야 한다 (family_links 행이 있어야 함).
--   3. 이 파일을 Supabase SQL Editor 에 붙여넣고 실행한다.
--      연결이 하나면 senior/author 를 자동으로 찾는다. 여러 개면 아래 v_senior/v_author 를
--      직접 채운다. (id 확인: select senior_id, manager_id from public.family_links;)
--
-- 재실행해도 안전하다 — unique(senior_id, prompt) 로 중복이 무시된다.
-- 그래서 질문을 추가한 뒤 이 파일을 다시 돌리면 새 것만 들어간다.
--
-- ── 질문을 고치거나 지울 때 ──
-- 여기서 문구를 고치면 새 질문으로 들어간다(prompt 가 unique 키라서).
-- 이미 들어간 질문의 문구를 바꾸려면 DB 에서 직접 update 할 것.
--   update public.family_questions set prompt = '...' where id = '...';
-- 빼고 싶으면 지우지 말고 active = false 로 둔다 (답변 기록이 살아 있다).
--
-- ── 작성 원칙 ──
-- · 실패할 수 없는 질문을 쓴다. "몇 년도에?" 보다 "어땠어요?" 가 낫다.
-- · 냄새·소리·맛을 건드리는 질문이 기억을 가장 잘 연다.
-- · 자녀(형진)가 프레임 안에 있는 질문이 양쪽 모두에게 값이 크다.
-- · month 를 채운 질문은 그 달에 우선 출제한다. 김장은 11월, 설날은 1~2월.

do $$
declare
  v_senior uuid;
  v_author uuid;
  v_count  integer;
begin
  -- 연결이 하나면 자동 결정. 여러 개면 아래 select 를 지우고 두 변수를 직접 채운다.
  select l.senior_id, l.manager_id
    into v_senior, v_author
    from public.family_links l
   where l.status = 'active'
   order by l.created_at
   limit 1;

  if v_senior is null then
    raise exception '연결된 가족이 없습니다. /connect 에서 어머니와 먼저 연결하세요.';
  end if;

  insert into public.family_questions (senior_id, author_id, prompt, month) values
    -- ── 우리 가족의 "처음" ──
    (v_senior, v_author, '우리 가족이 처음으로 해외여행 간 곳이 어디였어요?', null),
    (v_senior, v_author, '우리가 제일 처음 살았던 동네가 어디예요? 구랑 동까지 기억나세요?', null),
    (v_senior, v_author, '우리 집에 처음 생긴 자동차가 무슨 차였어요?', null),
    (v_senior, v_author, '우리 가족끼리 처음으로 외식했던 데, 기억나세요?', null),
    (v_senior, v_author, '우리 집에서 처음 키운 동물 이름이 뭐였어요?', null),
    (v_senior, v_author, '형진이가 처음 학교 가던 날, 어떠셨어요?', 3),

    -- ── 형진이에 대해 ──
    (v_senior, v_author, '형진이가 좋아하는 음식이 뭘까요?', null),
    (v_senior, v_author, '형진이 낳으실 때 어떤 기분이었어요?', null),
    (v_senior, v_author, '형진이 키우면서 제일 힘들었던 일이 뭐예요?', null),
    (v_senior, v_author, '형진이 이름은 누가 지었어요? 무슨 뜻이에요?', null),
    (v_senior, v_author, '형진이가 어릴 때 뭐가 되고 싶다고 했어요?', null),
    (v_senior, v_author, '형진이 어릴 때 별명이 있었어요?', null),
    (v_senior, v_author, '형진이가 어릴 때 제일 안 먹던 음식이 뭐예요?', null),
    (v_senior, v_author, '형진이 어릴 때 제일 좋아했던 장난감이 뭐였어요?', null),
    (v_senior, v_author, '형진이 때문에 제일 놀라셨던 적이 언제예요?', null),
    (v_senior, v_author, '형진이랑 둘이 제일 많이 갔던 데가 어디예요?', null),
    (v_senior, v_author, '형진이가 어릴 때 제일 웃겼던 일이 뭐예요?', null),
    (v_senior, v_author, '형진이가 어머니랑 제일 닮은 데가 어디예요?', null),

    -- ── 제일 ~했던 ──
    (v_senior, v_author, '살면서 제일 맛있게 드셨던 음식이 뭐예요?', null),
    (v_senior, v_author, '제일 행복했던 순간이 언제예요?', null),
    (v_senior, v_author, '제일 크게 웃었던 날이 언제예요?', null),
    (v_senior, v_author, '제일 자랑스러웠던 순간이 언제예요?', null),
    (v_senior, v_author, '살면서 제일 잘한 결정이 뭐라고 생각하세요?', null),
    (v_senior, v_author, '제일 고마웠던 사람이 누구예요?', null),

    -- ── 우리 집 이야기 ──
    (v_senior, v_author, '우리 집 김치는 남의 집이랑 뭐가 달랐어요?', null),
    (v_senior, v_author, '명절에 우리 집에서 꼭 하던 게 뭐였어요?', null),
    (v_senior, v_author, '형진이한테 제일 자주 하시던 말이 뭐였어요?', null),
    (v_senior, v_author, '우리 집에서 제일 오래된 물건이 뭐예요?', null),
    (v_senior, v_author, '아버지랑 어머니 중에 누가 더 엄했어요?', null),

    -- ── 여행·나들이 ──
    (v_senior, v_author, '우리 가족이 제일 많이 갔던 데가 어디예요?', null),
    (v_senior, v_author, '여행 가서 제일 기억에 남는 일이 뭐예요?', null),
    (v_senior, v_author, '가보고 싶은데 아직 못 가본 데가 있어요?', null),

    -- ── 어머니의 어린 시절 ──
    (v_senior, v_author, '어릴 적 살던 집, 대문 열고 들어가면 뭐가 제일 먼저 보였어요?', null),
    (v_senior, v_author, '그 집에서 제일 좋아하던 자리가 어디였어요?', null),
    (v_senior, v_author, '어릴 때 동네에서 제일 무서웠던 데가 어디예요?', null),
    (v_senior, v_author, '학교 가는 길에 꼭 지나가던 데가 있었어요?', null),
    (v_senior, v_author, '어릴 적 제일 친했던 친구, 어떤 아이였어요?', null),
    (v_senior, v_author, '어릴 때 제일 갖고 싶었던 게 뭐예요?', null),
    (v_senior, v_author, '어릴 때 뭐가 되고 싶으셨어요?', null),
    (v_senior, v_author, '학교에서 제일 좋아하던 과목이 뭐였어요?', null),
    (v_senior, v_author, '어릴 때 제일 크게 혼났던 일이 뭐예요?', null),

    -- ── 냄새·소리·맛 ──
    (v_senior, v_author, '어릴 적 집에서 나던 냄새 중에 아직 기억나는 게 있어요?', null),
    (v_senior, v_author, '아침에 눈 뜨면 제일 먼저 들리던 소리가 뭐였어요?', null),
    (v_senior, v_author, '어머니가 해주시던 음식 중에 제일 생각나는 게 뭐예요?', null),
    (v_senior, v_author, '어릴 때 제일 맛있게 먹던 군것질이 뭐예요?', null),
    (v_senior, v_author, '비 오는 날 하면 떠오르는 장면이 있어요?', 7),
    (v_senior, v_author, '겨울 되면 생각나는 냄새가 있어요?', 12),

    -- ── 처녀 시절 ──
    (v_senior, v_author, '처녀 때 제일 아꼈던 옷이나 물건이 뭐였어요?', null),
    (v_senior, v_author, '처음 돈 벌어봤을 때 그 돈으로 뭐 하셨어요?', null),
    (v_senior, v_author, '젊었을 때 제일 자주 부르던 노래가 뭐예요?', null),
    (v_senior, v_author, '그때 유행하던 머리 모양이랑 옷차림이 어땠어요?', null),
    (v_senior, v_author, '처음 기차 타고 멀리 가봤던 게 어디였어요?', null),
    (v_senior, v_author, '처녀 때 제일 친했던 친구는 지금 어떻게 지내요?', null),
    (v_senior, v_author, '그때 극장에서 본 영화 중에 기억나는 게 있어요?', null),

    -- ── 아버지와 ──
    (v_senior, v_author, '아버지 처음 봤을 때 어떤 생각 드셨어요?', null),
    (v_senior, v_author, '아버지 어디가 제일 마음에 드셨어요?', null),
    (v_senior, v_author, '결혼하시던 날 제일 기억에 남는 순간이 뭐예요?', null),
    (v_senior, v_author, '신혼 때 살던 집은 어떤 집이었어요?', null),
    (v_senior, v_author, '아버지가 제일 잘하시던 게 뭐였어요?', null),
    (v_senior, v_author, '아버지가 제일 좋아하시던 음식이 뭐였어요?', null),
    (v_senior, v_author, '아버지랑 제일 많이 갔던 데가 어디예요?', null),
    (v_senior, v_author, '아버지한테 제일 고마웠던 게 뭐예요?', null),

    -- ── 시댁·살림 ──
    (v_senior, v_author, '시집오셔서 제일 힘들었던 게 뭐였어요?', null),
    (v_senior, v_author, '처음 해본 살림 중에 제일 어려웠던 게 뭐예요?', null),
    (v_senior, v_author, '시어머니한테 배운 음식이 있어요?', null),
    (v_senior, v_author, '살림하면서 제일 아끼던 물건이 뭐였어요?', null),

    -- ── 동네·이웃 ──
    (v_senior, v_author, '옛날 동네에서 제일 친했던 이웃이 누구였어요?', null),
    (v_senior, v_author, '그때 동네에 뭐가 있었어요? 가게나 시장 같은 거요', null),
    (v_senior, v_author, '살아본 동네 중에 어디가 제일 좋았어요?', null),

    -- ── 계절·명절 (제철에 우선 출제) ──
    (v_senior, v_author, '옛날 설날 아침은 어떻게 시작됐어요?', 2),
    (v_senior, v_author, '김장하던 날 풍경이 어땠어요?', 11),
    (v_senior, v_author, '여름에 더울 때 어떻게 지내셨어요?', 8),
    (v_senior, v_author, '추석에 제일 기다려지던 게 뭐였어요?', 9),
    (v_senior, v_author, '봄 되면 제일 먼저 하시던 일이 뭐예요?', 4),
    (v_senior, v_author, '겨울에 제일 많이 해 드시던 음식이 뭐예요?', 1),

    -- ── 세상의 변화 ──
    (v_senior, v_author, '집에 처음 텔레비전 들어왔을 때, 기억나세요?', null),
    (v_senior, v_author, '처음 전화기 생겼을 때 어땠어요?', null),
    (v_senior, v_author, '처음 휴대폰 쓰셨을 때 어떠셨어요?', null),
    (v_senior, v_author, '옛날이랑 지금이랑 제일 많이 달라진 게 뭐라고 생각하세요?', null),

    -- ── 요즘·앞으로 ──
    (v_senior, v_author, '요즘 제일 재밌는 게 뭐예요?', null),
    (v_senior, v_author, '요즘 제일 자주 생각나는 사람이 누구예요?', null),
    (v_senior, v_author, '앞으로 꼭 해보고 싶은 게 있어요?', null),
    (v_senior, v_author, '형진이한테 바라는 게 있어요?', null)
  on conflict (senior_id, prompt) do nothing;

  select count(*) into v_count
    from public.family_questions
   where senior_id = v_senior and active;

  raise notice '질문 % 개 준비됨 (어머니 %)', v_count, v_senior;
end $$;

-- ── 곁에 계실 때만 물어야 하는 질문 ──
-- 아래 셋은 회상 효과가 가장 큰 축에 속하지만, 돌아가신 분 이야기나 힘들었던
-- 기억이 나올 수 있다. 혼자 답하게 두지 말고 형진이가 곁에 있을 때만 켤 것.
-- 쓰실 때 active = true 로 바꾸세요.
--
-- do $$
-- declare v_senior uuid; v_author uuid;
-- begin
--   select senior_id, manager_id into v_senior, v_author
--     from public.family_links where status = 'active' order by created_at limit 1;
--   insert into public.family_questions (senior_id, author_id, prompt, active) values
--     (v_senior, v_author, '아버지랑 제일 크게 다퉜던 일, 기억나세요?', false),
--     (v_senior, v_author, '형진이 키우면서 제일 힘들었던 때는 언제예요?', false),
--     (v_senior, v_author, '요즘 제일 보고 싶은 사람이 누구예요?', false)
--   on conflict (senior_id, prompt) do nothing;
-- end $$;
