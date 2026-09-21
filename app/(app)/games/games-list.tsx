"use client";

import { useRouter } from "next/navigation";
import { DIFF, GAMES, PER_GAME_DAILY_CAP, type Difficulty, type GameMeta } from "@/lib/games/config";
import { clampLevel, isLeveled, levelMult, MAX_LEVEL } from "@/lib/games/levels";
import { Icon } from "@/components/common/icon";

const ORDER: Difficulty[] = ["easy", "normal", "hard"];

export function GamesList({
  todayByGame,
  lastDiff,
  levels,
}: {
  todayByGame: Record<string, number>;
  /** 3단계 게임(상식 퀴즈·단어 맞추기)의 마지막 난이도. */
  lastDiff: Record<string, Difficulty>;
  /** 레벨 게임의 현재 레벨. 없으면 1. */
  levels: Record<string, number>;
}) {
  return (
    <div style={{ padding: "6px 22px 28px" }}>
      <div style={{ fontSize: "calc(28px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--c-text)", margin: "8px 0 4px" }}>
        두뇌 게임
      </div>
      <div style={{ fontSize: "calc(16px*var(--fs))", color: "var(--c-sub)", marginBottom: 20 }}>
        잘하면 단계가 저절로 올라가요. 단계가 높으면 포인트도 많아져요
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {GAMES.map((g) => (
          <GameCard
            key={g.id}
            game={g}
            earned={Math.min(todayByGame[g.id] ?? 0, PER_GAME_DAILY_CAP)}
            last={lastDiff[g.id]}
            level={clampLevel(levels[g.id] ?? 1)}
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
  level,
}: {
  game: GameMeta;
  earned: number;
  last?: Difficulty;
  level: number;
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

      {isLeveled(g.id) ? (
        /* 레벨 게임 — 난이도를 고르지 않는다. 성과에 따라 저절로 오르내리므로
           고를 것이 없고, 지금 단계와 시작 버튼만 보여준다. */
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: "calc(22px*var(--fs))", fontWeight: 800, color: g.color }}>
              {level}단계
            </span>
            <span style={{ fontSize: "calc(13px*var(--fs))", fontWeight: 700, color: "var(--c-sub)" }}>
              포인트 {levelMult(level)}배{level >= MAX_LEVEL ? " · 최고 단계" : ""}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--c-line)", overflow: "hidden", marginBottom: 12 }}>
            <div style={{ width: `${(level / MAX_LEVEL) * 100}%`, height: "100%", background: g.color, borderRadius: 999 }} />
          </div>
          <button
            onClick={() => router.push(`/games/${g.id}/play`)}
            aria-label={`${g.name} ${level}단계 시작`}
            style={{
              width: "100%",
              minHeight: 56,
              borderRadius: 14,
              border: "none",
              background: g.color,
              color: "#fff",
              fontSize: "calc(17px*var(--fs))",
              fontWeight: 800,
            }}
          >
            시작하기
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
