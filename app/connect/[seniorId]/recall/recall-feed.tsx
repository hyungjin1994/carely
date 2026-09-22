"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { formatKstHeader } from "@/lib/time";
import { addRecallQuestion, replyRecall } from "@/app/connect/[seniorId]/recall/actions";
import type { AlbumPhoto } from "@/lib/recall/queries";

export type FeedRow = {
  answerId: string;
  prompt: string;
  text: string | null;
  answeredAt: string;
  replyText: string | null;
  /** 사진 질문이면 서명 URL. */
  photoUrl: string | null;
};

export function RecallFeed({
  seniorId,
  seniorName,
  rows,
  questionCount,
  photos,
}: {
  seniorId: string;
  seniorName: string;
  rows: FeedRow[];
  questionCount: number;
  photos: AlbumPhoto[];
}) {
  const unreplied = rows.filter((r) => r.text && !r.replyText).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <AddQuestion seniorId={seniorId} questionCount={questionCount} photos={photos} />

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

        {/* 사진 질문이었다면 어떤 사진을 보고 답하신 건지 같이 보여준다 */}
        {row.photoUrl && (
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "4 / 3",
              borderRadius: 14,
              overflow: "hidden",
              background: "var(--c-screen)",
              marginBottom: 12,
            }}
          >
            <Image
              src={row.photoUrl}
              alt=""
              fill
              sizes="(max-width: 600px) 100vw, 600px"
              unoptimized
              style={{ objectFit: "cover" }}
            />
          </div>
        )}

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

/**
 * 사진을 고르면 권하는 문구.
 *
 * 사진 앞에서는 "무엇을" 묻는 질문이 제일 잘 열린다. 사진이 이미 단서를 다
 * 주고 있어서 실패할 수가 없고, 답이 한 단어로 끝나지 않는다.
 * 연도·나이처럼 틀릴 수 있는 것은 넣지 않았다.
 */
const PHOTO_PROMPTS = [
  "이 사진, 어디서 찍은 거예요?",
  "이날 무슨 일이 있었어요?",
  "이 사진에 누가 있어요?",
  "이 사진 보면 뭐가 제일 먼저 떠올라요?",
  "이날 기분이 어떠셨어요?",
];

function AddQuestion({
  seniorId,
  questionCount,
  photos,
}: {
  seniorId: string;
  questionCount: number;
  photos: AlbumPhoto[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [month, setMonth] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const add = () => {
    const text = prompt.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await addRecallQuestion({
        seniorId,
        prompt: text,
        month: month ? Number(month) : null,
        photoId,
      });
      if (res.error) showToast(res.error);
      else {
        setPrompt("");
        setMonth("");
        setPhotoId(null);
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
        {photos.length > 0 ? "질문 · 사진 추가" : "질문 추가"} (지금 {questionCount}개)
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
        {/* ── 사진 붙이기 ── */}
        {photos.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "calc(13px*var(--fs))",
                fontWeight: 800,
                color: "var(--c-sub)",
                marginBottom: 8,
              }}
            >
              <Icon name="heart-fill" size={16} color="#E846CD" />
              사진과 함께 묻기 {photoId && <span style={{ color: "#E846CD" }}>· 1장 선택</span>}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                // 스크롤 영역이 카드 안쪽 여백을 넘어 끝까지 흐르게
                marginInline: -16,
                paddingInline: 16,
              }}
            >
              {photos.map((p) => {
                const picked = p.id === photoId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const next = picked ? null : p.id;
                      setPhotoId(next);
                      // 사진을 처음 고를 때 문구가 비어 있으면 첫 권장 문구를 넣어
                      // 준다. 사진만 고르고 뭘 물을지 막히는 게 가장 흔하다.
                      if (next && !prompt.trim()) setPrompt(PHOTO_PROMPTS[0]);
                    }}
                    aria-label={p.caption ?? "사진"}
                    aria-pressed={picked}
                    style={{
                      position: "relative",
                      flexShrink: 0,
                      width: 84,
                      height: 84,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: picked ? "3px solid #E846CD" : "1px solid var(--c-line)",
                      background: "var(--c-screen)",
                      padding: 0,
                    }}
                  >
                    {p.url && (
                      <Image
                        src={p.url}
                        alt=""
                        fill
                        sizes="84px"
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 사진을 골랐을 때만 권장 문구를 보여준다. 글 질문에는 도움이 안 된다. */}
        {photoId && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {PHOTO_PROMPTS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                style={{
                  border: prompt === s ? "1px solid #E846CD" : "1px solid var(--c-line)",
                  background: prompt === s ? "#FFF0FB" : "var(--c-card)",
                  color: prompt === s ? "#B4189A" : "var(--c-sub)",
                  borderRadius: 999,
                  padding: "7px 12px",
                  fontSize: "calc(13px*var(--fs))",
                  fontWeight: 700,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

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
          <br />
          나를 가리킬 때는 <code>{"{자녀}"}</code> 라고 적으면 위에서 정한 호칭으로 바뀝니다.
          조사가 붙는 자리는 <code>{"{자녀}이/가"}</code> 처럼 적어주세요.
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
