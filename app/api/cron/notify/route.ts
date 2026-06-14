import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import { sendEmailFallback } from "@/lib/push/email";
import { isWithinDnd, nextMorningUtc } from "@/lib/push/dnd";

export const dynamic = "force-dynamic";

/**
 * 15분마다 실행 (Vercel cron). send_at 도래·미발송 알림을 발송한다.
 * 방해 금지(21:00~08:00 KST)면 다음 08:00 로 미룬다.
 * 푸시 실패 시 이메일 폴백.
 */
export async function GET(request: Request) {
  // Vercel cron 은 Authorization: Bearer $CRON_SECRET 헤더를 보낸다.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due } = await admin
    .from("notifications")
    .select("id, user_id, title, body, send_at")
    .eq("sent", false)
    .lte("send_at", nowIso)
    .limit(200);

  if (!due || due.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // 방해 금지 구간이면 전부 다음 아침으로 미룸
  if (isWithinDnd()) {
    const next = nextMorningUtc().toISOString();
    await admin
      .from("notifications")
      .update({ send_at: next })
      .in("id", due.map((d) => d.id));
    return NextResponse.json({ ok: true, deferred: due.length });
  }

  let pushed = 0;
  let emailed = 0;

  for (const n of due) {
    const sent = await sendPushToUser(admin, n.user_id, {
      title: n.title,
      body: n.body,
      url: "/home",
      tag: n.id,
    });
    if (sent > 0) {
      pushed += 1;
      await admin.from("notifications").update({ sent: true }).eq("id", n.id);
    } else {
      const ok = await sendEmailFallback(admin, n.user_id, n.title, n.body);
      if (ok) emailed += 1;
      // 푸시 구독이 없어도 무한 재시도하지 않도록 sent 처리
      await admin
        .from("notifications")
        .update({ sent: true, channel: ok ? "email" : "push" })
        .eq("id", n.id);
    }
  }

  return NextResponse.json({ ok: true, processed: due.length, pushed, emailed });
}
