"use client";

import { useEffect, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { Card } from "@/components/ui/card";
import { DIFF, STROOP, type Difficulty } from "@/lib/games/config";
import { stroopRound, type StroopRound } from "@/lib/games/engine";

/**
 * 색깔 맞추기(스트룹).
 *
 * 글자가 뜻하는 색이 아니라 **글자가 칠해진 색**을 고른다.
 * 보통·어려움에는 문제당 제한 시간이 있다 — 스트룹은 속도 과제여서 천천히
 * 추론하면 간섭이 사라진다(설계 의도는 config.ts STROOP 참고).
 * 시간이 지나면 그 문제만 못 맞힌 것으로 하고 넘어간다. 실패 화면은 없다.
 */
export function StroopGame({
  difficulty,
  onFinish,
}: {
  difficulty: Difficulty;
  onFinish: (correct: number) => void;
}) {
  const n = DIFF[difficulty].n.stroop;
  const limitMs = STROOP.limitMs[difficulty];

  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [leftMs, setLeftMs] = useState(limitMs);
  const [cur, setCur] = useState<StroopRound>(() => stroopRound(difficulty));

  // 제한 시간 카운트. 답하면(answered) 멈춘다.
  // setState 는 인터벌 콜백 안에서만 호출한다 — 이펙트 본문의 동기 호출은
  // cascading render 가 되고 lint 규칙에도 걸린다.
  useEffect(() => {
    if (limitMs <= 0 || answered) return;
    const startedAt = Date.now();
    const iv = setInterval(() => {
      const left = limitMs - (Date.now() - startedAt);
      if (left > 0) {
        setLeftMs(left);
        return;
      }
      // 시간 초과 — 고른 것 없이 정답만 보여주고 넘어간다.
      setLeftMs(0);
      setSel(null);
      setAnswered(true);
    }, 100);
    return () => clearInterval(iv);
  }, [round, limitMs, answered]);

  // 정오를 잠깐 보여준 뒤 자동으로 다음 문제. 속도 과제라 버튼을 한 번 더
  // 누르게 하면 리듬이 끊긴다.
  useEffect(() => {
    if (!answered) return;
    const t = setTimeout(() => {
      if (round + 1 >= n) {
        onFinish(correct);
        return;
      }
      setRound((r) => r + 1);
      setCur(stroopRound(difficulty));
      setSel(null);
      setAnswered(false);
      setLeftMs(limitMs);
    }, STROOP.revealMs);
    return () => clearTimeout(t);
  }, [answered, round, n, correct, difficulty, limitMs, onFinish]);

  const pick = (i: number) => {
    if (answered) return;
    setSel(i);
    setAnswered(true);
    if (cur.opts[i].hex === cur.ink.hex) setCorrect((c) => c + 1);
  };

  const ratio = limitMs > 0 ? Math.max(0, leftMs / limitMs) : 1;
  const barColor = ratio <= STROOP.warnRatio ? "#E52222" : cur.ink.hex;
  // 보기 개수가 홀수면 마지막 칸이 한 줄을 다 쓰게 해서 빈자리를 없앤다.
  const cols = cur.opts.length >= 4 ? 2 : 1;

  return (
    <GameShell gameId="stroop" difficulty={difficulty} roundLabel={`${round + 1} / ${n}`}>
      <Card>
        <div style={{ padding: "34px 22px", textAlign: "center" }}>
          <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-sub)", fontWeight: 700, marginBottom: 16 }}>
            글자의 색깔을 고르세요
          </div>
          <div style={{ fontSize: "calc(56px*var(--fs))", fontWeight: 800, color: cur.ink.hex, letterSpacing: "-0.01em" }}>
            {cur.word}
          </div>
        </div>
      </Card>

      {/* 남은 시간. 숫자 대신 줄어드는 막대로 — 숫자는 조급함을 키운다. */}
      {limitMs > 0 && (
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "var(--c-line)",
            overflow: "hidden",
            marginTop: 14,
          }}
        >
          <div
            style={{
              width: `${ratio * 100}%`,
              height: "100%",
              borderRadius: 999,
              background: barColor,
              transition: answered ? "none" : "width .1s linear",
            }}
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, marginTop: 16 }}>
        {cur.opts.map((col, i) => {
          const picked = sel === i;
          const isInk = col.hex === cur.ink.hex;
          const showState = answered && (picked || isInk);
          const lastOdd = cols === 2 && cur.opts.length % 2 === 1 && i === cur.opts.length - 1;
          return (
            <button
              key={col.hex}
              onClick={() => pick(i)}
              disabled={answered}
              style={{
                gridColumn: lastOdd ? "span 2" : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                height: 72,
                borderRadius: 18,
                border: "2px solid " + (showState ? (isInk ? "#00A63E" : "#E52222") : "var(--c-line)"),
                background: "var(--c-card)",
                fontSize: "calc(18px*var(--fs))",
                fontWeight: 800,
                color: "var(--c-text)",
              }}
            >
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: col.hex, flexShrink: 0 }} />
              {col.name}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
