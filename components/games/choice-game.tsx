"use client";

import { useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { OptionButton } from "@/components/games/option-button";
import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/common/skeleton";
import { Icon } from "@/components/common/icon";
import { getGame, type ChoiceGameId, type ChoiceRound, type Difficulty } from "@/lib/games/config";

/**
 * 상식 퀴즈 + 단어 맞추기 (보드 구조 동일).
 * 문제는 서버 은행에서 뽑아 props 로 받는다 — 출제 이력을 봐야 하므로 클라에서 만들 수 없다.
 */
export function ChoiceGame({
  gameId,
  difficulty,
  rounds,
  onFinish,
}: {
  gameId: ChoiceGameId;
  difficulty: Difficulty;
  rounds: ChoiceRound[];
  onFinish: (correct: number) => void;
}) {
  const meta = getGame(gameId);

  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // 난이도 정의값(DIFF.n) 대신 실제로 받은 개수를 쓴다 —
  // 은행이 그보다 작으면(단어 게임) 라운드 수가 모자랄 수 있다.
  const total = rounds.length;
  const q = rounds[round];
  const last = round + 1 >= total;

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

  // 출제가 비어 오는 경우(은행이 빈 경우뿐) 빈 보드를 그리다 터지지 않게 막는다.
  if (!q) {
    return (
      <GameShell gameId={gameId} difficulty={difficulty} roundLabel={null}>
        <Card>
          <div
            style={{
              padding: "36px 22px",
              textAlign: "center",
              fontSize: "calc(18px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-sub)",
            }}
          >
            문제를 준비하지 못했어요.
            <br />
            잠시 뒤 다시 시작해 주세요.
          </div>
        </Card>
      </GameShell>
    );
  }

  return (
    <GameShell gameId={gameId} difficulty={difficulty} roundLabel={`${round + 1} / ${total}`}>
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

/** "다시 하기"로 서버에서 새 문제를 받는 동안 보여줄 자리표시. 보드와 높이를 맞춘다. */
export function ChoiceGameSkeleton({
  gameId,
  difficulty,
}: {
  gameId: ChoiceGameId;
  difficulty: Difficulty;
}) {
  return (
    <GameShell gameId={gameId} difficulty={difficulty} roundLabel={null}>
      <SkeletonCard h={168} style={{ borderRadius: 22 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} h={62} style={{ borderRadius: 18 }} />
        ))}
      </div>
    </GameShell>
  );
}
