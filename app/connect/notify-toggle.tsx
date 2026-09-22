"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { subscribePush } from "@/lib/push/subscribe-client";
import { sendTestPush, setManagerNotify } from "@/app/connect/actions";

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

  // 이미 켜져 있으면 테스트 버튼만 작게 남긴다 — 실제로 오는지 확인할 수단이
  // 없으면 환전 신청이 들어와야 비로소 알게 된다.
  if (hidden || (notifyOn && subscribed)) {
    return <TestPushRow />;
  }

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

/**
 * 알림이 실제로 도착하는지 확인하는 버튼.
 * iOS 는 홈 화면에 추가해야 웹푸시가 되는데 그걸 모르고 "안 온다" 로 끝나기 쉽다.
 * 여기서 바로 확인되면 원인을 좁힐 수 있다.
 */
function TestPushRow() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const test = () =>
    startTransition(async () => {
      const res = await sendTestPush();
      if (res.error) showToast(res.error);
      else {
        setSent(true);
        showToast("보냈어요. 알림이 오는지 확인해 주세요");
      }
    });

  return (
    <button
      onClick={test}
      disabled={isPending || sent}
      style={{
        border: "1px solid var(--c-line)",
        background: "var(--c-card)",
        borderRadius: 14,
        padding: "10px 14px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "calc(13px*var(--fs))",
        fontWeight: 700,
        color: "var(--c-sub)",
      }}
    >
      <Icon name="bell" size={18} color="var(--c-faint)" />
      {sent ? "테스트 알림을 보냈어요" : "알림 테스트 보내기"}
    </button>
  );
}
