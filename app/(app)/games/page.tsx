import { GamesList } from "./games-list";
import { getTodayGamePoints, getLastGameDifficulty, getGameLevels } from "@/lib/queries";

// 인증·사용자별 데이터 — 항상 동적.
export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const [todayByGame, lastDiff, levels] = await Promise.all([
    getTodayGamePoints(),
    getLastGameDifficulty(),
    getGameLevels(),
  ]);
  return <GamesList todayByGame={todayByGame} lastDiff={lastDiff} levels={levels} />;
}
