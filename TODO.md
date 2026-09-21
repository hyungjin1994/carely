# 다음에 할 일

> 2026-09-21 회사에서 작성. 집 노트북에서 이어서 작업하기 위한 인수인계.
> 코드는 전부 끝났고 **DB 마이그레이션만 남았다.**

---

## 0. 먼저 — 커밋 받기

회사에서 만든 커밋 6개가 `origin/main`에 올라가 있다. 집 노트북에서:

```bash
git pull
```

받아야 할 커밋 (오래된 것부터):

```
6e51da3  퀴즈 문제 다양화: 지식 파생 출제 + 보기 셔플
612844b  퀴즈·단어: 본 적 없는 문제 우선 출제 (출제 이력 기록)
169b7be  0015 마이그레이션 수정: FK 대상을 profiles 로, distinct 로
8f17101  단어 맞추기 은행 확충: 14 → 45건
9be702d  가족 회상 질문 스키마 + 질문 83개 seed
67dfe91  가족 회상 질문 UI — 어머니 답변 화면 + 자녀 답장 화면
```

⚠️ **회사 노트북에 커밋 안 된 변경이 따로 있다** (19개 파일, calendar·exchange·family·layout·timeline·next.config 등 — 이번 작업과 무관한 이전 작업). 그건 회사 노트북에만 남아 있으니, 나중에 합칠 때 충돌 여부를 확인할 것.

---

## 1. 어느 Supabase 프로젝트인지 확인

**회사에서 헛돌았던 부분이다. 반드시 먼저 확인할 것.**

회사에서 SQL Editor로 접속한 프로젝트는 **앱이 쓰는 프로젝트가 아니었다.** 증거:

| | 앱 화면(carely-care.vercel.app) | 회사에서 본 DB |
|---|---|---|
| 계정 | 규미님·형진 계정 있음, 6/14부터 연결 | `auth.users` 비어 있음 |
| 측정 | 공복 혈당 100 mg/dL 표시됨 | `measurements` 테이블 **없음** |
| 포인트 | 잔액 76,013P | — |

집 노트북에서는 이렇게 확인한다:

```bash
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```

나온 `https://<ref>.supabase.co` 의 `<ref>` 로 대시보드 접속:

```
supabase.com/dashboard/project/<ref>
```

---

## 2. 제대로 된 프로젝트인지 검증 (SQL Editor)

마이그레이션 돌리기 **전에** 이 쿼리로 확인한다. 또 엉뚱한 데 돌리지 않으려면 필수.

```sql
select (select count(*) from auth.users)                                  as 계정수,
       (select count(*) from public.profiles)                             as 프로필수,
       (select count(*) from public.family_links where status = 'active') as 연결수,
       to_regclass('public.measurements')     is not null as m0009_측정,
       to_regclass('public.photo_likes')      is not null as m0014_사진소셜,
       to_regclass('public.quiz_seen')        is not null as m0015_출제이력,
       to_regclass('public.family_questions') is not null as m0016_회상질문,
       exists(select 1 from information_schema.columns
               where table_schema='public' and table_name='profiles'
                 and column_name='onboarded')            as m0013_온보딩;
```

**기대값:**

```
계정수 2 이상 · 프로필수 2 이상 · 연결수 1 이상
m0009_측정 true · m0014_사진소셜 true · m0013_온보딩 true
m0015_출제이력 false · m0016_회상질문 false   ← 아직 안 돌렸으니 false 가 정상
```

- 계정수가 **0이면 잘못된 프로젝트다.** 1번으로 돌아갈 것
- m0009·m0014·m0013 중 `false` 가 있으면 그 마이그레이션부터 순서대로 돌릴 것
  (`0011_id_login.sql` 은 건너뛴다 — 기존 계정 이메일 도메인을 바꾸는 파일이라 지금 돌리면 로그인이 깨진다)

---

## 3. 마이그레이션 실행 (순서 중요)

SQL Editor 에 파일 내용을 붙여넣고 순서대로 실행.

```
1) supabase/migrations/0015_quiz_seen.sql        — 퀴즈 출제 이력
2) supabase/migrations/0016_family_questions.sql — 가족 회상 질문 스키마
3) supabase/seed/family_questions.sql            — 질문 83개
```

- 전부 **추가만 하는** 마이그레이션이다. 기존 테이블·데이터를 건드리는 구문이 없다
- seed 는 `family_links` 에서 어머니·형진 id 를 자동으로 찾는다. 이미 연결돼 있으니(6/14) 그냥 돌아간다
- 성공하면 `NOTICE: 질문 83 개 준비됨` 이 나온다
- seed 는 **재실행해도 안전**하다 (`unique(senior_id, prompt)`)

---

## 4. 동작 확인

### 퀴즈 출제 이력 (0015)

앱에서 **상식 퀴즈를 두 판** 돌린 뒤:

```sql
select qid, seen_count,
       to_char(seen_at at time zone 'Asia/Seoul', 'MM-DD HH24:MI') as 본시각
  from public.quiz_seen order by seen_at desc limit 30;
```

24행 정도 쌓여 있으면 정상. **0행이면 이력이 안 쌓이는 것**이고, 그래도 게임은 무작위 출제로 돌아가므로 화면으로는 구분이 안 된다 — 그래서 이 확인이 필요하다.

> SQL Editor 에서 `mark_quiz_seen` 을 직접 호출해봐도 확인이 안 된다. `auth.uid()` 가 null 이라 0행이 들어가고 조용히 넘어간다.

### 가족 회상 질문 (0016)

```
어머니 계정  →  홈 화면에 분홍/주황 "오늘의 질문" 카드가 떠 있어야 함
             →  누르면 /recall, 답 쓰고 보내기
형진 계정    →  /connect  →  "추억 이야기" 버튼 (답장 대기 있으면 주황색 + 개수)
             →  답변 읽고 답장
```

---

## 5. 정리 (선택)

회사에서 **엉뚱한 프로젝트에 0015·0016이 들어갔다.** 방치해도 무해하지만 나중에 헷갈릴 것 같으면 그 프로젝트에서:

```sql
drop table if exists public.family_answers, public.family_questions, public.quiz_seen;
drop function if exists public.mark_quiz_seen(text[]);
```

그 프로젝트는 `auth.users` 가 비어 있고 `measurements` 가 없는 쪽이다. **진짜 프로젝트에서 실행하지 않도록 주의.**

---

## 이번에 한 작업 요약

### 상식 퀴즈 다양화

- 문제 공간 **101 → 170 문구**. 파생 가능한 37문항을 지식 테이블로 재구조화
  (`CAPITALS` 29 · `SEASONAL` 6 · `IDIOMS` 18 → 양방향 2문제씩 파생)
- **정답 위치 편향 제거.** 기존엔 101문항 중 a:0 이 43개, a:3 이 2개로 쏠려
  "첫 보기 찍기"가 43% 정답이었다. 출제 시 보기 셔플 → 실측 25.0/25.0/25.0/25.0
- 오답을 같은 권역·카테고리에서 매 판 새로 뽑아 보기 조합이 매번 달라진다
- 같은 지식의 양방향이 한 판에 동시 출제되면 답이 유출되므로 `source` 로 차단

### 본 적 없는 문제 우선 출제

- `quiz_seen(user_id, qid)` + `mark_quiz_seen` RPC (0015)
- 문항에 안정적 id 부여 (`quiz:kr01` / `word:w01`). 식별자를 둘로 나눴다 —
  `source` 는 판 내 중복 방지(양방향 공유), `qid` 는 이력 키(방향까지 구분)
- **문제 은행을 `lib/games/quiz-bank.ts` 로 분리하고 `server-only` 로 잠갔다.**
  전에는 `engine.ts` 가 클라 컴포넌트에 import 되어 은행 전체가 클라 번들에
  실려 있었다. 이제 한 판 분량만 내려간다
- 첫 판은 play 페이지(이미 `force-dynamic`)가 서버에서 뽑아 넘기므로 추가 왕복 없음
- 이력 읽기·쓰기 실패는 게임을 막지 않는다 — "문제가 안 뜬다"가 "문제가 겹친다"보다 나쁘다
- 검증: 상식 퀴즈 **7일간 재등장 0**, 같은 날 2판 중복 59.8% → **0%**
- 단어 맞추기 은행 **14 → 45건** (회전은 은행이 하루 소비량 24를 넘어야 의미가 있다)

### 가족 회상 질문 (신규 기능)

- 자녀가 낸 주관식 질문을 어머니가 읽고 답하고, 자녀가 답장한다
- **채점하지 않는다.** 목적이 "맞히기"가 아니라 "생각하게 하기"다.
  정답 컬럼·점수·포인트가 없다 — 포인트가 붙으면 정오 판정이 따라오고,
  어머니가 당신 고향이나 자식 이름을 틀렸을 때 오답 표시를 띄우는 건 해롭다
- 질문 1 : 답변 N 구조. 같은 질문을 다시 물어도 된다 —
  "제일 행복했던 순간"의 답이 작년과 올해 다른 것 자체가 기록으로서 값이 있다
- `month` 컬럼으로 제철 출제 (김장 11월, 설날 2월). 중복을 없애는 대신
  **중복이 자연스러워지게** 만드는 장치
- 하루 한 개. 무작위가 아니라 결정적으로 고른다(새로고침해도 같은 질문)
- 질문 83개 seed. 하루 1개면 약 3개월치

---

## 아직 안 한 것

### 곧 필요한 것

- **질문 문구 손보기.** seed 83개 중 다음은 집안 상황에 맞게 고칠 것
  - `아버지` 가 들어간 문항들 — 호칭·상황이 다르면 수정
  - 9번 `어머니가 해주시던 음식` — 외할머니를 뜻한 것. 집에서 쓰는 호칭으로
  - 문구 수정은 DB 에서 직접 (`prompt` 가 unique 키라서 seed 를 고치면 새 질문으로 들어간다)
    ```sql
    update public.family_questions set prompt = '...' where id = '...';
    ```
  - 빼려면 지우지 말고 `active = false` (답변 기록이 살아 있어야 한다)

- **민감한 질문 3개** 는 `supabase/seed/family_questions.sql` 맨 아래 주석으로 분리해 뒀다.
  돌아가신 분 이야기가 나올 수 있어서 **곁에 있을 때만** 켤 것
  ```
  · 아버지랑 제일 크게 다퉜던 일, 기억나세요?
  · 형진이 키우면서 제일 힘들었던 때는 언제예요?
  · 요즘 제일 보고 싶은 사람이 누구예요?
  ```

- **Vercel 환경변수 정리 (선택).** `NEXT_PUBLIC_SUPABASE_URL` 이 Secret 타입으로
  저장돼 있어 값을 볼 수 없다. `NEXT_PUBLIC_` 은 브라우저에 노출되는 값이라
  Secret 으로 둘 의미가 없다. Config 로 바꾸면 나중에 확인이 쉬워진다
  (Vercel 은 Secret → Config 전환을 막으므로 삭제 후 재등록해야 한다)

### 하기로 안 한 것

- **푸시 알림** — 안 하기로 함. 답장이 오면 어머니에게 알림 가는 기능.
  `web-push` 인프라는 이미 있다(`/api/cron/notify`)
- **음성 답변** — 안 하기로 함. `family_answers` 에 `audio_path` 컬럼만 추가하면
  되게 스키마를 잡아뒀다. 글로 쓰면 한 줄, 말로 하면 이야기가 나오므로 언젠가는 할 만하다

### 다음 후보

- **상식 퀴즈 은행 확충 (LLM 배치 사전 생성 + 사람 검수).**
  이제 서버 출제 구조가 있어 번들 걱정 없이 키울 수 있다.
  500문항대로 올리면 무중복 기간이 7일 → 3주.
  런타임 LLM 생성은 반대 — 고령자에게 틀린 사실을 정답으로 내면 신뢰가 무너진다
- **`WORDQ` 추가 확충.** 45건이면 같은 날 중복은 없지만 2일차부터 일부 겹친다.
  양방향 파생("실 — 무엇과 짝일까요?")도 가능하지만,
  연상 게임은 오답을 무작위로 뽑으면 정답이 두 개가 되므로 손으로 골라야 한다
- **`components/games/sequence-game.tsx` lint 에러 2건** (기존 문제, 이번 작업과 무관)
  - `react-hooks/set-state-in-effect` (38:5), `react-hooks/refs` (29:3)

---

## 참고 — 새로 생긴 파일

```
lib/games/quiz-bank.ts                        문제 은행 + 출제 로직 (server-only)
lib/games/serve.ts                            이력 조회 → 출제 → 기록
lib/recall/queries.ts                         오늘의 질문 선택 · 자녀 피드
app/(app)/recall/                             어머니 화면
app/connect/[seniorId]/recall/                자녀 화면
supabase/migrations/0015_quiz_seen.sql
supabase/migrations/0016_family_questions.sql
supabase/seed/family_questions.sql
```
