"use client";

import { useEffect, useRef, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { Card } from "@/components/ui/card";
import { DIFF, getGame, type Difficulty } from "@/lib/games/config";
import { seqPattern, seqStartLen, SEQPADS } from "@/lib/games/engine";

type Phase = "show" | "input" | "done";

export function SequenceGame({
  difficulty,
  onFinish,
}: {
  difficulty: Difficulty;
  onFinish: (correct: number) => void;
}) {
  const meta = getGame("seq");
  const rounds = DIFF[difficulty].n.seq;

  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [pattern, setPattern] = useState<number[]>(() => seqPattern(seqStartLen(difficulty)));
  const [input, setInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("show");
  const [active, setActive] = useState(-1);

  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // 새 라운드마다 시퀀스 점등 후 입력 단계로.
  useEffect(() => {
    setPhase("show");
    setActive(-1);
    setInput([]);
    const pat = patternRef.current;
    let i = 0;
    const step = () => {
      if (i >= pat.length) {
        setPhase("input");
        return;
      }
      setActive(pat[i]);
      const t1 = setTimeout(() => {
        setActive(-1);
        i++;
        const t2 = setTimeout(step, 240);
        timers.current.push(t2);
      }, 560);
      timers.current.push(t1);
    };
    const t0 = setTimeout(step, 600);
    timers.current.push(t0);
    return clearTimers;
  }, [round]);

  const tap = (p: number) => {
    if (phase !== "input") return;
    const nextInput = [...input, p];
    const idx = nextInput.length - 1;

    if (patternRef.current[idx] !== p) {
      // 틀림 → 종료
      setInput(nextInput);
      setPhase("done");
      const t = setTimeout(() => onFinish(correct), 700);
      timers.current.push(t);
      return;
    }

    if (nextInput.length === patternRef.current.length) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      if (round + 1 >= rounds) {
        setPhase("done");
        const t = setTimeout(() => onFinish(nextCorrect), 500);
        timers.current.push(t);
        return;
      }
      // 다음 라운드: 길이 +1
      const newPattern = seqPattern(patternRef.current.length + 1);
      patternRef.current = newPattern;
      setPattern(newPattern);
      setRound((r) => r + 1);
    } else {
      setInput(nextInput);
    }
  };

  return (
    <GameShell gameId="seq" difficulty={difficulty} roundLabel={null}>
      <Card>
        <div style={{ padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: phase === "show" ? meta.color : "var(--c-text)" }}>
            {phase === "show" ? "잘 보세요..." : "순서대로 눌러요"}
          </div>
          <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 4 }}>
            {round + 1}단계 · {pattern.length}개
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
        {SEQPADS.map((p, i) => {
          const on = active === i;
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={phase !== "input"}
              style={{
                aspectRatio: "1/1",
                borderRadius: 22,
                border: "none",
                background: on ? p.lit : p.color,
                boxShadow: on ? `0 0 30px ${p.lit}` : "inset 0 -6px 0 rgba(0,0,0,.15)",
                transition: "all .12s",
                transform: on ? "scale(.97)" : "none",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18 }}>
        {pattern.map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: i < input.length ? meta.color : "var(--c-line)",
            }}
          />
        ))}
      </div>
    </GameShell>
  );
}
