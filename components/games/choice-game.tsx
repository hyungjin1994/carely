"use client";

import { useMemo, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { OptionButton } from "@/components/games/option-button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/common/icon";
import { DIFF, getGame, type Difficulty } from "@/lib/games/config";
import { buildQuizList, buildWordList } from "@/lib/games/engine";

type Round = { prompt: string; options: string[]; answer: number };

/** 상식 퀴즈 + 단어 맞추기 (보드 구조 동일). */
export function ChoiceGame({
  gameId,
  difficulty,
  onFinish,
}: {
  gameId: "quiz" | "word";
  difficulty: Difficulty;
  onFinish: (correct: number) => void;
}) {
  const meta = getGame(gameId);
  const n = DIFF[difficulty].n[gameId];

  const list = useMemo<Round[]>(() => {
    if (gameId === "quiz")
      return buildQuizList(n).map((q) => ({ prompt: q.q, options: q.o, answer: q.a }));
    return buildWordList(n).map((w) => ({ prompt: w.q, options: w.opts, answer: w.a }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const q = list[round];
  const last = round + 1 >= n;

  const pick = (i: number) => {
    if (answered) return;
    setSel(i);
    setAnswered(true);
    if (i === q.answer) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (last) {
      onFinish(correct);
      return;
    }
    setRound((r) => r + 1);
    setSel(null);
    setAnswered(false);
  };

  return (
    <GameShell gameId={gameId} difficulty={difficulty} roundLabel={`${round + 1} / ${n}`}>
      <Card>
        <div style={{ padding: "26px 22px", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              width: 54,
              height: 54,
              borderRadius: 16,
              background: meta.color + "1a",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Icon name={meta.icon} size={28} color={meta.color} />
          </div>
          <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-sub)", fontWeight: 700, marginBottom: 6 }}>
            {gameId === "word" ? "어울리는 짝은?" : "문제"}
          </div>
          <div style={{ fontSize: "calc(23px*var(--fs))", fontWeight: 800, color: "var(--c-text)", lineHeight: 1.4 }}>
            {q.prompt}
          </div>
        </div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
        {q.options.map((opt, i) => (
          <OptionButton
            key={i}
            label={opt}
            index={i}
            selected={sel}
            correctIndex={q.answer}
            answered={answered}
            onClick={() => pick(i)}
          />
        ))}
      </div>
      {answered && (
        <NextButton last={last} onClick={next} />
      )}
    </GameShell>
  );
}

export function NextButton({ last, onClick }: { last: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 20,
        width: "100%",
        border: "none",
        borderRadius: 18,
        height: 62,
        background: "var(--c-primary)",
        color: "#fff",
        fontSize: "calc(18px*var(--fs))",
        fontWeight: 800,
      }}
    >
      {last ? "결과 보기" : "다음 문제"}
    </button>
  );
}
