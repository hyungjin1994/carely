/**
 * 인지 추이 — 자녀에게만 보여주는 게임 기록의 변화.
 *
 * ── 왜 정답률이 아니라 레벨을 보는가 ──
 * 레벨 게임 4종은 계단식 조정으로 성공률을 60~85% 구간에 **붙잡아 둔다**
 * (lib/games/levels.ts). 즉 실력이 늘든 줄든 정답률은 그대로 유지되고, 대신
 * 레벨이 움직인다. 그래서 레벨 게임은 레벨을, 상식 퀴즈·단어 맞추기는(레벨 축이
 * 없다) 정답률을 본다. 이걸 뒤집으면 신호가 전부 사라진다.
 *
 * ── 왜 4주인가 ──
 * 하루 컨디션·수면·기분에 따라 한 판 결과가 크게 흔들린다. 계단식 조정은 한 판에
 * ±1 이므로 며칠치로는 노이즈와 구분이 안 된다. 최근 4주 평균 대비 그 앞 4주
 * 평균으로만 판단한다.
 *
 * ── 어머니에게 보여주지 않는다 ──
 * 자기 인지 기능이 떨어지는 그래프는 해롭다. 이 모듈을 쓰는 화면은 /connect
 * 아래에만 둔다. 문구도 "인지 기능 저하" 가 아니라 "요즘 이 게임을 어려워하세요"
 * 로 쓴다 — 자녀가 읽고 하는 일은 같고, 진단이 아니기 때문이다.
 */

import { kstWeekStart } from "@/lib/time";
import { GAMES } from "@/lib/games/config";
import { MAX_LEVEL, isLeveled } from "@/lib/games/levels";

/** 비교 창 하나의 길이(주). 최근 4주 vs 그 앞 4주. */
export const TREND_WINDOW_WEEKS = 4;

/** 화면에 그리는 기간(주). 창 두 개(8주)보다 넉넉히 둬서 흐름이 보이게 한다. */
export const HISTORY_WEEKS = 12;

/**
 * 창 하나에 최소 이만큼은 있어야 판단한다(주 2판 × 4주).
 * 이보다 적으면 평균이 한두 판에 끌려다녀 아무 말도 할 수 없다.
 */
export const MIN_PLAYS_PER_WINDOW = 8;

/**
 * 레벨 평균이 이만큼 움직이면 신호로 본다.
 * 계단식 조정이 한 판에 ±1 이므로 1.0 은 한 판 차이로도 난다.
 * 4주 평균이 1.5 레벨 움직이는 것은 한 판 노이즈로는 안 나온다.
 */
export const LEVEL_DELTA = 1.5;

/** 정답률(레벨 없는 게임)은 10%p 움직이면 신호로 본다. */
export const RATE_DELTA = 0.1;

/** game_scores 한 행. difficulty 에 레벨 게임은 숫자 문자열, 나머지는 easy|normal|hard. */
export type PlayRow = {
  gameId: string;
  difficulty: string;
  correct: number;
  total: number;
  createdAt: string;
};

export type WeekPoint = {
  /** KST 월요일 (YYYY-MM-DD) */
  weekStart: string;
  plays: number;
  /** 레벨 게임은 평균 레벨, 나머지는 평균 정답률(0~1). 판이 없으면 null. */
  value: number | null;
};

export type Verdict =
  /** 판수가 모자라 판단하지 않음 */
  | "not-enough"
  /** 올라가고 있음 */
  | "up"
  /** 비슷함 */
  | "flat"
  /** 내려가고 있음 — 자녀가 눈여겨볼 것 */
  | "down"
  /** 최고 레벨에 붙어 있음. 더 오를 칸이 없어 "비슷함"이 신호가 아니다 */
  | "ceiling";

export type GameTrend = {
  gameId: string;
  gameName: string;
  color: string;
  /** true 면 값이 레벨(1~MAX_LEVEL), false 면 정답률(0~1) */
  leveled: boolean;
  /** 오래된 주 → 최근 주. 판이 없는 주도 자리를 채운다(끊긴 게 보여야 한다). */
  weeks: WeekPoint[];
  recent: number | null;
  previous: number | null;
  plays: { recent: number; previous: number };
  verdict: Verdict;
  /** 자녀에게 보여줄 한 줄. */
  note: string;
};

/** 최근 n주의 월요일 목록 (오래된 것 → 최근). */
export function lastWeekStarts(n: number, now: Date = new Date()): string[] {
  const thisWeek = kstWeekStart(now);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(`${thisWeek}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7 * i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** 레벨 게임의 difficulty 는 레벨 숫자 문자열. 범위를 벗어나면 버린다. */
function levelOf(row: PlayRow): number | null {
  const n = Number(row.difficulty);
  if (!Number.isFinite(n) || n < 1 || n > MAX_LEVEL) return null;
  return n;
}

function rateOf(row: PlayRow): number | null {
  if (row.total <= 0) return null;
  return row.correct / row.total;
}

/** 판 단위로 평균을 낸다. 주 평균의 평균을 쓰면 한 판만 한 주가 과하게 세진다. */
function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function noteFor(t: {
  gameName: string;
  leveled: boolean;
  verdict: Verdict;
  recent: number | null;
  previous: number | null;
}): string {
  const fmtLv = (v: number) => `${v.toFixed(1)}단계`;
  const fmtRate = (v: number) => `${Math.round(v * 100)}%`;
  const f = t.leveled ? fmtLv : fmtRate;

  switch (t.verdict) {
    case "not-enough":
      return "판수가 적어서 아직 판단하지 않아요";
    case "ceiling":
      return `가장 높은 단계에 계세요. 더 올라갈 칸이 없어서 그대로인 게 정상이에요`;
    case "up":
      return t.recent !== null && t.previous !== null
        ? `${f(t.previous)} → ${f(t.recent)} 로 늘고 있어요`
        : "늘고 있어요";
    case "down":
      // "인지 기능 저하" 라고 쓰지 않는다. 자녀가 할 일은 같고, 진단이 아니다.
      return t.recent !== null && t.previous !== null
        ? `${f(t.previous)} → ${f(t.recent)}. 요즘 이 게임을 어려워하세요`
        : "요즘 이 게임을 어려워하세요";
    case "flat":
      return "지난달과 비슷해요";
  }
}

/**
 * 게임별 추이. 판이 하나도 없는 게임은 빼지 않고 not-enough 로 남긴다 —
 * "안 하시는 게임" 도 자녀가 알아야 하는 정보다.
 */
export function buildTrend(rows: PlayRow[], now: Date = new Date()): GameTrend[] {
  const weeks = lastWeekStarts(HISTORY_WEEKS, now);
  const weekIndex = new Map(weeks.map((w, i) => [w, i]));
  // 최근 TREND_WINDOW_WEEKS 개가 "최근 창", 그 앞 TREND_WINDOW_WEEKS 개가 "앞 창".
  const recentFrom = HISTORY_WEEKS - TREND_WINDOW_WEEKS;
  const prevFrom = recentFrom - TREND_WINDOW_WEEKS;

  return GAMES.map((game) => {
    const leveled = isLeveled(game.id);
    const valueOf = leveled ? levelOf : rateOf;

    const perWeek: number[][] = weeks.map(() => []);
    for (const row of rows) {
      if (row.gameId !== game.id) continue;
      const i = weekIndex.get(kstWeekStart(new Date(row.createdAt)));
      if (i === undefined) continue; // 기간 밖
      const v = valueOf(row);
      if (v !== null) perWeek[i].push(v);
    }

    const weekPoints: WeekPoint[] = weeks.map((weekStart, i) => ({
      weekStart,
      plays: perWeek[i].length,
      value: mean(perWeek[i]),
    }));

    const recentPlays = perWeek.slice(recentFrom).flat();
    const prevPlays = perWeek.slice(prevFrom, recentFrom).flat();
    const recent = mean(recentPlays);
    const previous = mean(prevPlays);

    let verdict: Verdict;
    if (
      recent === null ||
      previous === null ||
      recentPlays.length < MIN_PLAYS_PER_WINDOW ||
      prevPlays.length < MIN_PLAYS_PER_WINDOW
    ) {
      verdict = "not-enough";
    } else if (leveled && recent >= MAX_LEVEL - 0.5) {
      // 천장에 붙어 있으면 "비슷함" 이 정보가 아니다. 내려간 것만 신호로 본다.
      verdict = previous - recent >= LEVEL_DELTA ? "down" : "ceiling";
    } else {
      const delta = recent - previous;
      const threshold = leveled ? LEVEL_DELTA : RATE_DELTA;
      if (delta >= threshold) verdict = "up";
      else if (delta <= -threshold) verdict = "down";
      else verdict = "flat";
    }

    return {
      gameId: game.id,
      gameName: game.name,
      color: game.color,
      leveled,
      weeks: weekPoints,
      recent,
      previous,
      plays: { recent: recentPlays.length, previous: prevPlays.length },
      verdict,
      note: noteFor({ gameName: game.name, leveled, verdict, recent, previous }),
    };
  });
}

/**
 * 전체 한 줄 요약.
 *
 * **한 게임만 내려간 것은 신호로 취급하지 않는다.** 게임마다 좋아하고 싫어하는
 * 정도가 다르고, 한 종목만 흔들리는 것은 흥미·지루함으로도 충분히 설명된다.
 * 두 종목 이상이 같이 내려갈 때만 "같이 보셔야 한다" 고 말한다.
 */
export function trendSummary(trends: GameTrend[]): { tone: "ok" | "watch" | "none"; text: string } {
  const judged = trends.filter((t) => t.verdict !== "not-enough");
  if (judged.length === 0) {
    return {
      tone: "none",
      text: `아직 판단할 만큼 쌓이지 않았어요. 한 게임을 ${TREND_WINDOW_WEEKS * 2}주 동안 꾸준히 하시면 여기에 변화가 보입니다.`,
    };
  }

  const down = judged.filter((t) => t.verdict === "down");
  const up = judged.filter((t) => t.verdict === "up");

  if (down.length >= 2) {
    return {
      tone: "watch",
      text: `${down.map((t) => t.gameName).join(" · ")} 가 함께 내려갔어요. 여러 종목이 같이 움직이면 한 번 여쭤보실 만합니다. 몸이 안 좋거나 잠을 못 자셔도 이렇게 나옵니다.`,
    };
  }
  if (down.length === 1) {
    return {
      tone: "ok",
      text: `${down[0].gameName} 만 내려갔어요. 한 종목만 흔들리는 건 그 게임이 재미없어지신 것으로도 설명됩니다. 다음 달에 한 번 더 보세요.`,
    };
  }
  if (up.length > 0) {
    return { tone: "ok", text: `${up.map((t) => t.gameName).join(" · ")} 가 늘고 있어요.` };
  }
  return { tone: "ok", text: "지난달과 비슷하게 유지되고 있어요." };
}

