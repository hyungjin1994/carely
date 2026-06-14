"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES, type Difficulty, type GameId } from "@/lib/games/config";
import { Icon } from "@/components/common/icon";
import { DifficultySheet } from "@/components/games/difficulty-sheet";

export function GamesList() {
  const router = useRouter();
  const [picker, setPicker] = useState<GameId | null>(null);

  const start = (gameId: GameId, diff: Difficulty) => {
    setPicker(null);
    router.push(`/games/${gameId}/play?diff=${diff}`);
  };

  return (
    <div style={{ padding: "6px 22px 28px" }}>
      <div style={{ fontSize: "calc(28px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--c-text)", margin: "8px 0 4px" }}>
        두뇌 게임
      </div>
      <div style={{ fontSize: "calc(16px*var(--fs))", color: "var(--c-sub)", marginBottom: 20 }}>
        게임을 고르고 난이도를 정해요
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setPicker(g.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "var(--c-card)",
              border: "1px solid var(--c-line)",
              borderRadius: 22,
              padding: 16,
              textAlign: "left",
              boxShadow: "0 1px 4px rgba(0,0,0,.05)",
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: 18,
                background: g.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 6px 14px ${g.color}44`,
              }}
            >
              <Icon name={g.icon} size={32} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "calc(19px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{g.name}</div>
              <div style={{ fontSize: "calc(14px*var(--fs))", color: "var(--c-sub)", marginTop: 3 }}>{g.desc}</div>
            </div>
            <Icon name="chevron-right" size={24} color="var(--c-faint)" />
          </button>
        ))}
      </div>

      <DifficultySheet
        gameId={picker}
        open={picker !== null}
        onClose={() => setPicker(null)}
        onPick={start}
      />
    </div>
  );
}
