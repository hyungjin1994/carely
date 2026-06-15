"use client";

import { useRouter } from "next/navigation";
import { GAMES, PER_GAME_DAILY_CAP } from "@/lib/games/config";
import { Icon } from "@/components/common/icon";

export function GamesList({ todayByGame }: { todayByGame: Record<string, number> }) {
  const router = useRouter();

  return (
    <div style={{ padding: "6px 22px 28px" }}>
      <div style={{ fontSize: "calc(28px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--c-text)", margin: "8px 0 4px" }}>
        두뇌 게임
      </div>
      <div style={{ fontSize: "calc(16px*var(--fs))", color: "var(--c-sub)", marginBottom: 20 }}>
        게임을 골라 시작해요. 잘하면 다음 단계로 올라가요
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {GAMES.map((g) => {
          const earned = Math.min(todayByGame[g.id] ?? 0, PER_GAME_DAILY_CAP);
          const pct = Math.round((earned / PER_GAME_DAILY_CAP) * 100);
          const full = earned >= PER_GAME_DAILY_CAP;
          return (
            <button
              key={g.id}
              onClick={() => router.push(`/games/${g.id}/play`)}
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "calc(19px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{g.name}</div>
                <div style={{ fontSize: "calc(14px*var(--fs))", color: "var(--c-sub)", marginTop: 3 }}>{g.desc}</div>
                <div style={{ marginTop: 9 }}>
                  <div
                    style={{
                      fontSize: "calc(13px*var(--fs))",
                      fontWeight: 700,
                      color: full ? g.color : "var(--c-sub)",
                      marginBottom: 5,
                    }}
                  >
                    오늘 {earned}/{PER_GAME_DAILY_CAP}점
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--c-line)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: g.color,
                        borderRadius: 999,
                        transition: "width .3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
              <Icon name="chevron-right" size={24} color="var(--c-faint)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
