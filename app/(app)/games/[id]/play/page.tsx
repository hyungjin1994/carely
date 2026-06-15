import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/games/game-player";
import { GAME_IDS, type Difficulty, type GameId } from "@/lib/games/config";

const DIFFS: Difficulty[] = ["easy", "normal", "hard"];

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ diff?: string }>;
}) {
  const { id } = await params;
  const { diff } = await searchParams;
  if (!GAME_IDS.includes(id as GameId)) notFound();
  const difficulty: Difficulty = DIFFS.includes(diff as Difficulty)
    ? (diff as Difficulty)
    : "easy";

  return <GamePlayer gameId={id as GameId} difficulty={difficulty} />;
}
