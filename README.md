# Carely

엄마(시니어)와 자녀가 함께 어머니 건강을 챙기는 모바일 PWA.
어머니는 두뇌게임 6종으로 포인트를 모으고, 약·일정을 관리하고, 자녀와 사진·메시지를 나누고, 포인트를 환전 신청합니다. 자녀는 `/connect`에서 연결해 환전을 승인하고 소식을 주고받습니다.

- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase(Postgres + Auth + Storage + RLS) · Web Push(VAPID) · Vercel
- **디자인 기준**: `docs/handoff/` (Wanted DS 토큰, `Carely.dc.html` 시안)
- 시니어 친화: 글자배율 3단계(×1.0/1.18/1.4), 고대비 모드, 큰 터치영역, 이모지 금지(아이콘만)

---

## 1. 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 2번)
npm run dev                  # http://localhost:3000
```

비로그인 시 `/login` 으로 이동합니다. 회원가입에서 **어머니/자녀** 역할을 고를 수 있어요.

## 2. Supabase 설정 (Carely 전용 신규 프로젝트)

1. supabase.com 에서 새 프로젝트 생성(리전: Northeast Asia / Seoul 권장).
2. **마이그레이션 실행** — SQL Editor 에 `supabase/migrations/` 파일을 순서대로 붙여넣어 실행:
   - `0001_schema.sql` → `0002_functions.sql` → `0003_rls.sql` → `0004_storage.sql`
   - (또는 Supabase CLI: `supabase link` 후 `supabase db push`)
3. **Auth**: Authentication → Providers → Email 활성화. 빠른 테스트는 "Confirm email" 끄기(끄면 가입 즉시 로그인).
4. **타입 재생성(선택)**: `npm run gen:types` (CLI 링크 필요). 미실행 시 `lib/database.types.ts` 수기 타입 사용.
5. `.env.local` 채우기:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (같은 화면, service_role — 서버 전용)

## 3. 웹 푸시 (선택, 알림 기능)

```bash
npx web-push generate-vapid-keys
```
출력된 공개/개인 키를 `.env.local` 에:
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (= 공개키와 동일)
- `VAPID_SUBJECT=mailto:you@example.com`

설정 → "알림 켜기" 로 브라우저 구독. 미설정이어도 앱의 나머지는 정상 동작합니다.

## 4. Vercel 배포

1. 새 Vercel 프로젝트로 이 레포 import.
2. **Environment Variables** 에 `.env.local` 의 모든 키 + `CRON_SECRET`(임의 문자열) 등록.
3. 리전은 `vercel.json` 의 `icn1`(서울) 사용. 크론 `*/15 * * * *` 가 `/api/cron/notify` 호출(Vercel 이 `Authorization: Bearer $CRON_SECRET` 전송).
4. 배포 후 Supabase Auth → URL Configuration 에 프로덕션 도메인 추가.
5. PWA: 모바일 브라우저에서 "홈 화면에 추가" 로 설치형 앱처럼 사용.

## 5. 데이터 모델 / 보안

- 전체 스키마·RLS·함수는 `supabase/migrations/` 참조.
- RLS 가 보안 경계: 본인 데이터(`user_id = auth.uid()`) + 연결 가족(`is_linked()`)만 접근.
- 자녀가 어머니 행을 바꾸는 동작(연결·환전 승인)은 `SECURITY DEFINER` RPC(`redeem_connect_code`, `decide_exchange`)로 캡슐화.
- 하루 1000P 한도는 `award_points` RPC 의 단일 트랜잭션 + 행 잠금으로 race-free, KST 자정 자연 리셋(`(now() at time zone 'Asia/Seoul')::date`).

## 6. 게임 로직

`lib/games/` 에 시안 `Carely.dc.html` 의 알고리즘을 1:1 이식 — `config.ts`(DIFF/GAMES), `data.ts`(문제), `engine.ts`(순수 로직). 채점은 서버 권위(`submit_game_result` RPC).
