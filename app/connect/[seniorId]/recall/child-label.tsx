"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { fillChildLabel } from "@/lib/korean";
import { setChildLabel } from "@/app/connect/[seniorId]/recall/actions";

/** 어떻게 읽히는지 바로 보여준다. 조사가 붙는 문구 하나면 충분하다. */
const SAMPLE = "{자녀}이/가 좋아하는 음식이 뭘까요?";

/**
 * 자녀 호칭 설정.
 *
 * 질문 문구에는 `{자녀}` 자리표시자가 들어 있고 출제할 때 이 값으로 바뀐다.
 * 그래서 호칭을 바꾸면 이미 있는 질문 전부가 같이 바뀐다 — 문구를 고치는 게
 * 아니라서 답변 기록도 그대로다.
 *
 * 조사(이/가 · 을/를)는 받침 유무로 갈리므로 앱이 고른다. 관리자는 읽히는
 * 그대로만 적으면 된다 — "형진이" 라고 적으면 "형진이가", "아들" 은 "아들이".
 */
export function ChildLabel({
  seniorId,
  seniorName,
  current,
  fallback,
}: {
  seniorId: string;
  seniorName: string;
  /** DB 에 저장된 값. null 이면 아직 안 정한 것. */
  current: string | null;
  /** 안 정했을 때 실제로 쓰이는 호칭(관리자 이름 → "아이"). */
  fallback: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(current ?? "");
  const [isPending, startTransition] = useTransition();

  const inUse = current?.trim() || fallback;
  const preview = fillChildLabel(SAMPLE, label.trim() || fallback);

  const save = () => {
    startTransition(async () => {
      const res = await setChildLabel({ seniorId, label });
      if (res.error) showToast(res.error);
      else {
        setOpen(false);
        showToast("호칭을 바꿨어요");
        router.refresh();
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          border: "1px solid var(--c-line)",
          background: "var(--c-card)",
          borderRadius: 18,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textAlign: "left",
          width: "100%",
        }}
      >
        <Icon name="person" size={20} color="var(--c-sub)" />
        <span
          style={{
            flex: 1,
            fontSize: "calc(14px*var(--fs))",
            fontWeight: 700,
            color: "var(--c-sub)",
            lineHeight: 1.5,
          }}
        >
          질문에서 나를 부르는 말
          <span style={{ color: "var(--c-text)", fontWeight: 800 }}> · {inUse}</span>
          {!current?.trim() && (
            <span style={{ color: "var(--c-faint)", fontWeight: 700 }}> (기본값)</span>
          )}
        </span>
        <Icon name="chevron-right" size={18} color="var(--c-faint)" />
      </button>
    );
  }

  return (
    <Card>
      <div style={{ padding: 16 }}>
        <div
          style={{
            fontSize: "calc(15px*var(--fs))",
            fontWeight: 800,
            color: "var(--c-text)",
            marginBottom: 6,
          }}
        >
          질문에서 나를 부르는 말
        </div>
        <div
          style={{
            fontSize: "calc(13px*var(--fs))",
            color: "var(--c-sub)",
            lineHeight: 1.55,
            marginBottom: 12,
          }}
        >
          {seniorName}님께 읽히는 그대로 적어주세요. 조사는 앱이 알아서 붙입니다.
        </div>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
          placeholder={fallback}
          maxLength={20}
          aria-label="자녀 호칭"
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "2px solid var(--c-line)",
            borderRadius: 14,
            height: 52,
            padding: "0 14px",
            fontSize: "calc(17px*var(--fs))",
            fontWeight: 700,
            fontFamily: "inherit",
            background: "var(--c-card)",
            color: "var(--c-text)",
            outline: "none",
          }}
        />

        <div
          style={{
            background: "var(--c-screen)",
            borderRadius: 14,
            padding: "12px 14px",
            marginTop: 10,
          }}
        >
          <div
            style={{
              fontSize: "calc(12px*var(--fs))",
              fontWeight: 800,
              color: "var(--c-faint)",
              marginBottom: 4,
            }}
          >
            이렇게 보여요
          </div>
          <div
            style={{
              fontSize: "calc(16px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-text)",
              lineHeight: 1.5,
            }}
          >
            {preview}
          </div>
        </div>

        <div
          style={{
            fontSize: "calc(13px*var(--fs))",
            color: "var(--c-faint)",
            lineHeight: 1.55,
            marginTop: 10,
          }}
        >
          이름으로 하시려면 &ldquo;형진&rdquo; 이 아니라 &ldquo;형진이&rdquo; 처럼 부르시는 대로
          적어주세요. &ldquo;아들&rdquo; · &ldquo;큰딸&rdquo; 도 됩니다.
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={save}
            disabled={isPending}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 14,
              height: 48,
              background: "var(--c-primary)",
              color: "#fff",
              fontSize: "calc(15px*var(--fs))",
              fontWeight: 800,
            }}
          >
            저장
          </button>
          <button
            onClick={() => {
              setLabel(current ?? "");
              setOpen(false);
            }}
            style={{
              border: "1px solid var(--c-line)",
              borderRadius: 14,
              height: 48,
              padding: "0 16px",
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
