"use client";

import { useEffect, useRef, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { Icon } from "@/components/common/icon";
import { DIFF, getGame, type Difficulty } from "@/lib/games/config";
import { memDeck, type MemCard } from "@/lib/games/engine";

export function MemoryGame({
  difficulty,
  onFinish,
}: {
  difficulty: Difficulty;
  onFinish: (correct: number) => void;
}) {
  const meta = getGame("mem");
  const n = DIFF[difficulty].n.mem;

  const [deck, setDeck] = useState<MemCard[]>(() => memDeck(n));
  const [first, setFirst] = useState<number | null>(null);
  const [lock, setLock] = useState(false);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const cols = n <= 3 ? 3 : 4;

  const flip = (i: number) => {
    if (lock) return;
    const card = deck[i];
    if (card.flipped || card.matched) return;

    const flippedDeck = deck.map((c, idx) => (idx === i ? { ...c, flipped: true } : c));

    if (first === null) {
      setDeck(flippedDeck);
      setFirst(i);
      return;
    }

    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (flippedDeck[first].icon === flippedDeck[i].icon) {
      const md = flippedDeck.map((c, idx) =>
        idx === i || idx === first ? { ...c, matched: true } : c,
      );
      const nextMatched = matched + 1;
      setDeck(md);
      setFirst(null);
      setMatched(nextMatched);
      if (nextMatched >= n) {
        const t = setTimeout(() => onFinish(nextMatched), 520);
        timers.current.push(t);
      }
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
  };

  return (
    <GameShell gameId="mem" difficulty={difficulty} roundLabel={null}>
      <div style={{ display: "flex", justifyContent: "center", gap: 18, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", fontWeight: 700 }}>맞춘 짝</div>
          <div style={{ fontSize: "calc(22px*var(--fs))", fontWeight: 800, color: meta.color }}>{matched} / {n}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", fontWeight: 700 }}>뒤집기</div>
          <div style={{ fontSize: "calc(22px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{moves}번</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12 }}>
        {deck.map((c, i) => {
          const up = c.flipped || c.matched;
          return (
            <button
              key={c.key}
              onClick={() => flip(i)}
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
