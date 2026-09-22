"use client";

/**
 * 브라우저 푸시 구독 → 서버에 저장.
 *
 * ⚠️ 이 함수는 **절대 throw 하지 않는다.** 전에는 try/catch 가 없어서
 * 예외가 호출부의 startTransition 밖으로 새어 나갔고, iOS 표준형(PWA)에서는
 * "This page couldn't load" 로 앱이 죽었다. 터질 수 있는 곳이 셋이었다.
 *   · atob()                     VAPID 키에 공백·개선이 섞이면 InvalidCharacterError
 *   · Notification.requestPermission()  iOS Safari 탭에서는 Notification 이 없음
 *   · pushManager.subscribe()     NotAllowedError · AbortError 로 reject
 *
 * 실패는 전부 { ok: false, reason } 으로 돌려준다. reason 은 사용자가 조치할 수
 * 있는 문구여야 한다 — "권한을 허용해 주세요", "홈 화면에 추가해 주세요" 처럼.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type SubscribeResult = { ok: boolean; reason?: string };

/** iOS 는 홈 화면에 추가(표준형 실행)해야 웹푸시가 된다. Safari 탭에서는 안 된다. */
function isIosSafariTab(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
  if (!isIos) return false;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return !standalone;
}

export async function subscribePush(): Promise<SubscribeResult> {
  try {
    if (typeof window === "undefined") return { ok: false, reason: "지원하지 않는 환경이에요" };

    if (isIosSafariTab()) {
      return {
        ok: false,
        reason: "아이폰은 공유 → 홈 화면에 추가 하고 그 아이콘으로 들어와야 알림을 받을 수 있어요",
      };
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return { ok: false, reason: "이 기기는 알림을 지원하지 않아요" };
    }

    const raw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!raw) return { ok: false, reason: "알림 설정이 준비되지 않았어요" };
    // 환경변수를 붙여넣을 때 앞뒤 공백·개선이 섞이는 일이 흔하다. atob 이 그걸로 터진다.
    const vapid = raw.trim().replace(/\s/g, "");

    // 진단 가능한 메시지를 준다. 여기서 막히면 원인이 환경변수 값 하나뿐인데,
    // "올바르지 않아요" 만으로는 무엇이 틀렸는지 알 수 없다.
    //   공개키 = base64url 87자 → 디코딩하면 P-256 언압축 65바이트, 'B' 로 시작
    //   개인키 = 43자. 이걸 NEXT_PUBLIC_VAPID_PUBLIC_KEY 에 넣는 실수가 가장 흔하다.
    const keyHint = `${vapid.length}자, ${vapid.slice(0, 4)}…`;

    let appKey: Uint8Array;
    try {
      appKey = urlBase64ToUint8Array(vapid);
    } catch {
      return { ok: false, reason: `알림 키를 읽을 수 없어요 (${keyHint})` };
    }
    if (appKey.byteLength !== 65) {
      return {
        ok: false,
        reason: `알림 키가 짧아요. 공개키는 87자인데 지금 ${keyHint} — 개인키를 넣으셨을 수 있어요`,
      };
    }

    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch {
      return { ok: false, reason: "알림 권한을 확인할 수 없어요" };
    }
    if (permission === "denied") {
      return { ok: false, reason: "알림이 차단되어 있어요. 브라우저 설정에서 허용해 주세요" };
    }
    if (permission !== "granted") return { ok: false, reason: "알림 권한이 필요해요" };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appKey as BufferSource,
        });
      } catch {
        // 키가 이전 구독과 다르면 InvalidStateError 가 난다. 기존 구독을 지우고 재시도.
        const old = await reg.pushManager.getSubscription();
        if (old) await old.unsubscribe().catch(() => {});
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appKey as BufferSource,
          });
        } catch {
          return { ok: false, reason: "알림을 등록할 수 없었어요. 잠시 뒤 다시 해주세요" };
        }
      }
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    if (!res.ok) return { ok: false, reason: "구독 저장에 실패했어요" };
    return { ok: true };
  } catch {
    // 여기까지 오면 예상 못 한 예외다. 그래도 앱은 죽지 않아야 한다.
    return { ok: false, reason: "알림을 켤 수 없었어요" };
  }
}
