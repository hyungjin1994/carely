// 게임 설정 — 시안 Carely.dc.html 의 DIFF / GAMES 를 그대로 이식.

export type GameId = "quiz" | "mem" | "word" | "seq" | "math" | "stroop";
export type Difficulty = "easy" | "normal" | "hard";

export type DiffConfig = {
  label: string;
  short: string;
  mult: number;
  detail: string;
  color: string;
  n: Record<GameId, number>;
};

export const DIFF: Record<Difficulty, DiffConfig> = {
  easy: {
    label: "쉬움", short: "하", mult: 1, detail: "적당한 양 · 천천히", color: "#00A63E",
    n: { quiz: 8, math: 10, stroop: 12, mem: 8, seq: 5, word: 8 },
  },
  normal: {
    label: "보통", short: "중", mult: 2, detail: "문제 많이 · 포인트 2배", color: "#FF9200",
    n: { quiz: 10, math: 14, stroop: 16, mem: 10, seq: 6, word: 10 },
  },
  hard: {
    label: "어려움", short: "상", mult: 3, detail: "아주 많이 · 포인트 3배", color: "#E52222",
    n: { quiz: 12, math: 18, stroop: 20, mem: 12, seq: 7, word: 12 },
  },
};

export type GameMeta = {
  id: GameId;
  name: string;
  desc: string;
  color: string;
  icon: string;
};

export const GAMES: GameMeta[] = [
  { id: "quiz", name: "상식 퀴즈", desc: "세계 수도·한국 상식·속담", color: "#5B37ED", icon: "sparkle-fill" },
  { id: "mem", name: "카드 짝맞추기", desc: "같은 그림 찾기", color: "#E846CD", icon: "heart-fill" },
  { id: "word", name: "단어 맞추기", desc: "어울리는 짝 고르기", color: "#0098B2", icon: "pencil" },
  { id: "seq", name: "순서 기억", desc: "켜지는 순서대로 누르기", color: "#FF5E00", icon: "fire-fill" },
  { id: "math", name: "숫자 계산", desc: "간단한 더하기·빼기", color: "#0066FF", icon: "coins-fill" },
  { id: "stroop", name: "색깔 맞추기", desc: "글자의 색깔을 맞혀요", color: "#42A800", icon: "star-fill" },
];

/** 정답 1개당 기본 점수. 최종 점수 = correct * POINTS_PER * mult. */
export const POINTS_PER = 4;

/** 하루 최대 포인트 (KST 자정 리셋). */
export const DAILY_CAP = 1000;

/**
 * 게임 1종당 하루 최대 적립 포인트 (KST 자정 리셋).
 * 한 게임만 반복해서 포인트를 몰아 받지 못하게 하는 제한.
 * 권위는 submit_game_result RPC — 변경 시 마이그레이션 0005 의 per_game_cap 도 같이 맞출 것.
 */
export const PER_GAME_DAILY_CAP = 200;

export const GAME_IDS: GameId[] = GAMES.map((g) => g.id);

export function getGame(id: GameId): GameMeta {
  return GAMES.find((g) => g.id === id)!;
}
