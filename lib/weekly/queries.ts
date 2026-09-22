import "server-only";

import { createClient } from "@/lib/supabase/server";
import { kstPrevWeekStart, kstWeekStart } from "@/lib/time";
import { getGame } from "@/lib/games/config";
import { isLeveled } from "@/lib/games/levels";

/**
 * 주간 리포트.
 *
 * 수치를 저장하지 않고 매번 집계한다 — 저장하면 나중에 원본이 바뀔 때 어긋난다.
 * 주 경계는 KST 월요일 00:00 (lib/time.ts kstWeekStart).
 *
 * 어머니용과 자녀용이 같은 데이터에서 나오지만 **보여주는 게 다르다.**
 * 어머니 시트에는 나쁜 소식을 넣지 않는다 — 매주 "약을 놓치셨어요" 를 보면
 * 앱을 피하게 된다. 그런 건 concerns 로 따로 담아 자녀에게만 보여준다.
 */

export type LevelUp = { gameId: string; gameName: string; from: number; to: number };

export type WeeklyReport = {
  weekStart: string;
  /** 게임 판수 (이번 주 / 지난주) */
  games: { plays: number; prevPlays: number };
  /** 오늘의 한 가지 실천 일수 */
  habits: { days: number; prevDays: number };
  /** 복약 — 예정 대비 실제 */
  meds: { taken: number; total: number };
  /** 측정 횟수 */
  measures: number;
  /** 회상 질문에 답한 횟수 */
  answers: number;
  /** 이번 주에 올라간 게임 단계 */
  levelUps: LevelUp[];
  /** 자녀에게만 보여줄 것. 어머니 시트에는 넣지 않는다. */
  concerns: string[];
};

function weekRange(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 7 * 86_400_000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export async function getWeeklyReport(userId: string): Promise<WeeklyReport> {
  const supabase = await createClient();
  const weekStart = kstWeekStart();
  const prevStart = kstPrevWeekStart();
  const cur = weekRange(weekStart);
  const prev = weekRange(prevStart);

  const [scores, prevScores, habits, prevHabits, doses, measures, answers] = await Promise.all([
    supabase
      .from("game_scores")
      .select("game_id, difficulty, created_at")
      .eq("user_id", userId)
      .gte("created_at", cur.startIso)
      .lt("created_at", cur.endIso)
      .order("created_at"),
    supabase
      .from("game_scores")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", prev.startIso)
      .lt("created_at", prev.endIso),
    supabase
      .from("daily_habits")
      .select("date")
      .eq("user_id", userId)
      .gte("date", weekStart),
    supabase
      .from("daily_habits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", prevStart)
      .lt("date", weekStart),
    supabase
      .from("med_doses")
      .select("taken, scheduled_at")
      .eq("user_id", userId)
      .gte("scheduled_at", cur.startIso)
      .lt("scheduled_at", cur.endIso),
    supabase
      .from("measurements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("measured_at", cur.startIso)
      .lt("measured_at", cur.endIso),
    supabase
      .from("family_answers")
      .select("id", { count: "exact", head: true })
      .eq("senior_id", userId)
      .not("text", "is", null)
      .gte("answered_at", cur.startIso)
      .lt("answered_at", cur.endIso),
  ]);

  const rows = scores.data ?? [];

  // 레벨 상승 — game_levels 는 현재 값만 들고 있어 주간 변화를 알 수 없다.
  // 대신 game_scores.difficulty 에 판을 치른 레벨이 숫자 문자열로 남으므로
  // (0017 주석 참고) 이번 주 첫 판과 마지막 판을 비교한다. 스키마 변경이 없다.
  const firstLast = new Map<string, { first: number; last: number }>();
  for (const r of rows) {
    if (!isLeveled(r.game_id as never)) continue;
    const lv = Number(r.difficulty);
    if (!Number.isFinite(lv)) continue;
    const e = firstLast.get(r.game_id);
    if (!e) firstLast.set(r.game_id, { first: lv, last: lv });
    else e.last = lv;
  }
  const levelUps: LevelUp[] = [];
  for (const [gameId, { first, last }] of firstLast) {
    if (last > first) {
      levelUps.push({ gameId, gameName: getGame(gameId as never).name, from: first, to: last });
    }
  }
  levelUps.sort((a, b) => b.to - b.from - (a.to - a.from));

  const doseRows = doses.data ?? [];
  const takenCount = doseRows.filter((d) => d.taken).length;

  const habitDays = new Set((habits.data ?? []).map((h) => h.date)).size;
  const prevHabitDays = prevHabits.count ?? 0;

  // ── 자녀에게만 보여줄 것 ──
  const concerns: string[] = [];
  const missed = doseRows.filter((d) => !d.taken);
  if (missed.length > 0) {
    // 어느 시간대를 자주 놓치는지가 실제로 조치 가능한 정보다.
    const byHour = new Map<number, number>();
    for (const d of missed) {
      const h = (new Date(d.scheduled_at).getUTCHours() + 9) % 24;
      byHour.set(h, (byHour.get(h) ?? 0) + 1);
    }
    const worst = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0];
    const label = worst[0] < 11 ? "아침" : worst[0] < 15 ? "점심" : worst[0] < 21 ? "저녁" : "자기 전";
    concerns.push(`약을 ${missed.length}번 놓치셨어요 (${label} 시간대가 가장 많아요)`);
  }
  if (measures.count === 0) {
    concerns.push("이번 주에는 혈압·혈당을 재지 않으셨어요");
  }
  if (rows.length === 0) {
    concerns.push("이번 주에는 게임을 하지 않으셨어요");
  }
  if (habitDays === 0 && prevHabitDays > 0) {
    concerns.push("오늘의 한 가지를 이번 주에는 안 하셨어요");
  }

  return {
    weekStart,
    games: { plays: rows.length, prevPlays: prevScores.count ?? 0 },
    habits: { days: habitDays, prevDays: prevHabitDays },
    meds: { taken: takenCount, total: doseRows.length },
    measures: measures.count ?? 0,
    answers: answers.count ?? 0,
    levelUps,
    concerns,
  };
}

/** 어머니가 이번 주 시트를 이미 봤는지. */
export async function hasSeenWeekly(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_report_seen")
    .select("week_start")
    .eq("user_id", userId)
    .eq("week_start", kstWeekStart())
    .maybeSingle();
  return !!data;
}

/** 자녀 알림에 담을 요약 문구. 배너가 그대로 보여주므로 줄바꿈으로 정리한다. */
export function weeklyDigest(name: string, r: WeeklyReport): { title: string; body: string } {
  const lines = [
    `게임 ${r.games.plays}판${r.games.prevPlays ? ` (지난주 ${r.games.prevPlays}판)` : ""}`,
    `오늘의 한 가지 ${r.habits.days}/7일`,
    r.meds.total > 0 ? `약 ${r.meds.taken}/${r.meds.total}회` : null,
    `측정 ${r.measures}회 · 이야기 ${r.answers}개`,
    ...r.levelUps.slice(0, 2).map((l) => `${l.gameName} ${l.from}→${l.to}단계`),
    ...r.concerns.map((c) => `· ${c}`),
  ].filter(Boolean);
  return { title: `이번 주 ${name}님 소식`, body: lines.join("\n") };
}
