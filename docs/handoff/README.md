# Carely 개발 핸드오프

엄마(시니어)와 자녀가 함께 어머니 건강을 챙기는 모바일 앱. 이 폴더는 **Claude Code로 실제 앱을 개발**하기 위한 설명서 + 디자인 레퍼런스입니다.

---

## 0. 이 폴더의 파일들

| 파일 | 설명 |
|---|---|
| `Carely.dc.html` | **작동하는 고충실도(hifi) 시안.** 브라우저로 열면 어머니 앱 + 자녀 화면이 아이폰 목업 안에서 실제로 동작합니다. 로그인 → 홈 → 게임 → 포인트 → 일정 → 약 → 가족 → 설정, 그리고 자녀의 환전 승인까지 전부 클릭됩니다. **모든 UI·인터랙션의 기준(ground truth)** 입니다. |
| `colors_and_type.css` | Wanted 디자인 시스템 토큰(색·타입·radius·spacing·shadow). 그대로 가져와 쓰세요. |
| `icons/` | 화면에서 쓰는 24×24 SVG 아이콘 (`currentColor` 단일 path → CSS `color`로 틴트). |

> ⚠️ **중요:** `Carely.dc.html`은 *디자인 레퍼런스*입니다. 이 HTML을 그대로 배포하는 게 아니라, **이 화면과 동작을 실제 코드베이스(아래 추천 스택)로 재구현**하는 것이 목표입니다. 픽셀·색·간격·문구·인터랙션은 이 파일을 기준으로 똑같이 맞추세요.

### 시안을 먼저 실행해보기
```
# 이 폴더에서
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000/Carely.dc.html 열기
```
왼쪽 = 어머니 앱, 오른쪽 = 자녀 화면. 직접 눌러보며 동작을 확인하세요.

---

## 1. 추천 기술 스택 (기존 코드베이스 없음 → 신규 선택)

시니어용 + 웹 푸시 + 스케줄러 + 가족 양방향이 요구사항이므로 **PWA(설치형 웹앱)** 가 가장 적합합니다. (앱스토어 심사 없이 배포·업데이트, 웹 푸시로 시스템 알림 가능)

| 영역 | 추천 | 이유 |
|---|---|---|
| 프레임워크 | **Next.js (App Router) + TypeScript** | PWA·서버액션·API 라우트·크론을 한 곳에서 |
| 스타일 | **Tailwind CSS** + `colors_and_type.css` 토큰을 `@theme`/CSS 변수로 등록 | 시안의 인라인 스타일을 토큰 기반으로 1:1 이식 |
| 백엔드/DB/인증/스토리지 | **Supabase** (Postgres + Auth + Storage + RLS) | 요구사항에 Supabase 명시. 이메일+비번 인증, 사진 저장, 행 단위 보안 |
| 푸시 알림 | **Web Push (VAPID)** + Service Worker | 앱이 꺼져 있어도 시스템 알림 |
| 이메일 폴백 | **Resend** 또는 Supabase + SMTP | 푸시 미수신 시 이메일 |
| 스케줄러 | **Supabase `pg_cron`** 또는 **Vercel Cron** (15분 간격) | 약·일정 알림 자동 발송 |
| 상태관리 | React Query(서버상태) + Zustand/Context(로컬 UI) | 과하지 않게 |
| 배포 | **Vercel** + PWA(manifest + SW) | 크론·서버리스 함수 포함 |

폴더 구조 제안:
```
app/
  (auth)/login, signup
  (app)/home, games/[id], points, exchange, calendar, meds, family, settings
  connect/                # 자녀: 코드 입력 연결
  api/cron/notify/        # 15분 스케줄러 엔드포인트
components/  ui/ games/ ...
lib/  supabase/  push/  points/
public/  sw.js  manifest.json  icons/
```

---

## 2. 핵심 설계 원칙 (시니어 친화 — 반드시 유지)

- **큰 글씨 / 큰 터치영역**: 버튼 최소 높이 56–64px. 본문 17px, 제목 24–34px 기준.
- **글자 크기 3단계**: 보통(×1.0) / 크게(×1.18) / 아주 크게(×1.4). 루트에 `--fs` 배율을 두고 모든 폰트 크기를 `calc(Npx * var(--fs))`로. 설정에서 바꾸면 전 화면 즉시 반영 + 저장.
- **고대비 모드**: 루트 테마 변수(`--c-bg/-card/-text/-sub/-line/-primary`)를 통째로 교체. 일반/고대비 두 세트.
- **한 화면 한 가지 일**, 명료한 라벨, **이모지 금지**(아이콘만 — Wanted DS 원칙).
- 색: 기본 크롬은 차분하게, **게임·포인트에만 비비드 액센트**(보라/핑크/주황/라임/시안)로 활기.

---

## 3. 화면 명세

탭바(하단 고정, 5개): **홈 · 게임 · 일정 · 가족 · 설정**. 포인트/환전/약/게임플레이/결과는 탭이 아니라 푸시되는 하위 화면.

### 3-1. 로그인 / 회원가입
- 로그인: 이메일 + 비밀번호, 비번 보기 토글(eye/eye-slash). "한 번 로그인하면 다음에 바로 입장" 안내(세션 자동 갱신 = Supabase `persistSession`).
- 회원가입: **이름(호칭)** + 이메일 + 비번. 이름은 인사말에 사용·설정에서 수정 가능.
- 비로그인 시 로그인 화면으로 안내(미들웨어/가드).

### 3-2. 홈 — "오늘 한눈에" (대시보드, 런처 아님)
탭바가 이동을 담당하므로 홈은 **요약·알림판**. 위→아래 순서:
1. **인사말 카드** (그라데이션): 시간대별 인사("좋은 아침이에요"/"점심은 드셨어요?"/"좋은 저녁이에요"/"편안한 밤 되세요") + `{이름}님,` + 날짜. 아침/낮/저녁/밤마다 아이콘(sun/moon)·그라데이션 다름.
2. **오늘 챙길 일** (가장 큼·핵심): 오늘 먹을 약(시간대 칩 + 약 이름·용량)과 오늘 일정을 한 리스트로. 각 행 우측 체크(미완료=check, 완료=circle-check-fill + 취소선·흐리게). 우상단 배지 `N개 남음`/`모두 완료`. 카드 헤더 탭 → 일정 화면.
3. **포인트 카드** (그라데이션): 보유 P, 오늘 진행률 막대, `오늘 NP / 하루 1000P`. 탭 → 포인트.
4. **오늘의 두뇌 게임** 줄 버튼 → 게임 목록.
5. **가족 새 소식** 줄 카드: 사진 썸네일 + 자녀 최근 메시지 1줄. 탭 → 가족.

### 3-3. 게임 목록 + 두뇌 게임 6종
목록: 게임당 컬러 타일(아이콘) + 이름 + 설명. 탭하면 **난이도 시트**(바텀시트)가 올라옴.
- **난이도 3단계**: 쉬움(×1) / 보통(×2) / 어려움(×3). 어려울수록 문제 수↑, 포인트 배수↑.
  - 문제 수 예시 — 쉬움/보통/어려움: 퀴즈 4/6/8, 계산 5/8/10, 색깔 6/9/12, 짝맞추기 3/6/8쌍, 순서기억 3/4/5단계 시작, 단어 4/6/8.
- 게임 6종 (모두 시안에서 플레이 가능, 로직 그대로 이식):
  1. **상식 퀴즈** — 세계 수도·한국 상식·생활/자연·속담. 4지선다, 즉시 정/오답 표시 → "다음 문제".
  2. **카드 짝맞추기** — 같은 그림 찾기. 3D 뒤집기(rotateY), 컬러 아이콘 일러스트. 맞춘 짝/뒤집기 횟수 표시.
  3. **단어 맞추기** — 제시어와 어울리는 짝 고르기(바늘→실 등). 보기 셔플.
  4. **순서 기억** — 4색 패드가 순서대로 점등 → 따라 누르기(사이먼). 단계마다 길이 +1.
  5. **숫자 계산** — 간단한 +/− 4지선다. 난이도별 수 범위.
  6. **색깔 맞추기 (스트룹)** — 글자의 *색깔* 고르기(글자 내용 무시). 색 스와치 보기.
- 각 게임: 결과 화면(맞힌 개수 / 얻은 포인트 / 배수 표시), **다시하기**, 점수 자동 적립.

### 3-4. 포인트 / 환전
- 포인트: 보유 P + 오늘 진행률 막대. 적립 내역 리스트. "환전 신청하기" 버튼.
- **하루 최대 1000점**, 자정(KST) 리셋. (난이도 체감: 어려움 ~40분 / 보통 ~50분 / 쉬움 ~60분에 한도 도달하도록 점수 설계)
- 적립 경로: 게임 + **사진 올리기(+5점)**.
- 환전: 금액 선택(5,000/10,000/30,000/50,000 P, 1P=1원) → 신청 → 내역에 `대기` 추가. **자녀가 승인하면 상태 `완료`, 실제 송금은 가족이 직접.** 상태 배지: 대기(주황)/완료(초록)/거절(빨강).

### 3-5. 일정 · 달력
- 월간 달력: 일정 있는 날 점 표시, 날짜 탭 → 그날 일정 보기(선택일 하이라이트).
- 날짜별 일정 추가(바텀시트): 종류 칩(약/병원/운동/가족/기타) + 내용 + 시간. 완료 체크 토글.
- 정한 시간에 알림 발송(→ 스케줄러).

### 3-6. 약 관리
- 약 등록: 이름 · 용량 · 먹는 시간(아침/점심/저녁/자기 전 다중 선택).
- 등록 시 **2주치 복용 알림 자동 생성**.
- 등록 약 목록 / 삭제.

### 3-7. 가족 (양방향)
- 어머니: **사진 올리기(+5P)** → Supabase Storage 저장 / 내가 올린 사진 그리드 / 가족이 보낸 소식(메시지 말풍선).
- **연결 코드 생성**(짧은 코드) → 자녀에게 전달 / 새 코드 발급.
- 자녀: `/connect`에서 코드 입력해 연결 → 어머니 최근 사진 보기 + 글·사진 보내기 + **환전 승인/거절**.

### 3-8. 설정
- 내 이름 수정(인라인) · 글자 크기(보통/크게/아주 크게) · 고대비 모드 · 알림 켜기. 모두 저장·전 화면 적용.
- 알림 켜짐 시 **방해 금지 시간(밤 9시~아침 8시)** 안내.

---

## 4. 인터랙션 / 모션
- 전환·호버·프레스는 **빠르고 절제**: 120ms(프레스/호버) / 200ms(드롭다운·토스트) / 320ms(바텀시트). easing `cubic-bezier(0.2,0,0,1)`.
- 카드 뒤집기 `transform: rotateY` 0.4s. 결과 화면 트로피 `pop` 등장. 바텀시트 아래→위 슬라이드.
- 토스트: 화면 하단, 1.8초 후 자동 사라짐(예: "사진을 올렸어요 +5P", "2주치 복용 알림을 만들었어요").
- 정답=초록 테두리+circle-check, 오답=빨강 테두리+circle-info.

---

## 5. 상태 / 데이터 모델 (Supabase)

```sql
-- 사용자 프로필 (auth.users 확장)
profiles            (id PK→auth.users, name, role['mom'|'child'], font_scale, high_contrast, notify_on, created_at)
-- 가족 연결
family_links        (id, mom_id→profiles, child_id→profiles, status, created_at)
connect_codes       (code PK, mom_id→profiles, expires_at, used_by)
-- 포인트
point_ledger        (id, user_id, delta, reason['game'|'photo'], game_id, created_at)
daily_points        (user_id, date, total)             -- 자정 KST 리셋, 하루 max 1000
game_scores         (id, user_id, game_id, difficulty, correct, total, points, created_at)
-- 환전
exchange_requests   (id, user_id, amount, status['pending'|'approved'|'rejected'|'done'], approved_by, created_at)
-- 일정 / 약
events              (id, user_id, date, type, title, time, done)
medications         (id, user_id, name, dose, times text[])   -- ['아침','저녁']
med_doses           (id, med_id, user_id, scheduled_at, taken)  -- 등록 시 2주치 자동 생성
-- 가족 소식 / 사진
photos              (id, owner_id, storage_path, caption, created_at)
messages            (id, family_id, from_id, text, photo_id, created_at)
-- 푸시
push_subscriptions  (id, user_id, endpoint, p256dh, auth, created_at)
notifications       (id, user_id, kind, title, body, send_at, sent, channel['push'|'email'])
```
- **RLS**: 본인 + 연결된 가족만 접근. 자녀는 어머니의 photos/events 읽기, exchange_requests 승인 가능.
- **하루 한도/리셋**: 적립 시 `daily_points(today)` 확인해 1000 초과분은 적립 안 함. 자정(Asia/Seoul) 기준으로 date 키 분리(크론 불필요, date로 자연 리셋).

---

## 6. 백엔드 동작
1. **인증**: Supabase Auth(email+password), `persistSession: true`로 자동 로그인 유지. 미들웨어로 비로그인 → `/login`.
2. **약 등록 → 알림 생성**: medication INSERT 시 트리거/서버액션으로 `med_doses` 2주치 + `notifications`(send_at) 생성.
3. **스케줄러(15분)**: `api/cron/notify`가 `notifications`에서 `send_at <= now & !sent` 조회 → 웹 푸시 발송, 실패 시 이메일 폴백 → `sent=true`. **방해 금지(21:00–08:00 KST)** 면 다음 08:00로 미룸.
4. **웹 푸시**: VAPID 키, 클라이언트 구독 → `push_subscriptions` 저장. SW가 `push` 이벤트로 시스템 알림 표시.
5. **연결 코드**: 어머니가 생성(짧은 코드, 만료 有) → 자녀 `/connect` 입력 → `family_links` 생성.
6. **사진**: Supabase Storage 업로드 → `photos` 행 + 포인트 +5.
7. **환전 승인**: 자녀가 `approved`로 변경 → 어머니에게 알림. 실제 송금은 앱 밖(가족).

---

## 7. 디자인 토큰 (`colors_and_type.css` 사용)
- **폰트**: Pretendard. 본문 Medium(500), 제목 Bold(700).
- **포인트(브랜드) 블루**: `#0066FF` — 주요 버튼·링크·선택 상태에만.
- **중립**: coolNeutral 계열. 페이지 워시 `#F7F7F8`, 카드 흰색.
- **게임/카테고리 액센트**(타일·칩에만): 상식퀴즈 violet `#5B37ED`, 짝맞추기 pink `#E846CD`, 단어 cyan `#0098B2`, 순서기억 orange `#FF5E00`, 계산 blue `#0066FF`, 색깔 green `#42A800`.
- **상태색**: 정답/완료 초록 `#00A63E`, 오답/거절 빨강 `#E52222`, 대기/주의 주황 `#FF9200`.
- **radius**: 버튼 16, 카드 24, 바텀시트 28, 칩 999. **shadow**: 아주 옅게(`0 1px 4px rgba(0,0,0,.06)`), 그라데이션 카드만 컬러 그림자 약하게.
- **글자배율 변수** `--fs`, **테마 변수** `--c-bg/-card/-screen/-text/-sub/-faint/-line/-primary` (일반/고대비 2세트) — 시안 `Carely.dc.html`의 `renderVals()` 안 `theme` 객체 참고.

## 8. 에셋
- 아이콘: `icons/` (Wanted DS에서 발췌, `pill.svg`만 신규 제작). `currentColor` 단일 path → CSS `color`로 틴트(또는 mask 기법). 추가 필요 시 Wanted DS 아이콘 세트에서 보충.
- 카드/사진 자리는 시안에서 그라데이션 플레이스홀더 → 실제 사진(Storage)으로 교체.
- 폰트는 Pretendard CDN 또는 self-host.

## 9. 기준 파일
- `Carely.dc.html` — 전 화면·게임 로직·인터랙션의 ground truth. 게임 6종 알고리즘, 난이도 표, 인사말 분기, 포인트 적립/한도, 자녀 승인 흐름이 모두 코드로 들어있으니 **로직은 이 파일에서 추출**하세요.

---

## 10. Claude Code에 이렇게 시키면 됩니다 (단계별)

이 폴더를 레포에 넣고(`docs/handoff/`), Claude Code에 순서대로 요청하세요:

1. *"`docs/handoff/README.md`와 `Carely.dc.html`을 읽어. 1번의 추천 스택(Next.js App Router + TS + Tailwind + Supabase + PWA 웹푸시)으로 프로젝트를 초기화하고, 7번 디자인 토큰을 Tailwind 테마/CSS 변수로 등록해줘. `--fs` 글자배율과 고대비 테마 변수도 세팅."*
2. *"Supabase 스키마(5번)와 RLS 정책을 마이그레이션으로 만들어줘. 이메일+비번 인증과 자동 로그인 유지, 비로그인 가드까지."*
3. *"3-1, 3-2 화면(로그인/회원가입/홈 대시보드)을 `Carely.dc.html`과 픽셀·문구·인터랙션 동일하게 구현. '오늘 챙길 일' 체크, 시간대별 인사, 글자크기/고대비 반영."*
4. *"게임 6종(3-3)을 `Carely.dc.html`의 로직 그대로 이식. 난이도 3단계·포인트 배수·결과·다시하기·자동 적립. 점수는 `game_scores`/`point_ledger`에 기록하고 하루 1000점 한도(자정 KST 리셋) 적용."*
5. *"포인트/환전(3-4), 일정·달력(3-5), 약 관리(3-6) 화면 구현. 약 등록 시 2주치 `med_doses`+`notifications` 자동 생성."*
6. *"가족(3-7)·자녀 `/connect`·설정(3-8) 구현. 사진은 Supabase Storage, 연결 코드 발급/입력, 환전 승인."*
7. *"웹 푸시(VAPID+SW)와 15분 크론(`api/cron/notify`) 구현. 방해 금지 21–08시, 실패 시 이메일 폴백. PWA manifest/Service Worker로 설치형 앱 완성."*

각 단계 끝에 *"`Carely.dc.html` 해당 화면과 나란히 비교해서 어긋난 곳 고쳐줘"* 를 덧붙이면 충실도가 올라갑니다.
