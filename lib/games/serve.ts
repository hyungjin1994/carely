import "server-only";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { buildRounds, type SeenMap } from "@/lib/games/quiz-bank";
import { maxRounds } from "@/lib/games/engine";
import type { ChoiceGameId, ChoiceRound, Difficulty } from "@/lib/games/config";

/**
 * 한 판 분량의 문제를 출제한다. 서버에서만 호출된다(은행이 서버 전용이므로).
 *
 * 이력(quiz_seen)을 읽어 "안 본 문제 우선 → 모자라면 오래 전에 본 것부터" 뽑고,
 * 뽑은 문항을 본 것으로 기록한 뒤 qid 를 뗀 ChoiceRound 만 반환한다.
 *
 * 이력 읽기·쓰기가 실패해도 게임은 반드시 돌아야 한다. 어머니 입장에서
 * "문제가 안 뜬다"가 "문제가 겹친다"보다 훨씬 나쁘므로, 실패 시 이력 없이
 * 무작위로 출제하고 조용히 넘어간다.
 */
export async function serveRounds(
  gameId: ChoiceGameId,
  difficulty: Difficulty,
): Promise<ChoiceRound[]> {
  const n = maxRounds(gameId, difficulty);
  const { userId } = await verifySession();
  const supabase = await createClient();

  const seen: SeenMap = {};
  try {
    // RLS(quiz_seen_self)가 본인 행으로 제한하지만, 인덱스(user_id, seen_at)를
    // 타도록 조건을 명시한다.
    const { data, error } = await supabase
      .from("quiz_seen")
      .select("qid, seen_at")
      .eq("user_id", userId);
    if (!error && data) {
      for (const row of data) seen[row.qid] = new Date(row.seen_at).getTime();
    }
  } catch {
    // 네트워크 예외 — 이력 없이 진행한다.
  }

  const served = buildRounds(gameId, n, seen);

  try {
    await supabase.rpc("mark_quiz_seen", { p_qids: served.map((r) => r.qid) });
  } catch {
    // 기록 실패 — 다음 판에 같은 문제가 또 나올 수 있을 뿐, 게임은 정상 진행.
  }

  return served.map((r) => ({ prompt: r.prompt, options: r.options, answer: r.answer }));
}
