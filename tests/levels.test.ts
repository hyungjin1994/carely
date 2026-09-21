import { describe, expect, it } from "vitest";
import {
  MAX_LEVEL,
  LEVELED_GAMES,
  clampLevel,
  isLeveled,
  levelMult,
  levelRounds,
  levelScore,
  memParams,
  mathParams,
  nextLevel,
  seqParams,
  stroopParams,
} from "@/lib/games/levels";
import { PER_GAME_DAILY_CAP } from "@/lib/games/config";

// 레벨 곡선은 손으로 고른 숫자라 회귀가 나기 쉽다.
// 값 자체가 아니라 "지켜야 할 성질" 을 고정한다.
const LEVELS = Array.from({ length: MAX_LEVEL + 10 }, (_, i) => i - 4); // -4 ~ MAX+5

describe("clampLevel", () => {
  it("항상 1~MAX_LEVEL 안에 든다", () => {
    for (const lv of LEVELS) {
      const c = clampLevel(lv);
      expect(c).toBeGreaterThanOrEqual(1);
      expect(c).toBeLessThanOrEqual(MAX_LEVEL);
    }
  });

  it("유한한 수가 아니면 1로 떨어진다", () => {
    // DB 값이 깨졌을 때 게임이 터지는 대신 가장 쉬운 단계로 시작하게 한다
    expect(clampLevel(NaN)).toBe(1);
    expect(clampLevel(Infinity)).toBe(1);
    expect(clampLevel(-Infinity)).toBe(1);
  });
});

describe("levelMult", () => {
  it("1.0 에서 시작해 4.0 에서 끝난다", () => {
    expect(levelMult(1)).toBe(1);
    expect(levelMult(MAX_LEVEL)).toBe(4);
  });

  it("레벨이 오르면 줄지 않는다", () => {
    for (let lv = 2; lv <= MAX_LEVEL; lv++) {
      expect(levelMult(lv)).toBeGreaterThanOrEqual(levelMult(lv - 1));
    }
  });
});

describe("levelScore", () => {
  it("만점이어도 게임당 하루 상한을 넘지 않는다", () => {
    // 넘으면 한 판만으로 상한에 잘려 레벨을 올릴 이유가 사라진다
    for (const lv of LEVELS) {
      expect(levelScore(1, 1, lv)).toBeLessThanOrEqual(PER_GAME_DAILY_CAP);
    }
  });

  it("0점이면 0, 비율에 비례한다", () => {
    expect(levelScore(0, 10, 5)).toBe(0);
    expect(levelScore(5, 10, 5)).toBeLessThan(levelScore(10, 10, 5));
  });

  it("total 이 0 이어도 터지지 않는다", () => {
    expect(levelScore(3, 0, 5)).toBe(0);
  });
});

describe("nextLevel", () => {
  it("85% 이상이면 올라간다", () => {
    expect(nextLevel(10, 17, 20)).toBe(11);
  });

  it("60% 미만이면 내려간다", () => {
    expect(nextLevel(10, 11, 20)).toBe(9);
  });

  it("그 사이면 유지한다", () => {
    expect(nextLevel(10, 14, 20)).toBe(10);
  });

  it("1 아래·MAX 위로는 안 간다", () => {
    expect(nextLevel(1, 0, 10)).toBe(1);
    expect(nextLevel(MAX_LEVEL, 10, 10)).toBe(MAX_LEVEL);
  });
});

describe("게임별 파라미터", () => {
  it("짝맞추기: 쌍은 12를 넘지 않고, 제한은 쌍보다 크다", () => {
    for (const lv of LEVELS) {
      const p = memParams(lv);
      // 12쌍(4×6=24장)이 한 화면에 들어오는 한계
      expect(p.pairs).toBeGreaterThanOrEqual(2);
      expect(p.pairs).toBeLessThanOrEqual(12);
      // 제한이 쌍 수보다 작으면 이론상 완주가 불가능해진다
      expect(p.moveLimit).toBeGreaterThan(p.pairs);
      expect(p.previewMs).toBeGreaterThan(0);
    }
  });

  it("짝맞추기: 레벨이 오르면 쉬워지지 않는다", () => {
    for (let lv = 2; lv <= MAX_LEVEL; lv++) {
      const a = memParams(lv - 1);
      const b = memParams(lv);
      expect(b.pairs).toBeGreaterThanOrEqual(a.pairs);
      // 쌍당 미리보기 시간은 단조 감소해야 한다
      expect(b.previewMs / b.pairs).toBeLessThanOrEqual(a.previewMs / a.pairs + 1e-9);
    }
  });

  it("색깔: 보기는 3~5개, 일치 비율은 0~1", () => {
    for (const lv of LEVELS) {
      const p = stroopParams(lv);
      expect(p.optionCount).toBeGreaterThanOrEqual(3);
      expect(p.optionCount).toBeLessThanOrEqual(5);
      expect(p.congruentRatio).toBeGreaterThanOrEqual(0);
      expect(p.congruentRatio).toBeLessThanOrEqual(1);
      expect(p.rounds).toBeGreaterThan(0);
      expect(p.limitMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("색깔: 초반은 제한 시간이 없다 (연습 구간)", () => {
    expect(stroopParams(1).limitMs).toBe(0);
    expect(stroopParams(MAX_LEVEL).limitMs).toBeGreaterThan(0);
  });

  it("계산: 숫자 범위가 단조 증가한다", () => {
    for (let lv = 2; lv <= MAX_LEVEL; lv++) {
      expect(mathParams(lv).maxOperand).toBeGreaterThan(mathParams(lv - 1).maxOperand);
    }
  });

  it("순서 기억: 시작 길이가 2 이상", () => {
    for (const lv of LEVELS) {
      expect(seqParams(lv).startLen).toBeGreaterThanOrEqual(2);
      expect(seqParams(lv).rounds).toBeGreaterThan(0);
    }
  });
});

describe("levelRounds", () => {
  it("모든 레벨 게임에서 양수", () => {
    for (const id of LEVELED_GAMES) {
      for (const lv of LEVELS) {
        expect(levelRounds(id, lv)).toBeGreaterThan(0);
      }
    }
  });
});

describe("isLeveled", () => {
  it("규칙으로 생성하는 4종만 레벨을 쓴다", () => {
    expect(isLeveled("mem")).toBe(true);
    expect(isLeveled("stroop")).toBe(true);
    expect(isLeveled("math")).toBe(true);
    expect(isLeveled("seq")).toBe(true);
    // 지식 문제는 난이도 축이 없어 레벨을 붙이지 않는다
    expect(isLeveled("quiz")).toBe(false);
    expect(isLeveled("word")).toBe(false);
  });
});
