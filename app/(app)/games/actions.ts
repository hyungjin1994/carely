"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSenior } from "@/lib/auth/dal";
import { DIFF, type ChoiceGameId, type ChoiceRound, type Difficulty, type GameId } from "@/lib/games/config";
import { scoreFor, maxRounds } from "@/lib/games/engine";
import {
  clampLevel,
  isLeveled,
  levelRounds,
  levelScore,
  nextLevel,
  type LeveledGameId,
} from "@/lib/games/levels";
import { serveRounds } from "@/lib/games/serve";

export type SubmitResult = { awarded: number };

export type LevelSubmitResult = {
  awarded: number;
  /** 서버가 계산한 만점 기준 (클라 표시용) */
  total: number;
  levelFrom: number;
  levelTo: number;
};

/**
 * 레벨 게임(짝맞추기·색깔·계산·순서기억) 결과 제출.
 *
 * 레벨을 클라이언트에서 받지 않는다 — 포인트 배수가 레벨에서 나오므로
 * "레벨 30" 이라고 보내면 포인트를 마음대로 받을 수 있다. game_levels 를 읽어
 * 서버가 만점 기준(total)과 점수를 다시 계산하고, 끝나면 레벨을 조정한다.
 */
export async function submitLevelResult(input: {
  gameId: GameId;
  correct: number;
}): Promise<LevelSubmitResult> {
  if (!isLeveled(input.gameId)) throw new Error("not a leveled game");
  const gameId: LeveledGameId = input.gameId;

  const profile = await requireSenior();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("game_levels")
    .select("level")
    .eq("user_id", profile.id)
    .eq("game_id", gameId)
    .maybeSingle();
  const levelFrom = clampLevel(row?.level ?? 1);

  const total = levelRounds(gameId, levelFrom);
  const correct = Math.max(0, Math.min(Math.trunc(input.correct), total));
  const points = levelScore(correct, total, levelFrom);

  // 하루 상한 클램프와 적립·기록은 기존 RPC 가 처리한다.
  // difficulty 컬럼에는 레벨 숫자를 문자열로 남긴다(0017 주석 참고).
  const { data, error } = await supabase.rpc("submit_game_result", {
    p_game_id: gameId,
    p_difficulty: String(levelFrom),
    p_correct: correct,
    p_total: total,
    p_points: points,
  });
  if (error) throw new Error(error.message);

  const levelTo = nextLevel(levelFrom, correct, total);
  if (levelTo !== levelFrom) {
    // 레벨 조정 실패는 판을 무효로 만들지 않는다 — 포인트는 이미 적립됐다.
    await supabase
      .from("game_levels")
      .upsert(
        { user_id: profile.id, game_id: gameId, level: levelTo, updated_at: new Date().toISOString() },
        { onConflict: "user_id,game_id" },
      );
  }

  revalidatePath("/points");
  revalidatePath("/home");
  revalidatePath("/games");
  return { awarded: (data as number) ?? 0, total, levelFrom, levelTo };
}

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
