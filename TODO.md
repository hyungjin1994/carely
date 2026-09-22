# 다음에 할 일

> 마지막 갱신: 2026-09-22

마이그레이션 `0015`~`0024` + `family_questions_patch_01.sql` 전부 적용됨.
테스트 110개 통과(`npm test`), 레포 전체 lint 에러 0.

---

## 지금 막힌 것

### 알림 키 (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`)

앱에서 **"알림 키가 올바르지 않아요"** 가 뜬다. 값이 잘못 들어가 있다.
공개 키는 **87자이고 `B` 로 시작**한다. 43자면 개인 키를 넣은 것이다.

```bash
node scripts/vapid-keys.mjs     # → vapid-keys.txt (gitignore 됨)
```

파일 안의 두 줄을 Vercel 환경변수에 그대로 넣고 **재배포**한다.
`NEXT_PUBLIC_` 은 빌드 시점에 번들에 박히므로 변수만 바꿔도 반영되지 않는다.
옮긴 뒤 `rm vapid-keys.txt`.

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY   87자, B 로 시작   구독 + 발송
VAPID_PRIVATE_KEY              43자              발송
```

**`VAPID_PUBLIC_KEY` 는 이제 안 쓴다.** 예전엔 같은 공개 키를 이 변수에도
복사해야 했고, 한쪽만 채우면 구독은 되는데 발송만 조용히 안 됐다.
Vercel 에 남아 있으면 지워도 된다(남겨둬도 같은 값이면 무해).

**두 키는 한 쌍이라 같이 바꿔야 한다.** 새로 만들면 기존 구독이 전부 무효가
되므로 양쪽에서 알림을 다시 켜야 한다. 현재 구독이 0이라 지금이 제일 싸다.

---

## 배포 후 확인 (아직 안 본 것)

앱에서 직접 봐야 하는 것들. 화면으로는 구분이 안 되는 게 섞여 있어 쿼리가 필요하다.

### 포인트 잔액이 그대로 나오는지

`0021`로 잔액 계산 경로가 바뀌었다. 0이나 이상한 값이 나오면 `point_balance` 권한 문제다.

```sql
select public.point_balance('<어머니 id>');   -- 76013 근처가 나와야 함
```

### 카드 짝맞추기 어려움이 한 화면에 들어오는지

**미리보기 중 24장이 스크롤 없이 전부 보여야 한다.** 아래 줄이 잘리면 "모두에게 같은
정보를 준다"는 전제가 깨져서 제한을 거는 근거가 없어진다.

카드를 정사각형으로 바꿔 390px 폰에서는 들어오지만, 아이폰 SE 같은 작은 화면은
빡빡할 수 있다. **잘리면** `lib/games/levels.ts`의 `memParams` 에서
`Math.min(12, ...)` 를 `Math.min(10, ...)` 으로 내린다. 최대 4×5가 되어 거의 모든
폰에 들어온다. 난이도는 미리보기·제한이 계속 조여지므로 유지된다.

### 게임 이력·레벨이 쌓이는지

상식 퀴즈 두 판, 레벨 게임 아무거나 한 판 돌린 뒤:

```sql
select count(*) as 출제이력 from public.quiz_seen;
select game_id, level, updated_at from public.game_levels order by updated_at desc;
```

**둘 다 0행이면 안 쌓이는 것**이고, 게임은 폴백으로 정상 동작하므로 화면으로는
구분이 안 된다. 그래서 이 확인이 필요하다.

### 관리자 푸시 구독

```
형진 계정 → /connect → 상단 주황 배너 [켜기] → 브라우저 권한 허용
```

```sql
select p.name, p.notify_on,
       (select count(*) from public.push_subscriptions s where s.user_id = p.id) as 구독수
  from public.profiles p where p.role = 'manager';
```

구독수가 0이면:
- **iOS는 홈 화면에 추가(PWA 설치)해야 웹푸시가 된다.** Safari 탭에서는 안 됨 — 가장 흔한 원인
- 권한을 한 번 거부하면 다시 묻지 않는다. 브라우저 사이트 권한 초기화 필요
- `[켜기]` 누를 때 "알림 설정이 준비되지 않았어요" 토스트가 뜨면
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 가 번들에 안 들어간 것

### 환전 알림 전체 흐름

```
어머니 계정 → 포인트 → 환전 신청
  → 형진 폰에 즉시 푸시        (구독 완료 시)
  → 형진이 /connect 열면 배너   (구독 없어도 뜸)
```

---

## 손봐야 할 것

### 가족 회상 질문 호칭 — 했음 (`0023` + 패치 실행 완료)

두 가지가 겹쳐 있었다.

**(1) 자녀 이름이 문구에 박혀 있었다** — "형진이가 좋아하는 음식이 뭘까요?".
이 앱은 다른 가족도 쓴다. 이제 문구에는 `{자녀}` 자리표시자가 들어가고,
관리자가 정한 호칭으로 출제할 때 바뀐다. 조사는 받침 유무로 갈리므로 문구에
조사 쌍을 적는다 — `{자녀}이/가`.

**(2) 같은 단어가 다른 사람을 가리켰다.**

```
"형진이가 어머니랑 제일 닮은 데"          어머니 = 읽는 분 본인
"어머니가 해주시던 음식 중에"             어머니 = 읽는 분의 어머니
"아버지랑 어머니 중에 누가 더 엄했어요"   아버지 = 읽는 분의 아버지
"아버지 처음 봤을 때 어떤 생각"           아버지 = 읽는 분의 배우자
```

읽는 분 시점으로 통일했다. 자녀 → `{자녀}` · 배우자 → `남편` ·
본인의 부모 → `엄마`·`아빠` · 본인은 지칭하지 않는다.

둘 다 돌렸다. 확인 쿼리:

```sql
select active, count(*) from public.family_questions group by active;
--   true 104 · false 7
select prompt from public.family_questions where prompt like '%형진%';
--   0행
```

**남은 것 — 호칭 정하기** — 앱에서 `/connect` → 어머니 → 이야기 → 상단
"질문에서 나를 부르는 말". 읽히는 그대로 적는다("형진이"·"아들"·"큰딸").
비워두면 관리자 이름을 쓰고, 그것도 없으면 "아이" 로 채운다.

> 이름으로 하려면 "형진" 이 아니라 **"형진이"** 로 적어야 한다. 받침 있는 이름에
> 자동으로 "이" 를 붙이는 규칙은 이름에만 통하고 "아들" → "아들이" → "아들이가"
> 가 되어버려서, 호칭은 사람이 적고 조사만 앱이 고르게 했다(`lib/korean.ts`).

### 곁에 있을 때만 하는 질문 7개

패치가 `active = false` 로 DB 에 넣는다. 상실을 정면으로 건드리므로
**혼자 답하게 두지 않는다.** 곁에 있을 때 열고, 끝나면 다시 닫는다.

```
· 남편이랑 제일 크게 다퉜던 일, 기억나세요?
· 요즘 제일 보고 싶은 사람이 누구예요?
· 요즘 제일 자주 생각나는 사람이 누구예요?
· 남편한테 지금 제일 하고 싶은 말이 뭐예요?
· 남편이 제일 그리울 때가 언제예요?
· 엄마 아빠가 제일 보고 싶을 때가 언제예요?
· 남편이 {자녀}을/를 보면 뭐라고 하실 것 같아요?
```

```sql
update public.family_questions set active = true
 where prompt = '남편한테 지금 제일 하고 싶은 말이 뭐예요?';
```

반대로 **좋았던 기억을 묻는 질문은 혼자 답해도 괜찮아서** `active = true` 로
뒀다(엄마 아빠 11개 · 남편 11개). 회상 요법에서 긍정적 회상은 슬픔을 덧내지
않고 관계를 이어가는 쪽으로 작동한다(continuing bonds).

### 난이도 숫자 조정 (해보고 나서)

전부 실측·시뮬레이션으로 고른 값이지만 어머니 실제 반응이 기준이다.

```
lib/games/levels.ts    memParams · stroopParams · mathParams · seqParams
lib/games/config.ts    MEM_UI · STROOP_UI (화면 동작만)
```

바꾼 뒤 `npm test` 를 돌리면 "만점이 하루 상한을 넘지 않는지", "제한이 쌍 수보다
큰지" 같은 성질이 자동으로 검증된다.

### 커밋 안 된 기존 변경 19개 파일

회사 노트북에만 있다. 집에서 이어가려면 정리해야 한다.

```
calendar · exchange · family(3) · measure · meds · onboarding · points
settings · login · globals.css · layout · page · next.config · timeline
album/page · calendar/page
```

이번 세션에 같은 파일을 수정해야 했던 4개(`home/page` · `games/page` ·
`games/[id]/play/page` · `connect/page`)는 분리가 불가능해 함께 커밋됐다.
내가 안 건드린 파일은 커밋에서 빼뒀다.

### 공용 스타일 나머지

`components/ui/styles.ts` 를 만들고 4곳만 전환했다
(`Card` · `measure-view` · `settings-view` · `answer-form`).
카드 배경이 아직 ~50곳, 입력 테두리가 ~15곳 인라인으로 복붙돼 있다.
기계적으로 바꾸면 각 호출부의 추가 스타일 때문에 시각 회귀가 나므로,
**그 화면을 만질 때 같이 옮긴다.**

### Vercel 환경변수 정리 (선택)

`NEXT_PUBLIC_SUPABASE_URL` 이 Secret 타입이라 값을 볼 수 없다.
`NEXT_PUBLIC_` 은 브라우저에 노출되는 값이라 Secret 으로 둘 의미가 없고,
이것 때문에 프로젝트 ref 를 찾는 데 시간을 썼다.
(Vercel 은 Secret → Config 전환을 막으므로 삭제 후 재등록해야 한다.)

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` 는 Config 로 넣어뒀다.

### 예약 알림을 제때 보내려면 (선택)

Vercel Hobby 는 크론이 하루 1회다(`vercel.json` 의 `0 23 * * *` = KST 아침 8시).
**약·일정 알림이 최대 24시간 늦는다.** 환전 같은 사건형 알림은 크론을 거치지 않고
서버 액션이 바로 보내므로 영향이 없다.

무료로 자주 돌리려면 외부 스케줄러로 같은 URL 을 호출한다.

```
cron-job.org (무료, 1분 간격까지)
  URL      https://carely-care.vercel.app/api/cron/notify
  Schedule Every 15 minutes
  Header   Authorization: Bearer <CRON_SECRET>
```

GitHub Actions 도 가능하지만 private 레포는 15분 간격이면 무료 한도(월 2,000분)를
넘는다. 30분 간격이면 들어간다. Vercel 쪽 크론은 그대로 둬도 중복 발송되지 않는다
(이미 `sent=true` 인 건 건너뛴다).

---

## 컨텐츠 로드맵

앱에 구조적으로 빈 것: 어머니 쪽은 **"나아지고 있다"는 피드백**이 없고,
자녀 쪽은 **숫자만 있고 해석이 없다.** 둘 사이에 **같이 하는 것**이 없다.

### 1. 주간 리포트 — 했음

일요일 저녁에 한 주를 정리해 양쪽에 보여준다.
어머니는 홈에서 **시트**로, 자녀는 **알림**으로 받는다. 별도 화면을 만들지
않았다 — 주 1회만 볼 것에 탭을 하나 더 두면 나머지 6일은 죽은 칸이 된다.

```
lib/weekly/queries.ts   집계 · weeklyDigest · hasSeenWeekly
0022                    weekly_report_seen · notify_managers_weekly
```

`concerns[]`(눈여겨볼 것)은 **자녀에게만** 보낸다.

### 2. 사진에 이야기 붙이기 — 했음

자녀가 앨범에서 사진을 골라 질문을 낸다. 어머니 화면에 사진이 질문 위에 크게
뜨고, 답은 기존 회상 답변으로 쌓인다. 사진은 회상의 표준 도구이고 글만 있는
질문보다 훨씬 강하게 기억을 연다.

**새 테이블을 만들지 않았다.** `family_questions.photo_id` 한 칸이면 오늘의 질문
선택 · 답변 저장 · 자녀 답장 · 알림 · 주간 리포트가 전부 그대로 돌아간다.
`photos.caption` 에 답을 쓰는 쪽은 택하지 않았다 — caption 은 사진 주인만 고칠 수
있어서(0003) 자녀가 올린 사진에 어머니가 답을 쓸 수 없다.

같이 따라온 것 둘:

- **중복 키에 사진이 들어갔다.** `unique (senior_id, prompt)` 였는데 사진 회상에서
  제일 잘 먹는 문구는 사진마다 같다. "이 사진, 어디서 찍은 거예요?" 를 두 번째
  사진에 쓰면 막혔다. 이제 `(senior_id, prompt, photo_id) nulls not distinct` —
  글 질문은 예전처럼 문구로 중복을 막고, 사진이 다르면 같은 문구도 통과한다.
- **안 답한 질문끼리는 나중에 만든 것이 먼저 나온다.** 방금 낸 질문이 seed 100여
  개 뒤로 밀려 몇 달 뒤에 나오면 낸 사람 입장에선 안 들어간 것과 구분이 안 된다.

사진이 지워지면 그 질문은 `active = false` 로 내린다(트리거). `cascade` 로 질문을
지우면 `family_answers` 까지 따라가서 **어머니가 해주신 이야기가 사라진다.**
사진 한 장 정리했다가 이야기를 잃는 건 받아들일 수 없다.

### 3. 인지 추이 (자녀 전용) — 했음 (마이그레이션 없음)

`/connect/[seniorId]/trend`. 자녀 대시보드 "게임 추이" 버튼.
**어머니 쪽에는 링크가 없다.** 자기 인지 기능이 떨어지는 그래프는 해롭다.

```
lib/trend/cognitive.ts   순수 함수 — 주 버킷·창 비교·판정·문구
lib/trend/queries.ts     game_scores 12주치 조회
```

`game_levels` 를 쓰지 않는다. 현재 레벨만 들고 있어 추이를 낼 수 없고 RLS 도 본인
전용이다(0017). `game_scores.difficulty` 에 판마다 그때 레벨이 문자열로 남고
자녀 읽기가 열려 있다(0003 `game_scores_family_read`). 그래서 새 테이블이 없다.

**정답률이 아니라 레벨을 본다.** 레벨 게임 4종은 계단식 조정이 성공률을
60~85%에 붙잡아 두므로 실력이 늘든 줄든 정답률은 그대로다. 움직이는 건 레벨이다.
상식 퀴즈·단어 맞추기는 레벨 축이 없어 정답률을 본다. 이걸 뒤집으면 신호가
전부 사라진다.

판정 기준 (`lib/trend/cognitive.ts` 상수):

```
HISTORY_WEEKS         12   화면에 그리는 기간
TREND_WINDOW_WEEKS     4   최근 4주 vs 그 앞 4주
MIN_PLAYS_PER_WINDOW   8   창당 최소 판수. 미달이면 판단 안 함
LEVEL_DELTA          1.5   계단식 조정이 한 판에 ±1 이라 1.0 은 노이즈
RATE_DELTA           0.1
```

- **한 종목만 내려간 것은 경고하지 않는다.** 그 게임이 재미없어지신 것으로도
  설명된다. 두 종목 이상이 함께 움직일 때만 "여쭤보실 만하다" 고 말한다
- 최고 레벨(30)에 붙어 있으면 `ceiling` — 더 오를 칸이 없어 "비슷함" 이 신호가 아니다
- 문구에 "인지 기능 저하" 를 쓰지 않는다. 자녀가 할 일은 같고 진단이 아니다.
  잠·몸 상태로도 똑같이 내려간다는 걸 화면에 같이 적었다

숫자를 바꾸면 `npm test`(`tests/trend.test.ts`)가 성질을 확인한다 — 정답률만
떨어지고 레벨이 그대로면 `flat` 이어야 한다는 것까지 고정해 뒀다.

### 4. 가족 대항 게임

자녀도 같은 게임을 하고 점수를 비교한다. 사회적 동기가 인지 훈련 지속의
최강 요인이고, 연습량 차이로 어머니가 이길 것이다.
다만 `(app)/layout` 이 `requireSenior()` 라 자녀는 게임 화면에 못 들어간다 —
역할 분리를 건드려야 해서 위험이 있다.

### 상식 퀴즈 은행 확충 — 1차 완료

지식 문제는 난이도 조절이 안 되므로 **새 문제가 계속 나오는 것**이 유일한 축이다.

```
상식 퀴즈   170 → 464 문구   (단답 156 + 지식표 7개에서 유도 308)
단어 맞추기  45 → 100
오늘의 한 가지 42 → 84       (6개 분류 · 94일 안에 전부 한 번씩)
```

하루 24문제면 **19일 무중복**. 더 키울 때 지식표(`lib/games/quiz-facts.ts`)에
행을 넣으면 앞뒤 양방향 두 문구가 자동으로 나온다.

**런타임 LLM 생성은 반대다** — 고령자에게 틀린 사실을 정답으로 내면 신뢰가 무너진다.
오프라인 배치 생성 → 사람 검수 → 커밋이 맞다.
서버 출제 구조(`quiz-bank.ts` 가 `server-only`)가 있어 번들 걱정 없이 키울 수 있다.

**오답을 무작위로 뽑으면 안 된다.** 연상 게임이라 "연필"에 "종이" 같은 오답이
섞이면 정답이 두 개가 된다. 실제로 이 함정에 한 번 빠졌다(바늘→실/골무,
가위→종이/실). `npm test` 가 두 은행의 문구·정답 중복을 검사한다.

---

## 안 하기로 한 것

- **게임 추가** — 이미 6종. 고령자에게 선택지 증가는 그 자체로 부담이고,
  6종은 다른 앱에도 다 있다. 새 게임보다 은행 확충이 낫다
- **만보기·걸음 수** — 웹앱에서 센서 접근이 까다롭고 폰을 안 들고 다니면 무의미.
  "오늘의 한 가지" 에 걷기 행동이 이미 있다
- **식단 기록** — 매 끼니 입력은 부담이 너무 커서 며칠 하고 그만둔다
- **AI 대화 상담** — 65세에게 챗봇 UI는 진입 장벽이 높고 잘못된 건강 조언 위험이 있다.
  가족 회상 질문이 이미 "대화" 역할을 하고 그쪽이 진짜 가족이라 낫다
- **음성 답변** — `family_answers` 에 `audio_path` 만 추가하면 되게 스키마를 잡아뒀다.
  글로 쓰면 한 줄, 말로 하면 이야기가 나오므로 언젠가는 할 만하다

---

## 알아두면 좋은 것

### 절대 하지 말 것

- **`0011_id_login.sql` 을 돌리지 말 것.** 기존 계정의 이메일 도메인을
  `@carely.app` 으로 바꾸는 파일이라 지금 돌리면 로그인이 깨질 수 있다
- **문제 은행(`quiz-bank.ts`)을 클라이언트에서 import 하지 말 것.**
  `server-only` 로 잠겨 있어 빌드가 깨진다. 의도한 것 — 은행 전체가 클라 번들에
  실리면 은행을 키울 수 없고 정답까지 통째로 내려간다
- **`quiz_seen.qid` 를 바꾸지 말 것.** 바꾸면 그 문항의 출제 이력이 리셋된다
- **가족 회상 질문을 채점하지 말 것.** 정답 컬럼·점수·포인트가 없다.
  목적이 "맞히기" 가 아니라 "생각하게 하기" 다
- **seed 문구에 특정 가족의 이름을 넣지 말 것.** `family_questions.sql` 은
  모든 가족이 쓰는 공용 파일이다. 자녀는 `{자녀}` 자리표시자로, 나머지는
  관계로 부른다. `npm test` 가 이름을 잡는다
- **`어머니`·`아버지` 를 질문 문구에 쓰지 말 것.** "어머니" 는 자녀가 읽는 분을
  부르는 말이라 본인의 어머니 뜻으로 쓰면 겹치고, "아버지" 는 배우자와 본인의
  아버지 둘 다로 읽혔다. `남편`·`엄마`·`아빠` 로 고정했다 (`시어머니` 는 예외)
- **`git stash` 를 쓰지 말 것.** 파일 하나를 되돌릴 때는 `git checkout -- <파일>`.
  이 레포에는 커밋 안 된 변경이 19개 파일 있어서 stash 가 전부 말려 들어간다.
  실제로 한 번 날렸고 `git fsck --dangling` 으로 겨우 찾았다

### 설계 결정

- **레벨은 서버가 보관한다.** 포인트 배수가 레벨에서 나오므로 클라가 보낸 레벨을
  신뢰하면 포인트를 마음대로 받을 수 있다. `game_levels` 가 유일한 진실
- **식별자가 두 개다.** `source` 는 한 판 안에서 같은 지식이 두 번 나오는 걸 막고,
  `qid` 는 사용자별 이력 키로 방향(fwd/rev)까지 구분한다
- **`sent` 와 `read_at` 은 다른 개념이다.** `sent` 는 푸시·이메일 발송 시도 완료,
  `read_at` 은 사람이 확인. 그래서 즉시 발송한 알림도 배너에 계속 뜬다
- **상수가 코드와 SQL 에 이중으로 있다.** `PER_GAME_DAILY_CAP`(200) ↔ `0005`,
  `DAILY_CAP`(1000) ↔ `0002`. 한쪽만 바꾸면 조용히 어긋난다
- **PostgREST 는 기본 1,000행에서 자른다.** 이것 때문에 잔액이 틀리게 나올 상태였다
  (원장 964행). 목록을 전부 받아 JS 에서 집계하는 코드가 또 있으면 같은 함정이다

### 스타일

Tailwind 를 설치했지만 유틸리티 클래스는 쓰지 않는다. 전부 인라인 `style` 이고
`@import "tailwindcss"` 는 CSS 리셋(preflight) 용도로만 남아 있다.
**빼면 레이아웃이 미묘하게 깨질 수 있다.**
색·간격은 `app/globals.css` 의 CSS 변수(`--c-*`, `--fs`)를 쓴다.
크기는 전부 `calc(Npx*var(--fs))` — 글자배율 ×1.0/1.18/1.4 를 따라야 한다.

### 테스트

```bash
npm test          # 110개
npm run test:watch
```

`lib/games/levels·engine·quiz-bank` 와 `lib/habits`, `lib/korean` 은 순수 함수라
테스트로 성질을 고정해 뒀다. 난이도 숫자를 바꿔도 이걸 돌리면 확인된다.
`server-only` 는 테스트에서 빈 모듈로 대체한다(`vitest.config.mts`).

`tests/recall-seed.test.ts` 는 **SQL 파일을 읽어서** 검사한다 — 문구 중복,
홑따옴표, 특정 가족 이름, `{자녀}` 뒤 조사 쌍, 패치와 seed 의 정합성.
seed 는 한 번 DB 에 들어가면 문구를 고치는 데 별도 `update` 가 필요하므로
(prompt 가 unique 키다) 들어가기 전에 잡는 게 값이 크다.

---

## 파일 지도

```
lib/games/quiz-bank.ts     퀴즈·단어 문제 은행 + 출제 (server-only)
lib/games/levels.ts        레벨 곡선 · 계단식 조정 · 포인트 배수
lib/games/engine.ts        계산·색깔·짝맞추기·순서기억 생성기 (클라 공용)
lib/games/quiz-facts.ts    지식표 7개 (수도·속담·절기…) — 양방향으로 문구 유도
lib/games/serve.ts         이력 조회 → 출제 → 기록
lib/habits.ts              오늘의 한 가지 84개 + 날짜 기반 출제
lib/recall/queries.ts      오늘의 질문 선택 · 자녀 피드 · 자녀 호칭 · 앨범 사진
lib/weekly/queries.ts      주간 집계 · 눈여겨볼 것(자녀 전용)
lib/trend/cognitive.ts     인지 추이 판정 (순수 함수)
lib/trend/queries.ts       game_scores 12주치 조회
lib/korean.ts              받침 판정 · 조사 선택 · {자녀} 치환
lib/push/family.ts         관리자에게 즉시 푸시 (크론 우회)
components/ui/styles.ts    공용 스타일 조각

app/(app)/recall/          어머니 회상 화면
app/(app)/home/habit-card  오늘의 한 가지
app/connect/notice-banner  자녀 알림 배너
app/connect/notify-toggle  자녀 알림 켜기 (설정 화면이 없어서 대시보드에 둠)
app/connect/[seniorId]/recall/child-label   자녀 호칭 설정 (미리보기 포함)
app/connect/[seniorId]/trend/              인지 추이 (자녀 전용)

supabase/migrations/0015   quiz_seen — 출제 이력
                    0016   family_questions · family_answers
                    0017   game_levels
                    0018   notifications.read_at · notify_managers
                    0019   daily_habits
                    0020   notify_managers 즉시 발송용 수정
                    0021   point_balance — 잔액 집계
                    0022   weekly_report_seen · notify_managers_weekly
                    0023   family_links.child_label
                    0024   family_questions.photo_id — 사진 회상
supabase/seed/family_questions.sql            회상 질문 111개 (비활성 7 포함)
supabase/seed/family_questions_patch_01.sql   기존 DB 문구 보정 (돌렸음)
```
