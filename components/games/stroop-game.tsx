"use client";

import { useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { NextButton } from "@/components/games/choice-game";
import { Card } from "@/components/ui/card";
import { DIFF, type Difficulty } from "@/lib/games/config";
import { stroopRound, type StroopRound } from "@/lib/games/engine";

export function StroopGame({
  difficulty,
  onFinish,
}: {
  difficulty: Difficulty;
  onFinish: (correct: number) => void;
}) {
  const n = DIFF[difficulty].n.stroop;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [cur, setCur] = useState<StroopRound>(() => stroopRound());

  const last = round + 1 >= n;

  const pick = (i: number) => {
    if (answered) return;
    setSel(i);
    setAnswered(true);
    if (cur.opts[i].hex === cur.ink.hex) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (last) {
      onFinish(correct);
      return;
    }
    setRound((r) => r + 1);
    setSel(null);
    setAnswered(false);
    setCur(stroopRound());
  };

  return (
    <GameShell gameId="stroop" difficulty={difficulty} roundLabel={`${round + 1} / ${n}`}>
      <Card>
        <div style={{ padding: "34px 22px", textAlign: "center" }}>
          <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-sub)", fontWeight: 700, marginBottom: 16 }}>
            글자의 색깔을 고르세요
          </div>
          <div style={{ fontSize: "calc(56px*var(--fs))", fontWeight: 800, color: cur.ink.hex, letterSpacing: "-0.01em" }}>
            {cur.word}
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        {cur.opts.map((col, i) => {
          const picked = sel === i;
          const isInk = col.hex === cur.ink.hex;
          const showState = answered && (picked || isInk);
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={answered}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                height: 72,
                borderRadius: 18,
                border: "2px solid " + (showState ? (isInk ? "#00A63E" : "#E52222") : "var(--c-line)"),
                background: "var(--c-card)",
                fontSize: "calc(18px*var(--fs))",
                fontWeight: 800,
                color: "var(--c-text)",
              }}
            >
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: col.hex, flexShrink: 0 }} />
              {col.name}
            </button>
          );
        })}
      </div>
      {answered && <NextButton last={last} onClick={next} />}
    </GameShell>
  );
}
