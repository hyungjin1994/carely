"use client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type SubscribeResult = { ok: boolean; reason?: string };

/** 브라우저 푸시 구독 → 서버에 저장. 설정 "알림 켜기" 에서 호출. */
export async function subscribePush(): Promise<SubscribeResult> {
  if (typeof window === "undefined") return { ok: false, reason: "지원하지 않는 환경" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "이 기기는 알림을 지원하지 않아요" };
  }
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) return { ok: false, reason: "알림 설정이 준비되지 않았어요" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "알림 권한이 필요해요" };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) return { ok: false, reason: "구독 저장에 실패했어요" };
  return { ok: true };
}
