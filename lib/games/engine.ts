// 순수 게임 로직 — 시안 Carely.dc.html (363–385, 454–458) 그대로 이식. React 비의존.

import { DIFF, POINTS_PER, type Difficulty, type GameId } from "@/lib/games/config";
import {
  QUIZ, WORDQ, SCOLORS, MEMFACES, SEQPADS,
  type StroopColor, type WordItem,
} from "@/lib/games/data";

export function shuffle<T>(a: readonly T[]): T[] {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

// ── 퀴즈 ──
export type QuizRound = { q: string; o: string[]; a: number };
export function buildQuizList(n: number): QuizRound[] {
  return shuffle(QUIZ).slice(0, n).map((q) => ({ q: q.q, o: q.o, a: q.a }));
}

// ── 단어 (보기 셔플) ──
export type WordRound = { q: string; opts: string[]; a: number };
export function wordRound(w: WordItem): WordRound {
  const opts = shuffle([w.ans, ...w.d]);
  return { q: w.q, opts, a: opts.indexOf(w.ans) };
}
export function buildWordList(n: number): WordRound[] {
  return shuffle(WORDQ).slice(0, n).map(wordRound);
}

// ── 계산 ──
export type MathRound = {
  a: number; b: number; plus: boolean; ans: number; opts: number[]; correct: number;
};
export function mathRound(diff: Difficulty): MathRound {
  const max = diff === "easy" ? 9 : diff === "normal" ? 20 : 50;
  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;
  const plus = Math.random() < 0.5;
  if (!plus && a < b) {
    [a, b] = [b, a];
  }
  const ans = plus ? a + b : a - b;
  const opts = shuffle(
    [
      ans,
      ans + Math.floor(Math.random() * 3) + 1,
      Math.max(0, ans - (Math.floor(Math.random() * 3) + 1)),
      ans + (Math.random() < 0.5 ? 2 : -2),
    ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4),
  );
  while (opts.length < 4) {
    const c = ans + Math.floor(Math.random() * 7) - 3;
    if (!opts.includes(c) && c >= 0) opts.push(c);
  }
  const shuffled = shuffle(opts);
  return { a, b, plus, ans, opts: shuffled, correct: shuffled.indexOf(ans) };
}

// ── 색깔 (스트룹) ──
export type StroopRound = { word: string; ink: StroopColor; opts: StroopColor[] };
export function stroopRound(): StroopRound {
  const word = SCOLORS[Math.floor(Math.random() * SCOLORS.length)];
  const ink = SCOLORS[Math.floor(Math.random() * SCOLORS.length)];
  const opts = shuffle(SCOLORS);
  return { word: word.name, ink, opts };
}

// ── 카드 짝맞추기 덱 ──
export type MemCard = {
  icon: string; color: string; key: number; flipped: boolean; matched: boolean;
};
export function memDeck(pairs: number): MemCard[] {
  const faces = MEMFACES.slice(0, pairs);
  return shuffle([...faces, ...faces]).map((f, i) => ({
    ...f, key: i, flipped: false, matched: false,
  }));
}

// ── 순서 기억 패턴 (0-3 인덱스) ──
export function seqPattern(len: number): number[] {
  const p: number[] = [];
  for (let i = 0; i < len; i++) p.push(Math.floor(Math.random() * 4));
  return p;
}
export function seqStartLen(diff: Difficulty): number {
  return diff === "easy" ? 4 : diff === "normal" ? 5 : 6;
}

// ── 점수식 ──
export function scoreFor(correct: number, mult: number): number {
  return correct * POINTS_PER * mult;
}

/** 서버 채점 시 라운드 수 상한 (클라가 보낸 correct/total 클램프용). */
export function maxRounds(id: GameId, diff: Difficulty): number {
  return DIFF[diff].n[id];
}

export { SEQPADS };
