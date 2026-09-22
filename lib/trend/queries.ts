import "server-only";

import { createClient } from "@/lib/supabase/server";
import { HISTORY_WEEKS, buildTrend, lastWeekStarts, type GameTrend, type PlayRow } from "@/lib/trend/cognitive";

/**
 * 인지 추이 — 자녀 전용.
 *
 * game_scores 만 읽는다. game_levels 는 **현재 레벨만** 들고 있어서 추이를 낼 수
 * 없고, RLS 도 본인 전용이라 자녀가 못 읽는다(0017). game_scores 에는 판마다
 * 그때의 레벨이 difficulty 에 문자열로 남고 자녀 읽기가 열려 있다(0003
 * game_scores_family_read).
 *
 * 권한은 호출부가 확인한다 — /connect/[seniorId]/* 는 전부 family_links 를 먼저
 * 확인하고, RLS 가 이중으로 막는다.
 */
export async function getCognitiveTrend(seniorId: string): Promise<GameTrend[]> {
  const supabase = await createClient();

  const weeks = lastWeekStarts(HISTORY_WEEKS);
  const fromIso = new Date(`${weeks[0]}T00:00:00+09:00`).toISOString();

  // 12주 × 6종 × 하루 몇 판이면 PostgREST 기본 1,000행 상한에 닿을 수 있다.
  // 상한에서 잘리면 오래된 주가 조용히 비어 "안 하셨다" 로 보이므로 명시한다.
  const { data } = await supabase
    .from("game_scores")
    .select("game_id, difficulty, correct, total, created_at")
    .eq("user_id", seniorId)
    .gte("created_at", fromIso)
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows: PlayRow[] = (data ?? []).map((r) => ({
    gameId: r.game_id,
    difficulty: r.difficulty,
    correct: r.correct,
    total: r.total,
    createdAt: r.created_at,
  }));

  return buildTrend(rows);
}
