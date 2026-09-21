import { describe, expect, it } from "vitest";
import { mathRound, memDeck, seqPattern, shuffle, stroopRound } from "@/lib/games/engine";
import { MAX_LEVEL, memParams, seqParams, stroopParams } from "@/lib/games/levels";

const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);
const N = 300; // 레벨당 반복

describe("shuffle", () => {
  it("원본을 바꾸지 않고 같은 원소를 돌려준다", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("mathRound", () => {
  it("보기 4개·중복 없음·음수 없음·정답 포함", () => {
    for (const lv of LEVELS) {
      for (let i = 0; i < N; i++) {
        const r = mathRound(lv);
        expect(r.opts).toHaveLength(4);
        expect(new Set(r.opts).size).toBe(4);
        expect(Math.min(...r.opts)).toBeGreaterThanOrEqual(0);
        expect(r.opts[r.correct]).toBe(r.ans);
      }
    }
  });

  it("답이 음수가 되지 않는다 (뺄셈에서 큰 수를 앞으로)", () => {
    for (const lv of LEVELS) {
      for (let i = 0; i < N; i++) {
        const r = mathRound(lv);
        expect(r.ans).toBeGreaterThanOrEqual(0);
        expect(r.ans).toBe(r.plus ? r.a + r.b : r.a - r.b);
      }
    }
  });

  it("높은 레벨에서 보기가 바짝 붙지 않는다", () => {
    // 전에는 오답이 늘 ±3 이내라 73/74/76/71 처럼 나왔다.
    // 계산 문제가 아니라 비슷한 숫자를 가려내는 읽기 과제가 된다.
    let adjacent = 0;
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      const s = [...mathRound(MAX_LEVEL).opts].sort((x, y) => x - y);
      for (let k = 1; k < 4; k++) if (s[k] - s[k - 1] <= 1) { adjacent++; break; }
    }
    expect(adjacent / trials).toBeLessThan(0.05);
  });
});

describe("stroopRound", () => {
  it("정답(잉크색)이 항상 보기에 있다", () => {
    for (const lv of LEVELS) {
      for (let i = 0; i < N; i++) {
        const r = stroopRound(lv);
        expect(r.opts.some((c) => c.hex === r.ink.hex)).toBe(true);
      }
    }
  });

  it("유혹(글자가 지칭하는 색)이 항상 보기에 있다", () => {
    // 유혹이 빠지면 간섭이 생기지 않아 스트룹이 아니게 된다.
    for (const lv of LEVELS) {
      for (let i = 0; i < N; i++) {
        const r = stroopRound(lv);
        if (r.congruent) continue; // 일치 시행은 정답 = 유혹
        expect(r.opts.some((c) => c.name === r.word)).toBe(true);
      }
    }
  });

  it("보기 개수가 설정과 같고 중복이 없다", () => {
    for (const lv of LEVELS) {
      const want = stroopParams(lv).optionCount;
      for (let i = 0; i < 50; i++) {
        const r = stroopRound(lv);
        expect(r.opts).toHaveLength(want);
        expect(new Set(r.opts.map((c) => c.hex)).size).toBe(want);
      }
    }
  });

  it("최고 레벨에는 일치 시행(공짜 정답)이 없다", () => {
    for (let i = 0; i < 1000; i++) {
      expect(stroopRound(MAX_LEVEL).congruent).toBe(false);
    }
  });
});

describe("seqPattern", () => {
  it("같은 칸이 연달아 나오지 않는다", () => {
    // 점등이 560ms 켜지고 240ms 꺼지므로, 연속이면 한 번으로 보일 수 있다.
    // 그러면 순서를 외우는 문제가 아니라 몇 번 켜졌는지 세는 문제가 된다.
    for (const lv of LEVELS) {
      const len = seqParams(lv).startLen;
      for (let i = 0; i < N; i++) {
        const p = seqPattern(len);
        expect(p).toHaveLength(len);
        for (let k = 1; k < p.length; k++) expect(p[k]).not.toBe(p[k - 1]);
        for (const v of p) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThan(4);
      }
    }
  });
});

describe("memDeck", () => {
  it("쌍마다 카드 2장, 아이콘이 정확히 두 번씩", () => {
    for (const lv of LEVELS) {
      const pairs = memParams(lv).pairs;
      const deck = memDeck(pairs);
      expect(deck).toHaveLength(pairs * 2);
      const count = new Map<string, number>();
      for (const c of deck) count.set(c.icon, (count.get(c.icon) ?? 0) + 1);
      expect(count.size).toBe(pairs);
      for (const n of count.values()) expect(n).toBe(2);
    }
  });

  it("아이콘 조합이 매 판 달라진다", () => {
    // slice(0, pairs) 만 하면 늘 같은 앞쪽 아이콘이 나와 미리보기가 무의미해진다.
    const combos = new Set<string>();
    for (let i = 0; i < 200; i++) {
      combos.add([...new Set(memDeck(6).map((c) => c.icon))].sort().join(","));
    }
    expect(combos.size).toBeGreaterThan(10);
  });
});
