"use client";

import { useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { OptionButton } from "@/components/games/option-button";
import { NextButton } from "@/components/games/choice-game";
import { Card } from "@/components/ui/card";
import { DIFF, type Difficulty } from "@/lib/games/config";
import { mathRound, type MathRound } from "@/lib/games/engine";

export function MathGame({
  difficulty,
  onFinish,
}: {
  difficulty: Difficulty;
  onFinish: (correct: number) => void;
}) {
  const n = DIFF[difficulty].n.math;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [cur, setCur] = useState<MathRound>(() => mathRound(difficulty));

  const last = round + 1 >= n;

  const pick = (i: number) => {
    if (answered) return;
    setSel(i);
    setAnswered(true);
    if (i === cur.correct) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (last) {
      onFinish(correct);
      return;
    }
    setRound((r) => r + 1);
    setSel(null);
    setAnswered(false);
    setCur(mathRound(difficulty));
  };

  return (
    <GameShell gameId="math" difficulty={difficulty} roundLabel={`${round + 1} / ${n}`}>
      <Card>
        <div style={{ padding: "30px 22px", textAlign: "center" }}>
          <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-sub)", fontWeight: 700, marginBottom: 10 }}>
            계산해 보세요
          </div>
          <div style={{ fontSize: "calc(46px*var(--fs))", fontWeight: 800, color: "var(--c-text)", letterSpacing: "-0.01em" }}>
            {cur.a} {cur.plus ? "+" : "−"} {cur.b} = ?
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        {cur.opts.map((opt, i) => (
          <OptionButton
            key={i}
            label={String(opt)}
            index={i}
            selected={sel}
            correctIndex={cur.correct}
            answered={answered}
            center
            onClick={() => pick(i)}
          />
        ))}
      </div>
      {answered && <NextButton last={last} onClick={next} />}
    </GameShell>
  );
}
