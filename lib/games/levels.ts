import type { GameId } from "@/lib/games/config";

/**
 * 게임 레벨 — 3단계(쉬움/보통/어려움) 대신 연속 레벨을 쓰는 게임들의 난이도 곡선.
 *
 * ── 왜 3단계를 버리는가 ──
 * 3단계는 천장이 있다. 어려움을 편하게 깨는 순간 갈 곳이 없어 같은 난이도를
 * 반복하게 되고, 그러면 훈련 효과가 없다. 인지 훈련은 능력의 경계에서 효과가
 * 나오므로 성공률이 일정 구간에 머물도록 난이도가 계속 따라가야 한다.
 * (순서 기억은 이미 라운드마다 길이를 늘리는 방식으로 이 구조였다. 다만 세션
 *  간에 기억되지 않아 매번 처음부터 시작했다.)
 *
 * ── 왜 4종만인가 ──
 * 문제를 규칙으로 생성하는 게임만 레벨이 붙는다. 상식 퀴즈·단어 맞추기는
 * 미리 써둔 문제를 꺼내 쓰므로 난이도 축이 없다 — "프랑스의 수도는?" 은
 * 알거나 모르거나다. 제한 시간을 걸면 지식 문제가 반응속도 문제로 변질된다.
 * 그 둘은 은행을 키우는 쪽으로 간다.
 *
 * ── 레벨은 서버가 보관한다 ──
 * 포인트 배수가 레벨에서 나오므로, 클라이언트가 보낸 레벨을 신뢰하면 포인트를
 * 마음대로 받을 수 있다. game_levels 테이블이 유일한 진실이고 채점은 서버가
 * 그 값으로 한다(app/(app)/games/actions.ts).
 */

export const MAX_LEVEL = 30;

export const LEVELED_GAMES = ["mem", "stroop", "math", "seq"] as const;
export type LeveledGameId = (typeof LEVELED_GAMES)[number];

export function isLeveled(id: GameId): id is LeveledGameId {
  return (LEVELED_GAMES as readonly string[]).includes(id);
}

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(MAX_LEVEL, Math.max(1, Math.round(level)));
}

/** 포인트 배수. L1 1.0배 → 최고 레벨 4.0배까지 고르게 오른다. */
export function levelMult(level: number): number {
  const raw = 1 + ((clampLevel(level) - 1) * 3) / (MAX_LEVEL - 1);
  return Math.round(raw * 10) / 10;
}

/**
 * 레벨 게임의 판당 포인트. 문항 수와 무관하게 "만점 기준 × 비율 × 배수" 로 계산한다.
 *
 * 전에는 correct * 4 * mult 였는데, 게임마다 문항 수가 달라 만점이 84P(순서 기억)
 * 에서 240P(색깔 어려움)까지 들쭉날쭉했다. 240P 는 게임당 하루 상한(200P)을 넘어서
 * 한 판만으로 잘려버렸다.
 * 이제 L1 만점 50P → 최고 레벨 만점 200P(= 상한과 정확히 같다)로, 네 게임이
 * 같은 성과에 같은 포인트를 준다.
 */
export const LEVEL_BASE_POINTS = 50;

export function levelScore(correct: number, total: number, level: number): number {
  if (total <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, correct / total));
  return Math.round(LEVEL_BASE_POINTS * ratio * levelMult(level));
}

/** 카드 짝맞추기 — 쌍 개수·미리보기·뒤집기 제한이 함께 조여진다. */
export function memParams(level: number) {
  const lv = clampLevel(level);
  // 쌍 개수는 12에서 멈춘다 — 4×6=24장이 한 화면에 들어오는 한계다.
  // 그 뒤로는 미리보기와 제한 횟수만 조여서 난이도를 계속 올린다.
  const pairs = Math.min(12, 5 + Math.ceil(lv / 2)); // L1 6 → L14 12
  const msPerPair = Math.max(150, 800 - lv * 25); // L1 775ms → L26 150ms
  const limitPerPair = Math.max(1.8, 5.2 - lv * 0.115); // L1 5.09 → L30 1.8
  return {
    pairs,
    previewMs: msPerPair * pairs,
    moveLimit: Math.ceil(pairs * limitPerPair),
  };
}

/** 색깔 맞추기 — 보기 개수·일치 비율·제한 시간. */
export function stroopParams(level: number) {
  const lv = clampLevel(level);
  return {
    rounds: Math.min(20, 11 + Math.ceil(lv / 3)), // L1 12 → L27 20
    optionCount: Math.min(5, 2 + Math.ceil(lv / 9)), // L1 3 · L10 4 · L19 5
    // 일치 시행(글자와 잉크가 같은 색)은 간섭이 없어 공짜 정답이다. 초반에만 섞는다.
    congruentRatio: Math.max(0, 0.4 - lv * 0.03), // L1 37% → L14 0%
    // 스트룹은 속도 과제다. 초반 2레벨은 제한을 두지 않아 연습 구간으로 남긴다.
    limitMs: lv <= 2 ? 0 : Math.max(1800, 7300 - lv * 200), // L3 6.7초 → L28 1.8초
  };
}

/** 숫자 계산 — 숫자 범위. 보기 간격은 engine 이 정답 크기에 비례해 잡는다. */
export function mathParams(level: number) {
  const lv = clampLevel(level);
  return {
    rounds: Math.min(18, 9 + Math.ceil(lv / 3)), // L1 10 → L27 18
    maxOperand: 5 + lv * 3, // L1 8 → L30 95
  };
}

/** 순서 기억 — 시작 길이. 라운드마다 +1 되는 구조는 그대로 둔다. */
export function seqParams(level: number) {
  const lv = clampLevel(level);
  return {
    rounds: Math.min(8, 4 + Math.ceil(lv / 6)), // L1 5 → L19 8
    startLen: Math.min(9, 2 + Math.ceil(lv / 3)), // L1 3 → L21 9
  };
}

/** 채점용 라운드 수 상한. 짝맞추기는 쌍 개수가 곧 만점 기준이다. */
export function levelRounds(id: LeveledGameId, level: number): number {
  switch (id) {
    case "mem":
      return memParams(level).pairs;
    case "stroop":
      return stroopParams(level).rounds;
    case "math":
      return mathParams(level).rounds;
    case "seq":
      return seqParams(level).rounds;
  }
}

/**
 * 판이 끝난 뒤 다음 레벨.
 * 성공률을 60~85% 구간에 머물게 하는 계단식 조정이다 — 너무 쉬우면 자극이 없고
 * 너무 어려우면 그만두게 된다.
 */
export const LEVEL_UP_RATIO = 0.85;
export const LEVEL_DOWN_RATIO = 0.6;

export function nextLevel(level: number, correct: number, total: number): number {
  const lv = clampLevel(level);
  const ratio = total > 0 ? correct / total : 0;
  if (ratio >= LEVEL_UP_RATIO) return Math.min(MAX_LEVEL, lv + 1);
  if (ratio < LEVEL_DOWN_RATIO) return Math.max(1, lv - 1);
  return lv;
}

/** 화면 표시용. "7단계 · 포인트 2.2배" */
export function levelLabel(level: number): string {
  return `${clampLevel(level)}단계`;
}
