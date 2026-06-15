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
  difficultyLabel,
  onReplay,
  onNextLevel,
  nextLabel,
  nextMult,
  atTop,
}: {
  gameId: GameId;
  correct: number;
  total: number;
  awarded: number;
  mult: number;
  difficultyLabel: string;
  onReplay: () => void;
  onNextLevel?: () => void;
  nextLabel?: string;
  nextMult?: number;
  atTop?: boolean;
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
        <div style={{ fontSize: "calc(17px*var(--fs))", color: "var(--c-sub)", marginTop: 6 }}>
          {meta.name} · {difficultyLabel} 단계
        </div>

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

        {/* 다음 단계 권유 배너 */}
        {onNextLevel && (
          <div
            style={{
              marginTop: 18,
              width: "100%",
              borderRadius: 18,
              padding: "16px 18px",
              background: "linear-gradient(135deg,#5B37ED,#0066FF)",
              color: "#fff",
              boxShadow: "0 10px 24px rgba(91,55,237,.28)",
            }}
          >
            <div style={{ fontSize: "calc(18px*var(--fs))", fontWeight: 800 }}>와, 정말 잘하시네요!</div>
            <div style={{ fontSize: "calc(14px*var(--fs))", opacity: 0.95, marginTop: 4 }}>
              이번엔 {nextLabel} 단계도 해보실래요? 포인트를 <b>{nextMult}배</b>로 드려요
            </div>
          </div>
        )}

        {!onNextLevel && (
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
            {awarded > 0
              ? atTop
                ? `최고 단계예요! 포인트 ${mult}배 적용됨`
                : `포인트 ${mult}배 적용됨`
              : correct > 0
                ? "오늘은 이 게임 포인트를 다 모았어요"
                : "다음엔 더 잘할 수 있어요"}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {onNextLevel ? (
          <>
            <button
              onClick={onNextLevel}
              style={{ border: "none", borderRadius: 18, height: 62, background: "var(--c-primary)", color: "#fff", fontSize: "calc(18px*var(--fs))", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Icon name="thunder-fill" size={24} color="#fff" />
              {nextLabel} 단계 해볼게요 · 포인트 {nextMult}배
            </button>
            <button
              onClick={onReplay}
              style={{ border: "1px solid var(--c-line)", borderRadius: 18, height: 58, background: "var(--c-card)", color: "var(--c-text)", fontSize: "calc(17px*var(--fs))", fontWeight: 800 }}
            >
              이 단계 한 번 더
            </button>
            <button
              onClick={() => router.push("/games")}
              style={{ border: "none", background: "transparent", color: "var(--c-sub)", fontSize: "calc(16px*var(--fs))", fontWeight: 700, height: 44 }}
            >
              다른 게임 하기
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onReplay}
              style={{ border: "none", borderRadius: 18, height: 62, background: "var(--c-primary)", color: "#fff", fontSize: "calc(18px*var(--fs))", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Icon name="refresh" size={24} color="#fff" />
              다시하기
            </button>
            <button
              onClick={() => router.push("/games")}
              style={{ border: "1px solid var(--c-line)", borderRadius: 18, height: 60, background: "var(--c-card)", color: "var(--c-text)", fontSize: "calc(17px*var(--fs))", fontWeight: 800 }}
            >
              다른 게임 하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
