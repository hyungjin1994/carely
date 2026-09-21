import { describe, expect, it } from "vitest";
import { HABIT_CATEGORIES, habitCount, todayHabit } from "@/lib/habits";

const day = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 86_400_000);

describe("행동 데이터", () => {
  it("id 가 유일하다", () => {
    // id 는 daily_habits.habit_id 로 남으므로 겹치면 기록이 섞인다
    const ids = HABIT_CATEGORIES.flatMap((c) => c.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("문구가 비어 있지 않다", () => {
    for (const c of HABIT_CATEGORIES) {
      expect(c.items.length).toBeGreaterThan(0);
      for (const i of c.items) expect(i.title.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("todayHabit", () => {
  it("같은 KST 날이면 몇 번을 물어도 같다", () => {
    // 새로고침할 때마다 바뀌면 "오늘의" 가 아니게 된다.
    // 주의: UTC 15:00 부터는 이미 KST 다음날이다 (KST = UTC+9).
    const a = todayHabit(new Date("2026-03-04T01:00:00Z")); // KST 03-04 10:00
    const b = todayHabit(new Date("2026-03-04T14:00:00Z")); // KST 03-04 23:00
    expect(a.habit.id).toBe(b.habit.id);
  });

  it("KST 자정을 넘으면 바뀐다", () => {
    const before = todayHabit(new Date("2026-03-04T14:59:00Z")); // KST 03-04 23:59
    const after = todayHabit(new Date("2026-03-04T15:01:00Z")); // KST 03-05 00:01
    expect(after.habit.id).not.toBe(before.habit.id);
  });

  it("이틀 연속 같은 카테고리가 나오지 않는다", () => {
    for (let d = 1; d < 400; d++) {
      expect(todayHabit(day(d)).category.key).not.toBe(todayHabit(day(d - 1)).category.key);
    }
  });

  it("30일 안에 30개가 전부 다르다", () => {
    const seen = new Set<string>();
    for (let d = 0; d < 30; d++) seen.add(todayHabit(day(d)).habit.id);
    expect(seen.size).toBe(30);
  });

  it("모든 행동이 언젠가 나온다", () => {
    const seen = new Set<string>();
    for (let d = 0; d < 400; d++) seen.add(todayHabit(day(d)).habit.id);
    expect(seen.size).toBe(habitCount());
  });
});
