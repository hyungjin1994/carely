"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { formatKstHeader } from "@/lib/time";
import { markAllNoticesRead, markNoticeRead } from "@/app/connect/actions";
import type { UnreadNotice } from "@/lib/queries";

/** 알림 종류별 색·아이콘. 환전은 돈이 걸려 있어 가장 눈에 띄게. */
const KIND_STYLE: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  exchange: { color: "#9C5800", bg: "#FFF6E9", border: "#FFE0B2", icon: "coins-fill" },
};
const DEFAULT_STYLE = { color: "#123A6B", bg: "#F2F8FF", border: "#CDE3FF", icon: "bell-fill" };

/**
 * 확인하지 않은 알림을 /connect 맨 위에 띄운다.
 *
 * 푸시(VAPID)가 배포 환경에 설정돼 있지 않아 휴대폰 알림은 오지 않는다.
 * 그래서 앱을 열었을 때 놓칠 수 없게 최상단에 둔다 — 어머니가 환전을 신청하면
 * 돈을 기다리는 상황이므로 며칠 방치되면 곤란하다.
 */
export function NoticeBanner({ notices }: { notices: UnreadNotice[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (notices.length === 0) return null;

  const act = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) showToast(res.error);
      else router.refresh();
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
      {notices.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, fontSize: "calc(15px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>
            확인할 알림 {notices.length}개
          </span>
          <button
            onClick={() => act(markAllNoticesRead)}
            disabled={isPending}
            style={{
              border: "1px solid var(--c-line)",
              background: "var(--c-card)",
              borderRadius: 12,
              padding: "8px 12px",
              fontSize: "calc(13px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-sub)",
            }}
          >
            모두 확인
          </button>
        </div>
      )}

      {notices.map((n) => {
        const st = KIND_STYLE[n.kind] ?? DEFAULT_STYLE;
        return (
          <div
            key={n.id}
            style={{
              background: st.bg,
              border: `1px solid ${st.border}`,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name={st.icon} size={20} color={st.color} />
              <span style={{ flex: 1, fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: st.color }}>
                {n.title}
              </span>
              <span style={{ fontSize: "calc(12px*var(--fs))", fontWeight: 700, color: st.color, opacity: 0.7 }}>
                {formatKstHeader(new Date(n.at), "month-day")}
              </span>
            </div>
            <div style={{ fontSize: "calc(15px*var(--fs))", color: st.color, lineHeight: 1.55 }}>
              {n.body}
            </div>
            <button
              onClick={() => act(() => markNoticeRead(n.id))}
              disabled={isPending}
              style={{
                marginTop: 12,
                width: "100%",
                border: "none",
                borderRadius: 14,
                height: 48,
                background: st.color,
                color: "#fff",
                fontSize: "calc(15px*var(--fs))",
                fontWeight: 800,
              }}
            >
              확인했어요
            </button>
          </div>
        );
      })}
    </div>
  );
}
