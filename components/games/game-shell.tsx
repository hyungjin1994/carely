"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { getGame, type GameId } from "@/lib/games/config";

export function GameShell({
  gameId,
  sub,
  roundLabel,
  children,
}: {
  gameId: GameId;
  /** 제목 아래 한 줄. 3단계 게임은 "보통 · 포인트 2배", 레벨 게임은 "7단계 · 포인트 1.6배". */
  sub: string;
  roundLabel: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const meta = getGame(gameId);

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0 18px" }}>
        <button
          onClick={() => router.push("/games")}
          aria-label="게임 목록"
          style={{
            border: "none",
            background: "var(--c-card)",
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)",
          }}
        >
          <Icon name="chevron-left" size={24} color="var(--c-text)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "calc(19px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{meta.name}</div>
          <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>
            {sub}
          </div>
        </div>
        {roundLabel && (
          <div
            style={{
              fontSize: "calc(15px*var(--fs))",
              fontWeight: 800,
              color: meta.color,
              background: meta.color + "1a",
              padding: "8px 12px",
              borderRadius: 12,
            }}
          >
            {roundLabel}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
