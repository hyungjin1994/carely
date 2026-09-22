import { describe, expect, it } from "vitest";
import {
  HISTORY_WEEKS,
  LEVEL_DELTA,
  MIN_PLAYS_PER_WINDOW,
  RATE_DELTA,
  TREND_WINDOW_WEEKS,
  buildTrend,
  lastWeekStarts,
  trendSummary,
  type PlayRow,
} from "@/lib/trend/cognitive";
import { MAX_LEVEL } from "@/lib/games/levels";

/** 기준 시각을 고정한다 — 주 경계가 걸리면 테스트가 요일에 따라 흔들린다. */
const NOW = new Date("2026-09-22T03:00:00Z"); // KST 2026-09-22(화) 12:00

const WEEKS = lastWeekStarts(HISTORY_WEEKS, NOW);
/** 최근 창 / 앞 창의 시작 인덱스. */
const RECENT_FROM = HISTORY_WEEKS - TREND_WINDOW_WEEKS;
const PREV_FROM = RECENT_FROM - TREND_WINDOW_WEEKS;

/** 주(월요일) 안쪽 시각. 경계에 딱 걸리지 않게 수요일 정오로 둔다. */
function inWeek(weekStart: string): string {
  return new Date(`${weekStart}T12:00:00+09:00`).toISOString();
}

function plays(
  gameId: string,
  weekIdx: number,
  n: number,
  opts: { level?: number; correct?: number; total?: number },
): PlayRow[] {
  return Array.from({ length: n }, () => ({
    gameId,
    difficulty: opts.level !== undefined ? String(opts.level) : "normal",
    correct: opts.correct ?? 0,
    total: opts.total ?? 0,
    createdAt: inWeek(WEEKS[weekIdx]),
  }));
}

/** 창 하나를 같은 값으로 채운다 (창당 최소 판수를 넘기도록). */
function fillWindow(
  gameId: string,
  from: number,
  opts: { level?: number; correct?: number; total?: number },
): PlayRow[] {
  const perWeek = Math.ceil(MIN_PLAYS_PER_WINDOW / TREND_WINDOW_WEEKS);
  return Array.from({ length: TREND_WINDOW_WEEKS }, (_, i) =>
    plays(gameId, from + i, perWeek, opts),
  ).flat();
}

const find = (rows: PlayRow[], gameId: string) =>
  buildTrend(rows, NOW).find((t) => t.gameId === gameId)!;

describe("lastWeekStarts", () => {
  it("오래된 주 → 최근 주 순서다", () => {
    expect(WEEKS).toHaveLength(HISTORY_WEEKS);
    for (let i = 1; i < WEEKS.length; i++) expect(WEEKS[i - 1] < WEEKS[i]).toBe(true);
  });

  it("전부 월요일이고 7일 간격이다", () => {
    for (const w of WEEKS) {
      expect(new Date(`${w}T00:00:00Z`).getUTCDay()).toBe(1);
    }
    const a = new Date(`${WEEKS[0]}T00:00:00Z`).getTime();
    const b = new Date(`${WEEKS[1]}T00:00:00Z`).getTime();
    expect(b - a).toBe(7 * 86_400_000);
  });
});

describe("buildTrend — 판수가 모자랄 때", () => {
  it("기록이 없으면 전부 not-enough", () => {
    for (const t of buildTrend([], NOW)) {
      expect(t.verdict, t.gameId).toBe("not-enough");
      expect(t.recent).toBeNull();
    }
  });

  it("안 하는 게임도 목록에서 빼지 않는다 — 자녀가 알아야 하는 정보다", () => {
    const trends = buildTrend(fillWindow("mem", RECENT_FROM, { level: 5 }), NOW);
    expect(trends.map((t) => t.gameId)).toContain("quiz");
    expect(trends.length).toBeGreaterThan(1);
  });

  it("최소 판수 - 1 이면 판단하지 않는다", () => {
    const perWindow = MIN_PLAYS_PER_WINDOW - 1;
    const rows = [
      ...plays("mem", PREV_FROM, perWindow, { level: 10 }),
      ...plays("mem", RECENT_FROM, perWindow, { level: 3 }),
    ];
    expect(find(rows, "mem").verdict).toBe("not-enough");
  });

  it("한쪽 창만 채워져도 판단하지 않는다", () => {
    const rows = fillWindow("mem", RECENT_FROM, { level: 10 });
    expect(find(rows, "mem").verdict).toBe("not-enough");
  });
});

describe("buildTrend — 레벨 게임은 레벨을 본다", () => {
  it("레벨이 충분히 내려가면 down", () => {
    const rows = [
      ...fillWindow("mem", PREV_FROM, { level: 12 }),
      ...fillWindow("mem", RECENT_FROM, { level: 12 - LEVEL_DELTA }),
    ];
    const t = find(rows, "mem");
    expect(t.leveled).toBe(true);
    expect(t.verdict).toBe("down");
    // "인지 기능 저하" 라고 쓰지 않는다 — 자녀가 할 일은 같고 진단이 아니다.
    expect(t.note).not.toContain("저하");
    expect(t.note).toContain("어려워");
  });

  it("레벨이 충분히 올라가면 up", () => {
    const rows = [
      ...fillWindow("math", PREV_FROM, { level: 5 }),
      ...fillWindow("math", RECENT_FROM, { level: 5 + LEVEL_DELTA }),
    ];
    expect(find(rows, "math").verdict).toBe("up");
  });

  it("문턱 아래로 움직이면 flat", () => {
    const rows = [
      ...fillWindow("seq", PREV_FROM, { level: 8 }),
      ...fillWindow("seq", RECENT_FROM, { level: 8 - (LEVEL_DELTA - 0.5) }),
    ];
    expect(find(rows, "seq").verdict).toBe("flat");
  });

  it("정답률이 떨어져도 레벨이 그대로면 flat — 계단식 조정이 정답률을 붙잡는다", () => {
    const rows = [
      ...fillWindow("stroop", PREV_FROM, { level: 9, correct: 9, total: 10 }),
      ...fillWindow("stroop", RECENT_FROM, { level: 9, correct: 4, total: 10 }),
    ];
    expect(find(rows, "stroop").verdict).toBe("flat");
  });

  it("최고 레벨에 붙어 있으면 ceiling — 더 오를 칸이 없다", () => {
    const rows = [
      ...fillWindow("mem", PREV_FROM, { level: MAX_LEVEL }),
      ...fillWindow("mem", RECENT_FROM, { level: MAX_LEVEL }),
    ];
    const t = find(rows, "mem");
    expect(t.verdict).toBe("ceiling");
    expect(t.note).toContain("정상");
  });

  it("최고 레벨에서도 내려가면 down 이다", () => {
    const rows = [
      ...fillWindow("mem", PREV_FROM, { level: MAX_LEVEL }),
      ...fillWindow("mem", RECENT_FROM, { level: MAX_LEVEL - LEVEL_DELTA }),
    ];
    expect(find(rows, "mem").verdict).toBe("down");
  });

  it("범위를 벗어난 difficulty 는 버린다", () => {
    const rows = [
      ...fillWindow("mem", PREV_FROM, { level: 10 }),
      ...fillWindow("mem", RECENT_FROM, { level: 999 }),
    ];
    // 최근 창이 전부 버려져 판단 불가가 되어야 한다 — 0 으로 세면 급락으로 보인다.
    expect(find(rows, "mem").verdict).toBe("not-enough");
  });
});

describe("buildTrend — 레벨 없는 게임은 정답률을 본다", () => {
  it("정답률이 떨어지면 down", () => {
    const rows = [
      ...fillWindow("quiz", PREV_FROM, { correct: 8, total: 10 }),
      ...fillWindow("quiz", RECENT_FROM, { correct: 8 - RATE_DELTA * 10 - 1, total: 10 }),
    ];
    const t = find(rows, "quiz");
    expect(t.leveled).toBe(false);
    expect(t.verdict).toBe("down");
  });

  it("total 이 0 인 판은 버린다 — 0 으로 나누지 않는다", () => {
    const rows = [
      ...fillWindow("word", PREV_FROM, { correct: 0, total: 0 }),
      ...fillWindow("word", RECENT_FROM, { correct: 0, total: 0 }),
    ];
    const t = find(rows, "word");
    expect(t.verdict).toBe("not-enough");
    expect(t.recent).toBeNull();
  });
});

describe("buildTrend — 주별 자리", () => {
  it("판이 없는 주도 자리를 채운다 — 끊긴 게 보여야 한다", () => {
    const t = find(fillWindow("mem", RECENT_FROM, { level: 5 }), "mem");
    expect(t.weeks).toHaveLength(HISTORY_WEEKS);
    expect(t.weeks[0].plays).toBe(0);
    expect(t.weeks[0].value).toBeNull();
    expect(t.weeks[HISTORY_WEEKS - 1].plays).toBeGreaterThan(0);
  });

  it("기간 밖 기록은 세지 않는다", () => {
    const old = new Date(`${WEEKS[0]}T12:00:00+09:00`);
    old.setUTCDate(old.getUTCDate() - 14);
    const rows: PlayRow[] = [
      { gameId: "mem", difficulty: "20", correct: 5, total: 6, createdAt: old.toISOString() },
    ];
    const t = find(rows, "mem");
    expect(t.weeks.reduce((a, w) => a + w.plays, 0)).toBe(0);
  });
});

describe("trendSummary", () => {
  it("판단할 게 없으면 none", () => {
    expect(trendSummary(buildTrend([], NOW)).tone).toBe("none");
  });

  it("한 종목만 내려가면 경고하지 않는다 — 흥미가 떨어진 것으로도 설명된다", () => {
    const rows = [
      ...fillWindow("mem", PREV_FROM, { level: 12 }),
      ...fillWindow("mem", RECENT_FROM, { level: 12 - LEVEL_DELTA }),
    ];
    const s = trendSummary(buildTrend(rows, NOW));
    expect(s.tone).toBe("ok");
    expect(s.text).toContain("카드 짝맞추기");
  });

  it("두 종목이 함께 내려가면 watch", () => {
    const rows = [
      ...fillWindow("mem", PREV_FROM, { level: 12 }),
      ...fillWindow("mem", RECENT_FROM, { level: 12 - LEVEL_DELTA }),
      ...fillWindow("seq", PREV_FROM, { level: 9 }),
      ...fillWindow("seq", RECENT_FROM, { level: 9 - LEVEL_DELTA }),
    ];
    const s = trendSummary(buildTrend(rows, NOW));
    expect(s.tone).toBe("watch");
    // 다른 이유도 있을 수 있다는 걸 같이 말해야 한다.
    expect(s.text).toMatch(/잠|몸/);
  });

  it("올라가는 게 있으면 그걸 말한다", () => {
    const rows = [
      ...fillWindow("math", PREV_FROM, { level: 5 }),
      ...fillWindow("math", RECENT_FROM, { level: 5 + LEVEL_DELTA }),
    ];
    const s = trendSummary(buildTrend(rows, NOW));
    expect(s.tone).toBe("ok");
    expect(s.text).toContain("숫자 계산");
  });
});
