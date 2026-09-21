// 게임 설정 — 시안 Carely.dc.html 의 DIFF / GAMES 를 그대로 이식.

export type GameId = "quiz" | "mem" | "word" | "seq" | "math" | "stroop";
export type Difficulty = "easy" | "normal" | "hard";

/** 보드 구조가 같은 4지선다 게임 — 문제 은행에서 출제되므로 서버에서 뽑는다. */
export type ChoiceGameId = "quiz" | "word";

/**
 * 클라이언트로 내려가는 한 문제.
 * qid(출제 이력 키)는 클라가 쓸 일이 없어 빼고 내린다.
 * answer 는 즉시 정답 피드백(OptionButton)을 주려면 클라에 있어야 한다 —
 * 채점 권위는 별개로 submitGameResult 가 서버에서 다시 계산한다.
 */
export type ChoiceRound = { prompt: string; options: string[]; answer: number };

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

/**
 * 카드 짝맞추기 설정.
 *
 * ── 왜 미리보기와 제한이 필요한가 ──
 * 전에는 뒤집기 횟수에 제한도 대가도 없어서, 기억을 쓰지 않고 전부 열어봐도
 * 반드시 모든 짝을 맞출 수 있었다. onFinish(matched) 가 항상 만점이라
 * 8번에 끝내도 60번에 끝내도 점수가 같았다 — 즉 게임이 "생각 안 하기"를
 * 보상하고 있었다. 정답률이 100% 로 고정되니 다음 단계 권유(70% 기준)도
 * 매번 떴다.
 *
 * 미리보기: 시작할 때 전체 카드를 보여준다. 이게 없으면 초반에 기억할 정보가
 *   아예 없어서 무작정 열어보는 것이 실제로 최적 전략이 된다. 미리보기가 있으면
 *   첫 수부터 기억이 자산이 되고, 모두에게 같은 정보를 주므로 제한을 걸어도 공평하다.
 *   쌍 개수가 다르므로 쌍당 시간으로 계산한다 — 8쌍과 12쌍에 같은 시간을 주면
 *   12쌍이 훨씬 불리하다. 난이도는 이 쌍당 시간으로 조절한다.
 *
 * 제한: 도달하면 판이 끝나지만 **맞춘 짝만큼 점수를 받는다**(0점이 아니다).
 *   목표는 "대충 다 열어보기"를 걸러내는 것이지 기억력이 약한 것을 벌주는 게
 *   아니므로 넉넉하게 잡는다. 12쌍 기준 대략 — 잘 기억하면 20~30번,
 *   보통 35~50번, 대충 열어보기 60번 이상.
 *
 * ⚠️ 두 값 모두 추정치다. 실제로 해보고 조정할 것. 여기 숫자만 바꾸면 된다.
 */
export const MEM = {
  /** 쌍당 미리보기 시간(ms). 쉬움 5.0초 · 보통 4.3초 · 어려움 3.3초. */
  previewMsPerPair: { easy: 625, normal: 425, hard: 275 } as Record<Difficulty, number>,
  /**
   * 뒤집기 제한 = 쌍 개수 × 이 값 (올림). 쉬움 32 · 보통 35 · 어려움 36.
   *
   * 난이도별로 배수를 다르게 둔다. 하나로 고정하면 쌍 개수만 늘어날 뿐
   * 난이도 곡선이 생기지 않는다.
   * 작업기억 용량별 완주율 시뮬레이션(각 4,000판)으로 고른 값:
   *              기억6   기억4(성인)  기억3
   *   쉬움 4.0   100%     100%        96%   ← 안전망
   *   보통 3.5   100%      97%        69%
   *   어려움 3.0  99%      63%        20%   ← 완주가 성취가 되게
   * 시뮬레이션은 미리보기 효과를 반영하지 않으므로 실제 완주율은 이보다 높다.
   */
  moveLimitPerPair: { easy: 4.0, normal: 3.5, hard: 3.0 } as Record<Difficulty, number>,
  /** 남은 뒤집기가 이 수 이하면 경고색으로 바꾼다. */
  warnAtMovesLeft: 5,
};

/**
 * 색깔 맞추기(스트룹) 설정.
 *
 * ── 왜 난이도 차등이 필요한가 ──
 * 전에는 stroopRound() 가 난이도를 받지 않아 쉬움·보통·어려움이 똑같은 문제를
 * 냈다. 다른 건 문항 수(12/16/20)와 배수뿐이어서, 어려움은 "어려운" 게 아니라
 * "긴" 것이었다.
 *
 * ── 왜 시간 제한이 필요한가 ──
 * 스트룹은 본래 속도 과제다. 간섭 효과(글자를 읽는 자동 처리가 색 이름 고르기를
 * 방해하는 현상)는 빠르게 반응할 때만 나타난다. 제한이 없으면 "글자는 빨강인데
 * 색은 파랑이네" 하고 천천히 추론해서 100% 맞고, 훈련 효과의 핵심이 빠진다.
 * 초과하면 그 문제만 못 맞힌 것으로 하고 넘어간다 — 실패 화면은 없다.
 * 쉬움은 제한을 두지 않아 연습 단계로 남긴다.
 */
export const STROOP = {
  /**
   * 보기 개수. 줄이면 쉬워진다.
   * 단 정답(잉크색)과 유혹(글자가 지칭하는 색)은 항상 포함된다 —
   * 유혹이 빠지면 간섭이 생기지 않아 스트룹이 아니게 된다.
   */
  optionCount: { easy: 3, normal: 4, hard: 5 } as Record<Difficulty, number>,
  /**
   * 일치 시행 비율 — 글자와 잉크가 같은 색(빨강이 빨간 글씨).
   * 간섭이 없어 공짜 정답이므로 쉬움에만 섞는다.
   * 전에는 5색을 독립 추출해서 전 난이도가 20% 로 고정이었다.
   */
  congruentRatio: { easy: 0.35, normal: 0.12, hard: 0 } as Record<Difficulty, number>,
  /** 문제당 제한 시간(ms). 0 이면 제한 없음. */
  limitMs: { easy: 0, normal: 5000, hard: 3500 } as Record<Difficulty, number>,
  /** 정오를 보여주고 다음 문제로 자동 넘어가기까지(ms). */
  revealMs: 850,
  /** 남은 시간이 이 비율 아래면 경고색. */
  warnRatio: 0.3,
};

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
