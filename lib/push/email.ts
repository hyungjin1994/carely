import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 푸시 실패 시 이메일 폴백 (Resend). RESEND_API_KEY 없으면 no-op.
 * 사용자 이메일은 admin auth API 로 조회.
 */
export async function sendEmailFallback(
  admin: SupabaseClient,
  userId: string,
  subject: string,
  body: string,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const { data } = await admin.auth.admin.getUserById(userId);
  const email = data.user?.email;
  if (!email) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.VAPID_SUBJECT?.replace("mailto:", "") ?? "Carely <noreply@carely.app>",
        to: email,
        subject,
        text: body,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
