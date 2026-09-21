"use client";

import { useEffect, useRef, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { Icon } from "@/components/common/icon";
import { DIFF, MEM, getGame, type Difficulty } from "@/lib/games/config";
import { memDeck, memMoveLimit, memPreviewMs, type MemCard } from "@/lib/games/engine";

/**
 * 카드 짝맞추기.
 *
 * 두 단계로 진행한다.
 *   preview — 전체 카드를 몇 초간 공개한다. 이게 없으면 초반에 기억할 정보가 없어
 *             무작정 열어보는 것이 최적 전략이 된다(설계 의도는 config.ts MEM 참고).
 *   play    — 뒤집기 제한 안에서 짝을 맞춘다. 제한에 걸리면 판이 끝나지만
 *             맞춘 짝만큼 점수를 받는다. "실패" 화면은 없다.
 */
export function MemoryGame({
  difficulty,
  onFinish,
}: {
  difficulty: Difficulty;
  onFinish: (correct: number) => void;
}) {
  const meta = getGame("mem");
  const n = DIFF[difficulty].n.mem;
  const previewMs = memPreviewMs(n, difficulty);
  const moveLimit = memMoveLimit(n);

  const [deck, setDeck] = useState<MemCard[]>(() => memDeck(n));
  const [phase, setPhase] = useState<"preview" | "play">("preview");
  const [previewLeftMs, setPreviewLeftMs] = useState(previewMs);
  const [first, setFirst] = useState<number | null>(null);
  const [lock, setLock] = useState(false);
  // 종료가 확정된 뒤 남은 애니메이션 동안 추가 입력을 막는다.
  const [done, setDone] = useState(false);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // 미리보기 카운트다운. setState 는 인터벌 콜백 안에서만 호출한다
  // (이펙트 본문에서 동기 호출하면 cascading render 경고 대상).
  useEffect(() => {
    if (phase !== "preview") return;
    const startedAt = Date.now();
    const iv = setInterval(() => {
      const left = previewMs - (Date.now() - startedAt);
      if (left <= 0) {
        setPreviewLeftMs(0);
        setPhase("play");
      } else {
        setPreviewLeftMs(left);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase, previewMs]);

  const cols = n <= 3 ? 3 : 4;
  const movesLeft = Math.max(0, moveLimit - moves);
  const showPreview = phase === "preview";

  const finishSoon = (correct: number, delayMs: number) => {
    setDone(true);
    const t = setTimeout(() => onFinish(correct), delayMs);
    timers.current.push(t);
  };

  const flip = (i: number) => {
    if (showPreview || lock || done) return;
    const card = deck[i];
    if (card.flipped || card.matched) return;

    const flippedDeck = deck.map((c, idx) => (idx === i ? { ...c, flipped: true } : c));

    // 첫 장은 뒤집기 횟수로 세지 않는다 (두 장을 한 번으로 본다).
    if (first === null) {
      setDeck(flippedDeck);
      setFirst(i);
      return;
    }

    const nextMoves = moves + 1;
    setMoves(nextMoves);

    const isMatch = flippedDeck[first].icon === flippedDeck[i].icon;
    const nextMatched = isMatch ? matched + 1 : matched;

    if (isMatch) {
      setDeck(
        flippedDeck.map((c, idx) => (idx === i || idx === first ? { ...c, matched: true } : c)),
      );
      setFirst(null);
      setMatched(nextMatched);
    } else {
      setDeck(flippedDeck);
      setLock(true);
      const firstIdx = first;
      const t = setTimeout(() => {
        setDeck((d) =>
          d.map((c, idx) => (idx === i || idx === firstIdx ? { ...c, flipped: false } : c)),
        );
        setFirst(null);
        setLock(false);
      }, 760);
      timers.current.push(t);
    }

    // 종료 판정 — 다 맞췄거나, 뒤집기 제한에 도달했거나.
    if (nextMatched >= n) {
      finishSoon(nextMatched, 520);
    } else if (nextMoves >= moveLimit) {
      // 마지막 수의 결과를 보여준 뒤 끝낸다 (틀린 카드가 덮이는 것까지 보이게).
      finishSoon(nextMatched, isMatch ? 620 : 1100);
    }
  };

  return (
    <GameShell gameId="mem" difficulty={difficulty} roundLabel={null}>
      {showPreview ? (
        <PreviewBanner color={meta.color} leftMs={previewLeftMs} />
      ) : (
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginBottom: 16 }}>
          <Stat label="맞춘 짝" value={`${matched} / ${n}`} color={meta.color} />
          {/* 두 장을 한 번으로 센다. "뒤집기" 라고 하면 카드 한 장으로 읽히므로 "기회". */}
          <Stat
            label="남은 기회"
            value={`${movesLeft}번`}
            color={movesLeft <= MEM.warnAtMovesLeft ? "#E52222" : "var(--c-text)"}
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12 }}>
        {deck.map((c, i) => {
          const up = showPreview || c.flipped || c.matched;
          return (
            <button
              key={c.key}
              onClick={() => flip(i)}
              aria-label={up ? "뒤집힌 카드" : "카드 뒤집기"}
              style={{ aspectRatio: "3/4", borderRadius: 16, border: "none", padding: 0, perspective: "600px", background: "transparent" }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transition: "transform .4s",
                  transformStyle: "preserve-3d",
                  transform: up ? "rotateY(180deg)" : "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 16,
                    backfaceVisibility: "hidden",
                    background: "linear-gradient(135deg,#C9DEFE,#9EC5FF)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #fff",
                  }}
                >
                  <Icon name="sparkle-fill" size={26} color="rgba(255,255,255,.9)" />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 16,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: c.matched ? c.color + "22" : "var(--c-card)",
                    border: "2px solid " + (c.matched ? c.color : "var(--c-line)"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={c.icon} size={34} color={c.color} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "calc(22px*var(--fs))", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

/** 미리보기 안내 + 남은 초. 카드 영역과 높이를 맞춰 레이아웃이 튀지 않게 한다. */
function PreviewBanner({ color, leftMs }: { color: string; leftMs: number }) {
  const sec = Math.ceil(leftMs / 1000);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 16,
        background: color + "14",
        border: `1px solid ${color}44`,
        borderRadius: 16,
        padding: "12px 16px",
        minHeight: 54,
        boxSizing: "border-box",
      }}
    >
      <Icon name="sparkle-fill" size={22} color={color} />
      <span style={{ fontSize: "calc(18px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>
        잘 봐두세요!
      </span>
      <span style={{ fontSize: "calc(22px*var(--fs))", fontWeight: 800, color }}>{sec}</span>
    </div>
  );
}
