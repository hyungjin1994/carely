import { GamesList } from "./games-list";
import { getTodayGamePoints } from "@/lib/queries";

export default async function GamesPage() {
  const todayByGame = await getTodayGamePoints();
  return <GamesList todayByGame={todayByGame} />;
}
