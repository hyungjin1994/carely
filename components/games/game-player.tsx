"use client";

import { useState } from "react";
import { ChoiceGame, ChoiceGameSkeleton } from "@/components/games/choice-game";
import { MathGame } from "@/components/games/math-game";
import { StroopGame } from "@/components/games/stroop-game";
import { MemoryGame } from "@/components/games/memory-game";
import { SequenceGame } from "@/components/games/sequence-game";
import { ResultScreen } from "@/components/games/result-screen";
import { DIFF, type ChoiceGameId, type ChoiceRound, type Difficulty, type GameId } from "@/lib/games/config";
import { maxRounds } from "@/lib/games/engine";
import { isLeveled, levelMult, MAX_LEVEL } from "@/lib/games/levels";
import { startChoiceRound, submitGameResult, submitLevelResult } from "@/app/(app)/games/actions";
import { showToast } from "@/components/common/toast";

type ResultData = {
  correct: number;
  total: number;
  awarded: number;
  /** 레벨 게임만. 판을 치른 레벨 → 다음 판 레벨. */
  levelFrom?: number;
  levelTo?: number;
};

const ORDER: Difficulty[] = ["easy", "normal", "hard"];
// 3단계 게임에서 다음 단계 도전을 권하는 기준: 정답률 70% 이상.
const LEVEL_UP_RATIO = 0.7;

const isChoiceGame = (id: GameId): id is ChoiceGameId => id === "quiz" || id === "word";

export function GamePlayer({
  gameId,
  difficulty: initialDiff,
  initialRounds,
  initialLevel,
}: {
  gameId: GameId;
  /** 3단계 게임(상식 퀴즈·단어 맞추기)에서만 쓴다. */
  difficulty: Difficulty;
  /** 퀴즈·단어는 서버에서 뽑은 첫 판을 받는다. 나머지는 null. */
  initialRounds: ChoiceRound[] | null;
  /** 레벨 게임의 현재 레벨. 서버(game_levels)가 진실이다. */
  initialLevel: number;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDiff);
  const [level, setLevel] = useState(initialLevel);
  const [phase, setPhase] = useState<"play" | "result">("play");
  const [result, setResult] = useState<ResultData | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [rounds, setRounds] = useState<ChoiceRound[] | null>(initialRounds);

  const leveled = isLeveled(gameId);

  const loadRounds = async (diff: Difficulty) => {
    if (!isChoiceGame(gameId)) return;
    setRounds(null);
    try {
      setRounds(await startChoiceRound({ gameId, difficulty: diff }));
    } catch {
      showToast("문제를 불러오지 못했어요");
      setRounds([]);
    }
  };

  /**
   * 판 종료. 레벨 게임은 서버가 레벨을 읽어 만점 기준·점수를 다시 계산하고
   * 레벨까지 조정해 돌려준다(클라가 보낸 레벨을 신뢰하지 않는다).
   */
  const finish = async (correct: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (leveled) {
        const res = await submitLevelResult({ gameId, correct });
        setResult({
          correct: Math.min(correct, res.total),
          total: res.total,
          awarded: res.awarded,
          levelFrom: res.levelFrom,
          levelTo: res.levelTo,
        });
        setLevel(res.levelTo);
      } else {
        const total = maxRounds(gameId, difficulty);
        const { awarded } = await submitGameResult({ gameId, difficulty, correct });
        setResult({ correct, total, awarded });
      }
    } catch {
      const total = leveled ? correct : maxRounds(gameId, difficulty);
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
    void loadRounds(difficulty);
  };

  const nextTier = () => {
    const idx = ORDER.indexOf(difficulty);
    const next = ORDER[Math.min(idx + 1, ORDER.length - 1)];
    setDifficulty(next);
    setResult(null);
    setPlayKey((k) => k + 1);
    setPhase("play");
    void loadRounds(next);
  };

  if (phase === "result" && result) {
    if (leveled) {
      const from = result.levelFrom ?? level;
      const to = result.levelTo ?? level;
      return (
        <ResultScreen
          gameId={gameId}
          correct={result.correct}
          total={result.total}
          awarded={result.awarded}
          mult={levelMult(from)}
          difficultyLabel={`${from}단계`}
          onReplay={replay}
          atTop={to >= MAX_LEVEL}
          levelFrom={from}
          levelTo={to}
        />
      );
    }

    const idx = ORDER.indexOf(difficulty);
    const ratio = result.total > 0 ? result.correct / result.total : 0;
    const canLevelUp = ratio >= LEVEL_UP_RATIO && idx < ORDER.length - 1;
    const next = canLevelUp ? ORDER[idx + 1] : null;
    return (
      <ResultScreen
        gameId={gameId}
        correct={result.correct}
        total={result.total}
        awarded={result.awarded}
        mult={DIFF[difficulty].mult}
        difficultyLabel={DIFF[difficulty].label}
        onReplay={replay}
        onNextLevel={canLevelUp ? nextTier : undefined}
        nextLabel={next ? DIFF[next].label : undefined}
        nextMult={next ? DIFF[next].mult : undefined}
        atTop={idx === ORDER.length - 1}
      />
    );
  }

  if (isChoiceGame(gameId)) {
    return (
      <div key={playKey}>
        {rounds ? (
          <ChoiceGame gameId={gameId} rounds={rounds} difficulty={difficulty} onFinish={finish} />
        ) : (
          <ChoiceGameSkeleton gameId={gameId} difficulty={difficulty} />
        )}
      </div>
    );
  }

  return (
    <div key={playKey}>
      {gameId === "math" && <MathGame level={level} onFinish={finish} />}
      {gameId === "stroop" && <StroopGame level={level} onFinish={finish} />}
      {gameId === "mem" && <MemoryGame level={level} onFinish={finish} />}
      {gameId === "seq" && <SequenceGame level={level} onFinish={finish} />}
    </div>
  );
}
