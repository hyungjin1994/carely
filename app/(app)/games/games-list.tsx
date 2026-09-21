"use client";

import { useRouter } from "next/navigation";
import { DIFF, GAMES, PER_GAME_DAILY_CAP, type Difficulty, type GameMeta } from "@/lib/games/config";
import { Icon } from "@/components/common/icon";

const ORDER: Difficulty[] = ["easy", "normal", "hard"];

export function GamesList({
  todayByGame,
  lastDiff,
}: {
  todayByGame: Record<string, number>;
  /** 게임별 마지막으로 한 난이도. 없으면 아직 안 해본 게임. */
  lastDiff: Record<string, Difficulty>;
}) {
  return (
    <div style={{ padding: "6px 22px 28px" }}>
      <div style={{ fontSize: "calc(28px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--c-text)", margin: "8px 0 4px" }}>
        두뇌 게임
      </div>
      <div style={{ fontSize: "calc(16px*var(--fs))", color: "var(--c-sub)", marginBottom: 20 }}>
        게임과 단계를 골라 시작해요. 단계가 높으면 포인트가 많아요
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {GAMES.map((g) => (
          <GameCard
            key={g.id}
            game={g}
            earned={Math.min(todayByGame[g.id] ?? 0, PER_GAME_DAILY_CAP)}
            last={lastDiff[g.id]}
          />
        ))}
      </div>
    </div>
  );
}

function GameCard({
  game: g,
  earned,
  last,
}: {
  game: GameMeta;
  earned: number;
  last?: Difficulty;
}) {
  const router = useRouter();
  const pct = Math.round((earned / PER_GAME_DAILY_CAP) * 100);
  const full = earned >= PER_GAME_DAILY_CAP;

  return (
    <div
      style={{
        background: "var(--c-card)",
        border: "1px solid var(--c-line)",
        borderRadius: 22,
        padding: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
      </div>

      {/* 단계 선택. 전에는 카드 전체가 버튼이라 늘 쉬움으로만 들어갔다.
          지난번에 한 단계는 색을 채워 표시한다 — 이어서 하기 쉽게. */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {ORDER.map((d) => {
          const cfg = DIFF[d];
          const isLast = last === d;
          return (
            <button
              key={d}
              onClick={() => router.push(`/games/${g.id}/play?diff=${d}`)}
              aria-label={`${g.name} ${cfg.label} 단계 시작${isLast ? " (지난번 단계)" : ""}`}
              style={{
                flex: 1,
                minHeight: 56,
                borderRadius: 14,
                border: isLast ? `2px solid ${cfg.color}` : "1px solid var(--c-line)",
                background: isLast ? cfg.color : "var(--c-screen)",
                color: isLast ? "#fff" : "var(--c-text)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "8px 4px",
              }}
            >
              <span style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 800 }}>{cfg.label}</span>
              <span
                style={{
                  fontSize: "calc(12px*var(--fs))",
                  fontWeight: 700,
                  opacity: isLast ? 0.95 : 0.7,
                  color: isLast ? "#fff" : cfg.color,
                }}
              >
                {cfg.mult}배
              </span>
            </button>
          );
        })}
      </div>

      {last && (
        <div
          style={{
            fontSize: "calc(12px*var(--fs))",
            color: "var(--c-faint)",
            fontWeight: 700,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          지난번에 {DIFF[last].label} 단계를 하셨어요
        </div>
      )}
    </div>
  );
}
