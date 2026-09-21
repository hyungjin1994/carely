"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { completeTodayHabit } from "./actions";
import type { HabitStatus } from "@/lib/queries";

/**
 * 오늘의 한 가지.
 *
 * 인지 건강은 게임보다 생활 습관의 영향이 크다. 게임 6종은 인지 자극만 다루고
 * 운동·수면·사회적 교류 축이 비어 있어서 넣었다.
 *
 * 실천한 날은 카드를 숨기지 않고 "했어요" 상태로 남긴다 — 연속 일수를 보는 게
 * 다음 날 다시 하게 만드는 힘이라서다. (오늘의 질문 카드는 답하면 사라지지만
 * 그쪽은 답변 자체가 기록으로 남아 성격이 다르다.)
 */
export function HabitCard({ habit }: { habit: HabitStatus }) {
  const router = useRouter();
  const [done, setDone] = useState(habit.done);
  const [streak, setStreak] = useState(habit.streak);
  const [isPending, startTransition] = useTransition();

  const complete = () => {
    if (done || isPending) return;
    // 낙관적으로 먼저 바꾼다 — 누른 반응이 바로 보여야 한다.
    setDone(true);
    setStreak((s) => s + 1);
    startTransition(async () => {
      const res = await completeTodayHabit();
      if (res.error) {
        setDone(false);
        setStreak((s) => Math.max(0, s - 1));
        showToast(res.error);
        return;
      }
      if (res.awarded && res.awarded > 0) showToast(`${res.awarded}P 받았어요`);
      router.refresh();
    });
  };

  return (
    <div
      style={{
        background: "var(--c-card)",
        border: `1px solid ${done ? "var(--c-line)" : habit.color + "55"}`,
        borderRadius: 24,
        padding: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon name={habit.icon} size={20} color={habit.color} />
        <span style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 800, color: habit.color }}>
          오늘의 한 가지 · {habit.categoryLabel}
        </span>
        {streak >= 2 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "calc(12px*var(--fs))",
              fontWeight: 800,
              color: "#9C5800",
              background: "#FFF6E9",
              border: "1px solid #FFE0B2",
              padding: "4px 9px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {streak}일 연속
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: "calc(21px*var(--fs))",
          fontWeight: 800,
          color: "var(--c-text)",
          lineHeight: 1.45,
          letterSpacing: "-0.01em",
          textDecoration: done ? "line-through" : "none",
          opacity: done ? 0.45 : 1,
        }}
      >
        {habit.title}
      </div>

      {habit.why && !done && (
        <div
          style={{
            fontSize: "calc(14px*var(--fs))",
            color: "var(--c-sub)",
            lineHeight: 1.5,
            marginTop: 6,
          }}
        >
          {habit.why}
        </div>
      )}

      {done ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 14,
            height: 54,
            borderRadius: 16,
            background: "#EAFBF0",
            color: "#067A33",
            fontSize: "calc(17px*var(--fs))",
            fontWeight: 800,
          }}
        >
          <Icon name="circle-check-fill" size={24} color="#00A63E" />
          오늘 하셨어요
        </div>
      ) : (
        <button
          onClick={complete}
          disabled={isPending}
          style={{
            marginTop: 14,
            width: "100%",
            height: 54,
            border: "none",
            borderRadius: 16,
            background: habit.color,
            color: "#fff",
            fontSize: "calc(17px*var(--fs))",
            fontWeight: 800,
          }}
        >
          했어요
        </button>
      )}
    </div>
  );
}
