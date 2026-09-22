import { describe, expect, it } from "vitest";
import {
  QUIZ,
  WORDQ,
  buildRounds,
  candidatesFor,
  selectCandidates,
  type SeenMap,
} from "@/lib/games/quiz-bank";
import {
  ANIMALS,
  BODY_PARTS,
  CAPITALS,
  IDIOMS,
  OLD_UNITS,
  SEASONAL,
  SOLAR_TERMS,
} from "@/lib/games/quiz-facts";
import { DIFF } from "@/lib/games/config";

const HARD_QUIZ = DIFF.hard.n.quiz;

describe("문제 은행 데이터", () => {
  it("단발 문항: id 유일 · 보기 4개 · 정답 인덱스 유효", () => {
    const ids = new Set<string>();
    for (const q of QUIZ) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(q.o).toHaveLength(4);
      expect(new Set(q.o).size).toBe(4);
      expect(q.o[q.a]).toBeDefined();
    }
  });

  it("단어: id 유일 · 오답 3개 · 오답에 정답 없음", () => {
    const ids = new Set<string>();
    for (const w of WORDQ) {
      expect(ids.has(w.id)).toBe(false);
      ids.add(w.id);
      expect(w.d).toHaveLength(3);
      expect(w.d).not.toContain(w.ans);
      expect(new Set(w.d).size).toBe(3);
    }
  });

  it("지식 테이블: 양쪽 값이 모두 유일하다", () => {
    // 한쪽에 같은 값이 둘 있으면 오답으로 서로 뽑혀 정답이 두 개가 된다.
    const tables: [string, string[], string[]][] = [
      ["수도", CAPITALS.map((c) => c.country), CAPITALS.map((c) => c.capital)],
      ["성어", IDIOMS.map((i) => i.idiom), IDIOMS.map((i) => i.meaning)],
      ["명절", SEASONAL.map((s) => s.occasion), SEASONAL.map((s) => s.food)],
      ["절기", SOLAR_TERMS.map((t) => t.term), SOLAR_TERMS.map((t) => t.meaning)],
      ["동물", ANIMALS.map((a) => a.animal), ANIMALS.map((a) => a.baby)],
      ["몸", BODY_PARTS.map((b) => b.part), BODY_PARTS.map((b) => b.work)],
      ["옛단위", OLD_UNITS.map((u) => u.unit), OLD_UNITS.map((u) => u.size)],
    ];
    for (const [name, left, right] of tables) {
      expect(new Set(left).size, `${name} 왼쪽`).toBe(left.length);
      expect(new Set(right).size, `${name} 오른쪽`).toBe(right.length);
    }
  });

  it("지식 테이블: 빈 값이 없다", () => {
    for (const t of [
      ...CAPITALS.map((c) => [c.country, c.capital]),
      ...IDIOMS.map((i) => [i.idiom, i.meaning]),
      ...SEASONAL.map((s) => [s.occasion, s.food]),
      ...SOLAR_TERMS.map((x) => [x.term, x.meaning]),
      ...ANIMALS.map((a) => [a.animal, a.baby]),
      ...BODY_PARTS.map((b) => [b.part, b.work]),
      ...OLD_UNITS.map((u) => [u.unit, u.size]),
    ]) {
      expect(t[0].trim().length).toBeGreaterThan(0);
      expect(t[1].trim().length).toBeGreaterThan(0);
    }
  });

  it("qid 가 전부 유일하다", () => {
    // 겹치면 한쪽 문항의 출제 이력이 다른 문항에 섞인다.
    for (const g of ["quiz", "word"] as const) {
      const qids = candidatesFor(g).map((c) => c.qid);
      expect(new Set(qids).size).toBe(qids.length);
    }
  });

  it("문제 문구가 전부 유일하다", () => {
    // 같은 것을 묻는 문제가 두 벌 있으면 어머니가 중복으로 느낀다.
    const prompts = candidatesFor("quiz").map((c) => c.make().q);
    const dup = prompts.filter((p, i) => prompts.indexOf(p) !== i);
    expect(dup, `중복: ${[...new Set(dup)].slice(0, 5).join(" | ")}`).toHaveLength(0);
  });
});

describe("출제", () => {
  it("보기 4개 · 중복 없음 · 정답 포함", () => {
    for (let i = 0; i < 500; i++) {
      for (const r of buildRounds("quiz", HARD_QUIZ)) {
        expect(r.options).toHaveLength(4);
        expect(new Set(r.options).size).toBe(4);
        expect(r.options[r.answer]).toBeDefined();
      }
    }
  });

  it("한 판에 같은 지식의 양방향이 같이 나오지 않는다", () => {
    // "프랑스의 수도는?" 과 "파리 — 어느 나라?" 가 함께 나오면 답이 유출된다
    const pool = candidatesFor("quiz");
    for (let i = 0; i < 500; i++) {
      const picked = selectCandidates(pool, HARD_QUIZ, {});
      const sources = picked.map((c) => c.source);
      expect(new Set(sources).size).toBe(sources.length);
    }
  });

  it("정답 위치가 한쪽으로 쏠리지 않는다", () => {
    // 전에는 101문항 중 43개가 a:0 이라 "첫 보기 찍기" 가 43% 정답이었다
    const pos = [0, 0, 0, 0];
    let total = 0;
    for (let i = 0; i < 400; i++) {
      for (const r of buildRounds("quiz", HARD_QUIZ)) {
        pos[r.answer]++;
        total++;
      }
    }
    for (const p of pos) expect(p / total).toBeGreaterThan(0.2);
  });

  it("본 적 없는 문제를 먼저 낸다", () => {
    const pool = candidatesFor("quiz");
    // 하나만 빼고 전부 "본 것" 으로 표시하면 그 하나가 반드시 뽑혀야 한다
    const unseen = pool[7];
    const seen: SeenMap = {};
    for (const c of pool) if (c.qid !== unseen.qid) seen[c.qid] = Date.now();
    for (let i = 0; i < 50; i++) {
      const picked = selectCandidates(pool, 3, seen);
      expect(picked.map((c) => c.qid)).toContain(unseen.qid);
    }
  });

  it("전부 본 상태면 가장 오래 전에 본 것부터 낸다", () => {
    const pool = candidatesFor("word");
    const seen: SeenMap = {};
    pool.forEach((c, i) => { seen[c.qid] = 1_000_000 + i; }); // 앞쪽이 더 오래됨
    const picked = selectCandidates(pool, 3, seen);
    expect(picked.map((c) => c.qid)).toEqual(pool.slice(0, 3).map((c) => c.qid));
  });

  it("요청한 수만큼 낸다 (은행이 충분할 때)", () => {
    expect(buildRounds("quiz", HARD_QUIZ)).toHaveLength(HARD_QUIZ);
    expect(buildRounds("word", DIFF.hard.n.word)).toHaveLength(DIFF.hard.n.word);
  });
});
