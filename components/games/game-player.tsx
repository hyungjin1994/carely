"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/games/choice-game";
import { MathGame } from "@/components/games/math-game";
import { StroopGame } from "@/components/games/stroop-game";
import { MemoryGame } from "@/components/games/memory-game";
import { SequenceGame } from "@/components/games/sequence-game";
import { ResultScreen } from "@/components/games/result-screen";
import { DIFF, type Difficulty, type GameId } from "@/lib/games/config";
import { maxRounds } from "@/lib/games/engine";
import { submitGameResult } from "@/app/(app)/games/actions";
import { showToast } from "@/components/common/toast";

type ResultData = { correct: number; total: number; awarded: number };

export function GamePlayer({ gameId, difficulty }: { gameId: GameId; difficulty: Difficulty }) {
  const [phase, setPhase] = useState<"play" | "result">("play");
  const [result, setResult] = useState<ResultData | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const finish = async (correct: number) => {
    if (submitting) return;
    setSubmitting(true);
    const total = maxRounds(gameId, difficulty);
    try {
      const { awarded } = await submitGameResult({ gameId, difficulty, correct });
      setResult({ correct, total, awarded });
    } catch {
      setResult({ correct, total, awarded: 0 });
      showToast("점수 저장에 실패했어요");
    } finally {
      setPhase("result");
      setSubmitting(false);
    }
  };

  const replay = () => {
    setResult(null);
    setPlayKey((k) => k + 1);
    setPhase("play");
  };

  if (phase === "result" && result) {
    return (
      <ResultScreen
        gameId={gameId}
        correct={result.correct}
        total={result.total}
        awarded={result.awarded}
        mult={DIFF[difficulty].mult}
        onReplay={replay}
      />
    );
  }

  const common = { difficulty, onFinish: finish };
  return (
    <div key={playKey}>
      {gameId === "quiz" && <ChoiceGame gameId="quiz" {...common} />}
      {gameId === "word" && <ChoiceGame gameId="word" {...common} />}
      {gameId === "math" && <MathGame {...common} />}
      {gameId === "stroop" && <StroopGame {...common} />}
      {gameId === "mem" && <MemoryGame {...common} />}
      {gameId === "seq" && <SequenceGame {...common} />}
    </div>
  );
}
