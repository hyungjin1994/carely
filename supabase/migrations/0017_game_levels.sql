-- 0017: 게임 레벨(game_levels) 추가.
--
-- 무엇: 규칙으로 문제를 생성하는 게임 4종(짝맞추기·색깔·계산·순서기억)의 난이도를
-- 3단계(쉬움/보통/어려움) 대신 연속 레벨 1~30 으로 관리한다.
--
-- 왜: 3단계는 천장이 있다. 어려움을 편하게 깨면 갈 곳이 없어 같은 난이도를
-- 반복하게 되고, 그러면 훈련 효과가 없다. 인지 훈련은 능력의 경계에서 효과가
-- 나오므로 성공률이 일정 구간(60~85%)에 머물도록 난이도가 계속 따라가야 한다.
-- 판이 끝나면 정답률에 따라 레벨이 ±1 움직인다(계단식 조정).
--
-- 왜 서버에 두는가: 포인트 배수가 레벨에서 나온다. 클라이언트가 보낸 레벨을
-- 신뢰하면 "레벨 30" 이라고 보내 포인트를 마음대로 받을 수 있다.
-- 이 테이블이 유일한 진실이고 채점은 서버(app/(app)/games/actions.ts)가 이 값으로 한다.
--
-- 상식 퀴즈·단어 맞추기는 레벨을 쓰지 않는다. 미리 써둔 문제를 꺼내 쓰므로
-- 난이도 축이 없다 — "프랑스의 수도는?" 은 알거나 모르거나다.
-- 그 둘은 계속 game_scores.difficulty 에 'easy'|'normal'|'hard' 를 쓴다.
--
-- 레벨 게임은 game_scores.difficulty 에 레벨 숫자를 문자열로 남긴다(예: '17').
-- submit_game_result RPC 는 건드리지 않았다 — 게임별 하루 상한을 클램프하는
-- 로직이 들어 있어 재작성 위험이 크고, 레벨은 이 테이블로 충분히 추적된다.

create table public.game_levels (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  game_id    text not null,
  level      integer not null default 1 check (level between 1 and 30),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.game_levels enable row level security;

-- 본인만. 자녀에게는 굳이 열지 않는다 — 필요해지면 family_read 를 따로 추가.
create policy game_levels_self on public.game_levels
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
