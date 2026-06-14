"use client";

import { BottomSheet } from "@/components/common/bottom-sheet";
import { DIFF, type Difficulty, type GameId, getGame } from "@/lib/games/config";

const ORDER: Difficulty[] = ["easy", "normal", "hard"];

export function DifficultySheet({
  gameId,
  open,
  onClose,
  onPick,
}: {
  gameId: GameId | null;
  open: boolean;
  onClose: () => void;
  onPick: (gameId: GameId, diff: Difficulty) => void;
}) {
  if (!gameId) return null;
  const meta = getGame(gameId);
  return (
    <BottomSheet open={open} onClose={onClose} title={meta.name}>
      <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-sub)", margin: "-8px 0 18px" }}>
        난이도를 골라요. 어려울수록 포인트가 많아요
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ORDER.map((d) => {
          const c = DIFF[d];
          return (
            <button
              key={d}
              onClick={() => onPick(gameId, d)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                border: "2px solid " + c.color + "40",
                background: c.color + "10",
                borderRadius: 18,
                padding: "16px 18px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: c.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "calc(20px*var(--fs))",
                }}
              >
                {c.short}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "calc(18px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{c.label}</div>
                <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>{c.detail}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: "calc(16px*var(--fs))", color: c.color }}>×{c.mult}</div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
