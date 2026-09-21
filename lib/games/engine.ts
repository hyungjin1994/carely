// 순수 게임 로직 — 시안 Carely.dc.html (363–385, 454–458) 그대로 이식. React 비의존.

import { DIFF, POINTS_PER, type Difficulty, type GameId } from "@/lib/games/config";
import { mathParams, stroopParams } from "@/lib/games/levels";
import {
  SCOLORS, MEMFACES, SEQPADS,
  type StroopColor,
} from "@/lib/games/data";

export function shuffle<T>(a: readonly T[]): T[] {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

// ── 계산 ──
export type MathRound = {
  a: number; b: number; plus: boolean; ans: number; opts: number[]; correct: number;
};
export function mathRound(level: number): MathRound {
  const max = mathParams(level).maxOperand;
  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;
  const plus = Math.random() < 0.5;
  if (!plus && a < b) {
    [a, b] = [b, a]; // 음수 답을 만들지 않는다
  }
  const ans = plus ? a + b : a - b;

  // 오답 간격을 정답 크기에 비례해 벌린다.
  // 전에는 항상 ±3 이내여서 어려움(정답이 100 근처)에서 보기가 73/74/76/71 처럼
  // 나왔다. 그러면 계산 문제가 아니라 비슷한 숫자를 가려내는 읽기 과제가 된다.
  // 난이도는 계산 자체(숫자 크기)로 올리고, 보기는 구분이 되게 둔다.
  const spread = Math.max(1, Math.round(Math.max(ans, max) * 0.12));

  // 보기끼리 최소 간격도 둔다. 간격을 안 두면 68 옆에 67 이 붙어 나와
  // 잘못 읽고 누를 수 있다. 숫자가 작은 쉬움에서는 1 이 최선이다.
  const minGap = Math.max(1, Math.round(spread / 3));

  const opts: number[] = [ans];
  const fits = (v: number) => v >= 0 && opts.every((o) => Math.abs(o - v) >= minGap);
  for (let guard = 0; opts.length < 4 && guard < 80; guard++) {
    const step = Math.floor(Math.random() * spread) + 1;
    const cand = ans + (Math.random() < 0.5 ? step : -step);
    if (fits(cand)) opts.push(cand);
  }
  // 정답이 0 근처면 아래쪽 후보가 막히므로 위로 채운다.
  for (let up = ans + minGap; opts.length < 4; up += minGap) {
    if (fits(up)) opts.push(up);
  }

  const shuffled = shuffle(opts);
  return { a, b, plus, ans, opts: shuffled, correct: shuffled.indexOf(ans) };
}

// ── 색깔 (스트룹) ──
export type StroopRound = {
  word: string;
  ink: StroopColor;
  opts: StroopColor[];
  /** 글자와 잉크가 같은 색인 시행. 간섭이 없어 쉽다. */
  congruent: boolean;
};

export function stroopRound(level: number): StroopRound {
  const cfg = stroopParams(level);
  const ink = SCOLORS[Math.floor(Math.random() * SCOLORS.length)];
  const congruent = Math.random() < cfg.congruentRatio;
  const others = SCOLORS.filter((c) => c.hex !== ink.hex);
  const word = congruent ? ink : others[Math.floor(Math.random() * others.length)];

  // 보기에 정답(잉크색)과 유혹(글자가 지칭하는 색)을 반드시 넣는다.
  // 유혹이 빠지면 간섭이 생기지 않아 스트룹이 아니게 된다.
  const must = congruent ? [ink] : [ink, word];
  const filler = shuffle(SCOLORS.filter((c) => !must.some((m) => m.hex === c.hex)));
  const count = Math.min(Math.max(cfg.optionCount, must.length), SCOLORS.length);
  const opts = shuffle([...must, ...filler.slice(0, count - must.length)]);

  return { word: word.name, ink, opts, congruent };
}

// ── 카드 짝맞추기 덱 ──
export type MemCard = {
  icon: string; color: string; key: number; flipped: boolean; matched: boolean;
};
export function memDeck(pairs: number): MemCard[] {
  // 아이콘 풀도 매 판 섞는다. slice(0, pairs) 만 하면 쉬움(8쌍)은 늘 같은 8개가
  // 같은 순서로 나온다 — 미리보기를 넣으면 외울 필요가 없어져 더 치명적이다.
  const faces = shuffle(MEMFACES).slice(0, pairs);
  return shuffle([...faces, ...faces]).map((f, i) => ({
    ...f, key: i, flipped: false, matched: false,
  }));
}

// ── 순서 기억 패턴 (0-3 인덱스) ──
/**
 * 같은 칸이 연달아 나오지 않게 한다.
 * 점등이 560ms 켜지고 240ms 꺼지는데, 같은 칸이 두 번 연속이면 그 240ms 를
 * 놓쳐 한 번 켜진 것으로 보일 수 있다. 시니어 대상에서는 순서를 외우는 문제가
 * 아니라 "몇 번 켜졌는지" 를 알아채는 문제가 되어버린다.
 */
export function seqPattern(len: number): number[] {
  const p: number[] = [];
  for (let i = 0; i < len; i++) {
    let v = Math.floor(Math.random() * 4);
    while (i > 0 && v === p[i - 1]) v = Math.floor(Math.random() * 4);
    p.push(v);
  }
  return p;
}

// ── 점수식 ──
export function scoreFor(correct: number, mult: number): number {
  return correct * POINTS_PER * mult;
}

/**
 * 서버 채점 시 라운드 수 상한 (클라가 보낸 correct/total 클램프용).
 * 3단계를 쓰는 게임(상식 퀴즈·단어 맞추기) 전용이다.
 * 레벨 게임은 levels.ts 의 levelRounds() 를 쓴다.
 */
export function maxRounds(id: GameId, diff: Difficulty): number {
  return DIFF[diff].n[id];
}

export { SEQPADS };
