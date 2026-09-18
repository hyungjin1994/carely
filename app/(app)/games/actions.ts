"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DIFF, type ChoiceGameId, type ChoiceRound, type Difficulty, type GameId } from "@/lib/games/config";
import { scoreFor, maxRounds } from "@/lib/games/engine";
import { serveRounds } from "@/lib/games/serve";

export type SubmitResult = { awarded: number };

/**
 * 4지선다 게임(퀴즈·단어)의 한 판을 출제한다.
 * 첫 판은 play 페이지가 서버에서 직접 뽑아 넘기므로 왕복이 없고,
 * 이 액션은 "다시 하기"·"다음 단계"에서만 호출된다.
 */
export async function startChoiceRound(input: {
  gameId: ChoiceGameId;
  difficulty: Difficulty;
}): Promise<ChoiceRound[]> {
  if (!DIFF[input.difficulty]) throw new Error("bad difficulty");
  if (input.gameId !== "quiz" && input.gameId !== "word") throw new Error("bad game");
  return serveRounds(input.gameId, input.difficulty);
}

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
  revalidatePath("/games");
  return { awarded: (data as number) ?? 0 };
}
