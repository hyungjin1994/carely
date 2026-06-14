import "server-only";

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getVapidConfig } from "@/lib/push/vapid";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const cfg = getVapidConfig();
  if (!cfg) return false;
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  configured = true;
  return true;
}

/**
 * 한 사용자의 모든 활성 구독에 푸시 발송. (admin 클라이언트 사용 — 크론)
 * notify_on 이 꺼져 있으면 건너뛰고, 404/410 구독은 정리한다.
 * 발송된 구독 수를 반환한다.
 */
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<number> {
  if (!ensureConfigured()) return 0;

  const { data: profile } = await admin
    .from("profiles")
    .select("notify_on")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || !profile.notify_on) return 0;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  const expired: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
        sent += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) expired.push(sub.id);
      }
    }),
  );

  if (expired.length) {
    await admin.from("push_subscriptions").delete().in("id", expired);
  }
  return sent;
}
