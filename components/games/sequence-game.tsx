"use client";

import { useEffect, useRef, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { Card } from "@/components/ui/card";
import { getGame } from "@/lib/games/config";
import { seqPattern, SEQPADS } from "@/lib/games/engine";
import { levelMult, seqParams } from "@/lib/games/levels";

type Phase = "show" | "input" | "done";

/** 한 칸이 켜져 있는 시간(ms). */
const PAD_ON_MS = 560;
/** 다음 칸이 켜지기 전 꺼져 있는 시간(ms). 같은 칸 연속은 seqPattern 이 막는다. */
const PAD_GAP_MS = 240;

export function SequenceGame({
  level,
  onFinish,
}: {
  level: number;
  onFinish: (correct: number) => void;
}) {
  const meta = getGame("seq");
  const { rounds, startLen } = seqParams(level);
  const sub = `${level}단계 · 포인트 ${levelMult(level)}배`;

  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [pattern, setPattern] = useState<number[]>(() => seqPattern(startLen));
  const [input, setInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("show");
  const [active, setActive] = useState(-1);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 패턴이 바뀌면(= 새 라운드) 시퀀스를 점등한다.
  //
  // setState 는 전부 타이머 콜백 안에서만 호출한다. 이펙트 본문에서 동기로
  // 호출하면 cascading render 가 되고 react-hooks/set-state-in-effect 에 걸린다.
  // 그래서 상태 초기화(phase/input/active)는 라운드를 넘기는 tap 쪽에서 한다.
  // pattern 을 ref 로 우회하지 않고 그대로 의존성에 둔다 — 렌더 중 ref 를 쓰면
  // react-hooks/refs 에 걸리고, pattern 은 라운드가 넘어갈 때만 바뀌므로
  // [round] 와 결과가 같다.
  useEffect(() => {
    let i = 0;
    const step = () => {
      if (i >= pattern.length) {
        setPhase("input");
        return;
      }
      setActive(pattern[i]);
      const t1 = setTimeout(() => {
        setActive(-1);
        i++;
        const t2 = setTimeout(step, PAD_GAP_MS);
        timers.current.push(t2);
      }, PAD_ON_MS);
      timers.current.push(t1);
    };
    const t0 = setTimeout(step, 600);
    timers.current.push(t0);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [pattern]);

  const tap = (p: number) => {
    if (phase !== "input") return;
    const nextInput = [...input, p];
    const idx = nextInput.length - 1;

    if (pattern[idx] !== p) {
      // 틀림 → 종료
      setInput(nextInput);
      setPhase("done");
      const t = setTimeout(() => onFinish(correct), 700);
      timers.current.push(t);
      return;
    }

    if (nextInput.length === pattern.length) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      if (round + 1 >= rounds) {
        setPhase("done");
        const t = setTimeout(() => onFinish(nextCorrect), 500);
        timers.current.push(t);
        return;
      }
      // 다음 라운드: 길이 +1.
      // 상태 초기화를 여기서 한다(이펙트 본문에서 하면 lint 위반).
      setRound((r) => r + 1);
      setPattern(seqPattern(pattern.length + 1));
      setInput([]);
      setActive(-1);
      setPhase("show");
    } else {
      setInput(nextInput);
    }
  };

  return (
    <GameShell gameId="seq" sub={sub} roundLabel={null}>
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
