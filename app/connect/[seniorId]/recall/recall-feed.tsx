"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { formatKstHeader } from "@/lib/time";
import { addRecallQuestion, replyRecall } from "@/app/connect/[seniorId]/recall/actions";

export type FeedRow = {
  answerId: string;
  prompt: string;
  text: string | null;
  answeredAt: string;
  replyText: string | null;
};

export function RecallFeed({
  seniorId,
  seniorName,
  rows,
  questionCount,
}: {
  seniorId: string;
  seniorName: string;
  rows: FeedRow[];
  questionCount: number;
}) {
  const unreplied = rows.filter((r) => r.text && !r.replyText).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <AddQuestion seniorId={seniorId} questionCount={questionCount} />

      {unreplied > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#FFF6E9",
            border: "1px solid #FFE0B2",
            borderRadius: 16,
            padding: "12px 14px",
          }}
        >
          <Icon name="bell-fill" size={20} color="#FF9200" />
          <span style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 800, color: "#9C5800" }}>
            답장을 기다리는 이야기 {unreplied}개
          </span>
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <div
            style={{
              padding: "36px 22px",
              textAlign: "center",
              fontSize: "calc(16px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-sub)",
              lineHeight: 1.6,
            }}
          >
            아직 답변이 없어요.
            <br />
            {seniorName}님이 답하시면 여기에 쌓입니다.
          </div>
        </Card>
      ) : (
        rows.map((row) => <FeedItem key={row.answerId} seniorId={seniorId} row={row} />)
      )}
    </div>
  );
}

function FeedItem({ seniorId, row }: { seniorId: string; row: FeedRow }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();

  const send = () => {
    const text = reply.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await replyRecall({ seniorId, answerId: row.answerId, text });
      if (res.error) showToast(res.error);
      else {
        setReply("");
        showToast("답장을 보냈어요");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <div style={{ padding: "18px 20px" }}>
        <div
          style={{
            fontSize: "calc(13px*var(--fs))",
            fontWeight: 700,
            color: "var(--c-faint)",
            marginBottom: 6,
          }}
        >
          {formatKstHeader(new Date(row.answeredAt), "month-day")}
        </div>
        <div
          style={{
            fontSize: "calc(16px*var(--fs))",
            fontWeight: 800,
            color: "var(--c-sub)",
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          {row.prompt}
        </div>

        {row.text ? (
          <div
            style={{
              background: "var(--c-screen)",
              borderRadius: 16,
              padding: "14px 16px",
              fontSize: "calc(17px*var(--fs))",
              color: "var(--c-text)",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}
          >
            {row.text}
          </div>
        ) : (
          <div
            style={{
              fontSize: "calc(15px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-faint)",
              padding: "6px 0",
            }}
          >
            이 날은 건너뛰셨어요
          </div>
        )}

        {/* 답장 — 건너뛴 날은 답장할 게 없다 */}
        {row.text && (
          <div style={{ marginTop: 12 }}>
            {row.replyText ? (
              <div
                style={{
                  border: "1px solid #CDE3FF",
                  background: "#F2F8FF",
                  borderRadius: 16,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "calc(12px*var(--fs))",
                    fontWeight: 800,
                    color: "#0066FF",
                    marginBottom: 4,
                  }}
                >
                  내 답장
                </div>
                <div
                  style={{
                    fontSize: "calc(15px*var(--fs))",
                    color: "#123A6B",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {row.replyText}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder="답장 보내기"
                  aria-label="답장"
                  style={{
                    flex: 1,
                    border: "2px solid var(--c-line)",
                    borderRadius: 14,
                    padding: "0 14px",
                    height: 48,
                    fontSize: "calc(15px*var(--fs))",
                    fontFamily: "inherit",
                    background: "var(--c-card)",
                    color: "var(--c-text)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={send}
                  disabled={isPending || reply.trim().length === 0}
                  style={{
                    border: "none",
                    borderRadius: 14,
                    height: 48,
                    padding: "0 18px",
                    background: reply.trim().length === 0 ? "var(--c-line)" : "var(--c-primary)",
                    color: reply.trim().length === 0 ? "var(--c-faint)" : "#fff",
                    fontSize: "calc(15px*var(--fs))",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  보내기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function AddQuestion({ seniorId, questionCount }: { seniorId: string; questionCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [month, setMonth] = useState("");
  const [isPending, startTransition] = useTransition();

  const add = () => {
    const text = prompt.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await addRecallQuestion({
        seniorId,
        prompt: text,
        month: month ? Number(month) : null,
      });
      if (res.error) showToast(res.error);
      else {
        setPrompt("");
        setMonth("");
        setOpen(false);
        showToast("질문을 추가했어요");
        router.refresh();
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          border: "1px dashed #9EC5FF",
          background: "var(--c-card)",
          borderRadius: 18,
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "#0066FF",
          fontSize: "calc(15px*var(--fs))",
          fontWeight: 800,
        }}
      >
        <Icon name="pencil" size={20} color="#0066FF" />
        질문 추가 (지금 {questionCount}개)
      </button>
    );
  }

  return (
    <Card>
      <div style={{ padding: 16 }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예) 우리 집 마당에 있던 나무 기억나세요?"
          rows={3}
          aria-label="질문"
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "2px solid var(--c-line)",
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: "calc(15px*var(--fs))",
            lineHeight: 1.6,
            fontFamily: "inherit",
            background: "var(--c-card)",
            color: "var(--c-text)",
            outline: "none",
            resize: "none",
          }}
        />
        <div
          style={{
            fontSize: "calc(13px*var(--fs))",
            color: "var(--c-sub)",
            marginTop: 10,
            lineHeight: 1.55,
          }}
        >
          답을 맞히는 게 아니라 떠올리시게 하는 게 목적이에요. &ldquo;몇 년도에?&rdquo;보다
          &ldquo;어땠어요?&rdquo;가 좋습니다.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="제철 달"
            style={{
              border: "2px solid var(--c-line)",
              borderRadius: 14,
              height: 48,
              padding: "0 10px",
              fontSize: "calc(14px*var(--fs))",
              fontFamily: "inherit",
              background: "var(--c-card)",
              color: "var(--c-text)",
            }}
          >
            <option value="">아무 때나</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}월에 먼저
              </option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={isPending || prompt.trim().length === 0}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 14,
              height: 48,
              background: prompt.trim().length === 0 ? "var(--c-line)" : "var(--c-primary)",
              color: prompt.trim().length === 0 ? "var(--c-faint)" : "#fff",
              fontSize: "calc(15px*var(--fs))",
              fontWeight: 800,
            }}
          >
            추가
          </button>
          <button
            onClick={() => setOpen(false)}
            style={{
              border: "1px solid var(--c-line)",
              borderRadius: 14,
              height: 48,
              padding: "0 14px",
              background: "var(--c-card)",
              color: "var(--c-sub)",
              fontSize: "calc(14px*var(--fs))",
              fontWeight: 700,
            }}
          >
            취소
          </button>
        </div>
      </div>
    </Card>
  );
}
