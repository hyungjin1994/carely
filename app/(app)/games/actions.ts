"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DIFF, type Difficulty, type GameId } from "@/lib/games/config";
import { scoreFor, maxRounds } from "@/lib/games/engine";

export type SubmitResult = { awarded: number };

/**
 * 서버 권위 채점. 클라가 보낸 correct/total 을 난이도 상한으로 클램프하고
 * 점수를 서버에서 재계산한 뒤 RPC(submit_game_result)로 적립+기록한다.
 */
export async function submitGameResult(input: {
  gameId: GameId;
  difficulty: Difficulty;
  correct: number;
}): Promise<SubmitResult> {
  const cfg = DIFF[input.difficulty];
  if (!cfg) throw new Error("bad difficulty");
  const total = maxRounds(input.gameId, input.difficulty);
  const correct = Math.max(0, Math.min(input.correct, total));
  const points = scoreFor(correct, cfg.mult);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_game_result", {
    p_game_id: input.gameId,
    p_difficulty: input.difficulty,
    p_correct: correct,
    p_total: total,
    p_points: points,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/points");
  revalidatePath("/home");
  return { awarded: (data as number) ?? 0 };
}
