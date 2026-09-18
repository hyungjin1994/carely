import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/games/game-player";
import { serveRounds } from "@/lib/games/serve";
import { GAME_IDS, type ChoiceRound, type Difficulty, type GameId } from "@/lib/games/config";

const DIFFS: Difficulty[] = ["easy", "normal", "hard"];

// 부모 (app)/layout 의 requireSenior() + searchParams 사용 — 동적.
// 향후 middleware 로 auth 가드 분리 시 generateStaticParams 도입 가능.
export const dynamic = "force-dynamic";

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
  const gameId = id as GameId;
  const difficulty: Difficulty = DIFFS.includes(diff as Difficulty)
    ? (diff as Difficulty)
    : "easy";

  // 퀴즈·단어는 문제를 서버 은행에서 뽑는다. 이 페이지는 이미 요청마다
  // 서버 렌더되므로 여기서 뽑으면 첫 판에 추가 왕복이 생기지 않는다.
  // (이후 "다시 하기"는 startChoiceRound 액션으로 새로 받는다.)
  const initialRounds: ChoiceRound[] | null =
    gameId === "quiz" || gameId === "word" ? await serveRounds(gameId, difficulty) : null;

  return <GamePlayer gameId={gameId} difficulty={difficulty} initialRounds={initialRounds} />;
}
