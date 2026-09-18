// 순수 게임 로직 — 시안 Carely.dc.html (363–385, 454–458) 그대로 이식. React 비의존.

import { DIFF, POINTS_PER, type Difficulty, type GameId } from "@/lib/games/config";
import {
  QUIZ, WORDQ, SCOLORS, MEMFACES, SEQPADS,
  CAPITALS, SEASONAL, IDIOMS,
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
//
// 출제는 두 단계다.
//  1) 후보(QuizCandidate) 목록을 만든다 — 지식 테이블에서 파생한 양방향 문제 + QUIZ 단발 문항.
//     후보는 "출처(source)"를 들고 있고, 한 판 안에서 같은 출처는 한 번만 쓴다.
//     (안 막으면 "프랑스의 수도는?" 과 "파리 — 어느 나라의 수도일까요?" 가 같은 판에 나와 답을 흘린다.)
//  2) 고른 후보를 실제 문제로 만든다 — 이때 오답을 뽑고 보기를 셔플한다.
//     정답 위치는 매 판 무작위이므로 "첫 보기 찍기" 가 통하지 않는다.

export type QuizRound = { q: string; o: string[]; a: number };

/** 보기 셔플 전의 문제. 정답은 인덱스가 아니라 문자열로 들고 있다. */
type RawQuestion = { q: string; ans: string; d: string[] };

/** 지연 생성 후보. make() 는 호출될 때마다 오답을 새로 뽑는다. */
type QuizCandidate = { source: string; make: () => RawQuestion };

/** 같은 권역 풀이 이만큼 안 되면 오답을 전체 풀에서 뽑는다. */
const NEAR_POOL_MIN = 4;

/**
 * 오답 n개를 뽑는다. 가까운 풀(같은 권역·같은 카테고리) 우선, 모자라면 전체 풀로 보충.
 * 정답과 같은 값, 중복은 제외한다.
 */
function pickDistractors(ans: string, near: readonly string[], all: readonly string[], n = 3): string[] {
  const pool = (xs: readonly string[]) => Array.from(new Set(xs)).filter((x) => x !== ans);
  const out = shuffle(pool(near)).slice(0, n);
  if (out.length < n) {
    const rest = shuffle(pool(all)).filter((x) => !out.includes(x));
    out.push(...rest.slice(0, n - out.length));
  }
  return out;
}

function capitalCandidates(): QuizCandidate[] {
  const allCaps = CAPITALS.map((c) => c.capital);
  const allCountries = CAPITALS.map((c) => c.country);
  return CAPITALS.flatMap((f) => {
    const region = CAPITALS.filter((x) => x.region === f.region);
    const near = region.length >= NEAR_POOL_MIN ? region : CAPITALS;
    const source = `cap:${f.country}`;
    return [
      {
        source,
        make: () => ({
          q: `${f.country}의 수도는 어디일까요?`,
          ans: f.capital,
          d: pickDistractors(f.capital, near.map((x) => x.capital), allCaps),
        }),
      },
      {
        source,
        make: () => ({
          q: `${f.capital} — 어느 나라의 수도일까요?`,
          ans: f.country,
          d: pickDistractors(f.country, near.map((x) => x.country), allCountries),
        }),
      },
    ];
  });
}

function seasonalCandidates(): QuizCandidate[] {
  const foods = SEASONAL.map((s) => s.food);
  const occasions = SEASONAL.map((s) => s.occasion);
  return SEASONAL.flatMap((f) => {
    const source = `season:${f.occasion}`;
    return [
      {
        source,
        make: () => ({
          q: `${f.occasion}에 먹는 대표 음식은?`,
          ans: f.food,
          d: pickDistractors(f.food, foods, foods),
        }),
      },
      {
        source,
        make: () => ({
          q: `${f.food} — 언제 먹는 음식일까요?`,
          ans: f.occasion,
          d: pickDistractors(f.occasion, occasions, occasions),
        }),
      },
    ];
  });
}

function idiomCandidates(): QuizCandidate[] {
  const meanings = IDIOMS.map((i) => i.meaning);
  const idioms = IDIOMS.map((i) => i.idiom);
  return IDIOMS.flatMap((f) => {
    const source = `idiom:${f.idiom}`;
    return [
      {
        source,
        make: () => ({
          q: `'${f.idiom}'의 뜻은?`,
          ans: f.meaning,
          d: pickDistractors(f.meaning, meanings, meanings),
        }),
      },
      {
        source,
        make: () => ({
          q: `'${f.meaning}' — 이 뜻의 한자성어는?`,
          ans: f.idiom,
          d: pickDistractors(f.idiom, idioms, idioms),
        }),
      },
    ];
  });
}

/** 지식 파생 + QUIZ 단발 문항을 합친 전체 후보 풀. */
export function quizCandidates(): QuizCandidate[] {
  const statics: QuizCandidate[] = QUIZ.map((item) => ({
    source: `quiz:${item.q}`,
    make: () => ({
      q: item.q,
      ans: item.o[item.a],
      d: item.o.filter((_, i) => i !== item.a),
    }),
  }));
  return [...capitalCandidates(), ...seasonalCandidates(), ...idiomCandidates(), ...statics];
}

export function buildQuizList(n: number): QuizRound[] {
  const seen = new Set<string>();
  const chosen: QuizCandidate[] = [];
  for (const c of shuffle(quizCandidates())) {
    if (chosen.length >= n) break;
    if (seen.has(c.source)) continue;
    seen.add(c.source);
    chosen.push(c);
  }
  return chosen.map((c) => {
    const raw = c.make();
    const o = shuffle([raw.ans, ...raw.d]);
    return { q: raw.q, o, a: o.indexOf(raw.ans) };
  });
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
