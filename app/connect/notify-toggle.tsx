"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { subscribePush } from "@/lib/push/subscribe-client";
import { setManagerNotify } from "@/app/connect/actions";

/**
 * 관리자 알림 켜기.
 *
 * 왜 여기 있나: 알림 켜기 UI 가 (app)/settings 에만 있었고, (app)/layout 은
 * requireSenior() 라 관리자는 /connect 로 리다이렉트된다. 즉 관리자는 푸시
 * 구독을 할 방법이 아예 없었다 — 환경변수를 넣어도 보낼 대상이 없다.
 * 관리자에게는 설정 화면이 없으므로 대시보드에 직접 둔다.
 *
 * 이미 켜져 있으면 표시하지 않는다. 자리만 차지하므로.
 */
export function NotifyToggle({ notifyOn, subscribed }: { notifyOn: boolean; subscribed: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  if (hidden || (notifyOn && subscribed)) return null;

  const enable = () => {
    startTransition(async () => {
      // 브라우저 권한 → 구독 저장. 실패 이유를 그대로 보여준다 —
      // "지원하지 않는 기기", "권한 거부" 등 사용자가 조치할 수 있는 것들이다.
      const res = await subscribePush();
      if (!res.ok) {
        showToast(res.reason ?? "알림을 켤 수 없어요");
        return;
      }
      await setManagerNotify(true);
      setHidden(true);
      showToast("알림을 켰어요");
      router.refresh();
    });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#FFF6E9",
        border: "1px solid #FFE0B2",
        borderRadius: 18,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: "#FF9200",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="bell-fill" size={22} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 800, color: "#9C5800" }}>
          알림을 켜두세요
        </div>
        <div style={{ fontSize: "calc(13px*var(--fs))", color: "#B87514", marginTop: 2, lineHeight: 1.45 }}>
          환전 신청이 들어오면 바로 알려드려요
        </div>
      </div>
      <button
        onClick={enable}
        disabled={isPending}
        style={{
          border: "none",
          borderRadius: 12,
          height: 44,
          padding: "0 16px",
          background: "#FF9200",
          color: "#fff",
          fontSize: "calc(14px*var(--fs))",
          fontWeight: 800,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        켜기
      </button>
    </div>
  );
}
