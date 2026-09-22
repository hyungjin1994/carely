import { describe, expect, it } from "vitest";
import { formatKstIsoDate, kstPrevWeekStart, kstWeekStart } from "@/lib/time";

// KST = UTC+9. UTC 15:00 부터는 이미 KST 다음날이다.
// 주간 리포트의 주차 키가 여기서 나오므로 경계를 정확히 고정한다.
describe("kstWeekStart", () => {
  it("월요일이면 그 날이 주 시작", () => {
    // 2026-09-21 은 월요일
    expect(kstWeekStart(new Date("2026-09-21T03:00:00Z"))).toBe("2026-09-21");
  });

  it("일요일은 그 주(직전 월요일)에 속한다", () => {
    // 2026-09-27 은 일요일 → 주 시작은 09-21
    expect(kstWeekStart(new Date("2026-09-27T03:00:00Z"))).toBe("2026-09-21");
  });

  it("주 중간 아무 날이나 같은 월요일을 가리킨다", () => {
    const days = ["22", "23", "24", "25", "26", "27"];
    for (const d of days) {
      expect(kstWeekStart(new Date(`2026-09-${d}T05:00:00Z`))).toBe("2026-09-21");
    }
  });

  it("KST 자정을 넘으면 날짜가 넘어간다", () => {
    // UTC 일 14:59 = KST 일 23:59 → 아직 그 주
    expect(kstWeekStart(new Date("2026-09-27T14:59:00Z"))).toBe("2026-09-21");
    // UTC 일 15:01 = KST 월 00:01 → 새 주
    expect(kstWeekStart(new Date("2026-09-27T15:01:00Z"))).toBe("2026-09-28");
  });

  it("월을 넘어가도 맞다", () => {
    // 2026-10-01 은 목요일 → 주 시작 09-28
    expect(kstWeekStart(new Date("2026-10-01T03:00:00Z"))).toBe("2026-09-28");
  });

  it("항상 월요일을 돌려준다", () => {
    for (let i = 0; i < 400; i++) {
      const d = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000);
      const start = kstWeekStart(d);
      expect(new Date(`${start}T00:00:00Z`).getUTCDay()).toBe(1);
    }
  });
});

describe("kstPrevWeekStart", () => {
  it("정확히 7일 앞", () => {
    expect(kstPrevWeekStart(new Date("2026-09-24T03:00:00Z"))).toBe("2026-09-14");
  });

  it("항상 kstWeekStart 보다 7일 이르다", () => {
    for (let i = 0; i < 200; i++) {
      const d = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000);
      const a = new Date(`${kstWeekStart(d)}T00:00:00Z`).getTime();
      const b = new Date(`${kstPrevWeekStart(d)}T00:00:00Z`).getTime();
      expect(a - b).toBe(7 * 86_400_000);
    }
  });
});

describe("formatKstIsoDate", () => {
  it("UTC 15:00 부터 KST 다음날", () => {
    expect(formatKstIsoDate(new Date("2026-09-21T14:59:00Z"))).toBe("2026-09-21");
    expect(formatKstIsoDate(new Date("2026-09-21T15:00:00Z"))).toBe("2026-09-22");
  });
});
