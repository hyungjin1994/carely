"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerRecall } from "@/app/(app)/recall/actions";
import { showToast } from "@/components/common/toast";

/**
 * 답변 입력. 큰 글씨·넉넉한 높이로 고령자 입력을 배려한다.
 * 정답이 없는 질문이므로 "맞았다/틀렸다"를 절대 표시하지 않는다.
 */
export function AnswerForm({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const send = (body: string) =>
    startTransition(async () => {
      const res = await answerRecall({ questionId, text: body });
      if (res.error) showToast(res.error);
      else router.refresh();
    });

  return (
    <div style={{ marginTop: 18 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="기억나는 대로 편하게 적어주세요"
        rows={6}
        aria-label="답변"
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "2px solid var(--c-line)",
          borderRadius: 18,
          padding: "16px 18px",
          fontSize: "calc(19px*var(--fs))",
          lineHeight: 1.6,
          fontFamily: "inherit",
          background: "var(--c-card)",
          color: "var(--c-text)",
          outline: "none",
          resize: "none",
        }}
      />

      <button
        onClick={() => send(text)}
        disabled={isPending || text.trim().length === 0}
        style={{
          marginTop: 14,
          width: "100%",
          border: "none",
          borderRadius: 18,
          height: 64,
          background: text.trim().length === 0 ? "var(--c-line)" : "var(--c-primary)",
          color: text.trim().length === 0 ? "var(--c-faint)" : "#fff",
          fontSize: "calc(19px*var(--fs))",
          fontWeight: 800,
        }}
      >
        {isPending ? "보내는 중" : "보내기"}
      </button>

      {/* 건너뛰기는 눈에 덜 띄게. 하지만 반드시 있어야 한다 —
          답을 강요받는 느낌이 들면 기능 자체를 피하게 된다. */}
      <button
        onClick={() => send("")}
        disabled={isPending}
        style={{
          marginTop: 10,
          width: "100%",
          border: "none",
          background: "transparent",
          padding: "12px 0",
          fontSize: "calc(16px*var(--fs))",
          fontWeight: 700,
          color: "var(--c-sub)",
        }}
      >
        오늘은 건너뛸게요
      </button>
    </div>
  );
}
