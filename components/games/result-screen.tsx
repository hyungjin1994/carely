"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/common/icon";
import { getGame, type GameId } from "@/lib/games/config";

export function ResultScreen({
  gameId,
  correct,
  total,
  awarded,
  mult,
  onReplay,
}: {
  gameId: GameId;
  correct: number;
  total: number;
  awarded: number;
  mult: number;
  onReplay: () => void;
}) {
  const router = useRouter();
  const meta = getGame(gameId);
  const great = total > 0 && correct / total >= 0.7;

  return (
    <div style={{ padding: "30px 24px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 32,
            background: meta.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 14px 30px ${meta.color}55`,
            animation: "cypop .5s ease",
          }}
        >
          <Icon name={great ? "trophy" : meta.icon} size={54} color="#fff" />
        </div>
        <div style={{ fontSize: "calc(28px*var(--fs))", fontWeight: 800, color: "var(--c-text)", marginTop: 24, letterSpacing: "-0.02em" }}>
          {great ? "아주 잘하셨어요!" : "잘하셨어요!"}
        </div>
        <div style={{ fontSize: "calc(17px*var(--fs))", color: "var(--c-sub)", marginTop: 6 }}>{meta.name}</div>

        <div style={{ display: "flex", gap: 14, marginTop: 26, width: "100%" }}>
          <Card style={{ flex: 1 }}>
            <div style={{ padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", fontWeight: 700 }}>맞힌 개수</div>
              <div style={{ fontSize: "calc(30px*var(--fs))", fontWeight: 800, color: "var(--c-text)", marginTop: 4 }}>
                {correct} / {total}
              </div>
            </div>
          </Card>
          <Card style={{ flex: 1 }}>
            <div style={{ padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", fontWeight: 700 }}>얻은 포인트</div>
              <div style={{ fontSize: "calc(30px*var(--fs))", fontWeight: 800, color: "#0066FF", marginTop: 4 }}>+{awarded}</div>
            </div>
          </Card>
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: "calc(14px*var(--fs))",
            color: "var(--c-sub)",
            background: "var(--c-card)",
            border: "1px solid var(--c-line)",
            borderRadius: 14,
            padding: "10px 16px",
          }}
        >
          포인트 {mult}배 적용됨
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        <button
          onClick={onReplay}
          style={{
            border: "none",
            borderRadius: 18,
            height: 62,
            background: "var(--c-primary)",
            color: "#fff",
            fontSize: "calc(18px*var(--fs))",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon name="refresh" size={24} color="#fff" />
          다시하기
        </button>
        <button
          onClick={() => router.push("/games")}
          style={{
            border: "1px solid var(--c-line)",
            borderRadius: 18,
            height: 60,
            background: "var(--c-card)",
            color: "var(--c-text)",
            fontSize: "calc(17px*var(--fs))",
            fontWeight: 800,
          }}
        >
          다른 게임 하기
        </button>
      </div>
    </div>
  );
}
