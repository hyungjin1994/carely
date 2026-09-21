"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser, type PushPayload } from "@/lib/push/send";
import { getBalance } from "@/lib/queries";

export type ExchangeActionState = { ok?: boolean; error?: string };

export async function requestExchange(amount: number): Promise<ExchangeActionState> {
  const allowed = [10000, 30000, 50000];
  if (!allowed.includes(amount)) return { error: "금액을 확인해 주세요" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  // 사용 가능 잔액 = 잔액 - 아직 완료되지 않은 대기 신청액 (초과 신청 차단)
  const balance = await getBalance();
  const { data: pendings } = await supabase
    .from("exchange_requests")
    .select("amount")
    .eq("user_id", user.id)
    .eq("status", "pending");
  const reserved = (pendings ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
  if (balance - reserved < amount) return { error: "사용 가능한 포인트가 부족해요" };

  const { error } = await supabase
    .from("exchange_requests")
    .insert({ user_id: user.id, amount, status: "pending" });
  if (error) return { error: "신청에 실패했어요" };

  const title = "환전 신청이 들어왔어요";
  const body = `${amount.toLocaleString("ko-KR")}원 환전을 신청했어요. 확인해 주세요.`;

  // 앱 내 알림. RLS 가 본인 앞으로만 insert 를 허용하므로 SECURITY DEFINER
  // RPC 로 넣는다 (0018). 이 행은 sent=true 로 들어가 크론이 재발송하지 않는다 (0020).
  //
  // 알림 실패로 신청을 되돌리지는 않는다 — 신청은 이미 접수됐고 자녀 대시보드의
  // 대기 목록에도 그대로 보인다.
  await supabase.rpc("notify_managers", { p_kind: "exchange", p_title: title, p_body: body });
  await pushToManagers(user.id, { title, body, url: "/connect", tag: "exchange" });

  revalidatePath("/exchange");
  return { ok: true };
}

/**
 * 연결된 자녀에게 지금 바로 푸시를 보낸다.
 *
 * 크론을 거치지 않는 이유: Vercel 무료 플랜은 크론이 하루 1회라(vercel.json)
 * 예약 발송에 맡기면 최대 13시간 늦는다. 사건 발생 시점에 보내면 되는 알림은
 * 크론이 필요 없고, 이렇게 하면 무료로 즉시 도착한다.
 *
 * VAPID 키가 없거나 구독이 없으면 sendPushToUser 가 0 을 돌려주고 조용히 끝난다.
 * 그래도 앱 내 알림 배너는 그대로 뜨므로 기능이 죽지 않는다.
 */
async function pushToManagers(seniorId: string, payload: PushPayload): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: links } = await admin
      .from("family_links")
      .select("manager_id")
      .eq("senior_id", seniorId)
      .eq("status", "active");
    await Promise.all(
      (links ?? []).map((l) => sendPushToUser(admin, l.manager_id, payload)),
    );
  } catch {
    // 서비스 키 미설정 등 — 알림 배너로 대체되므로 조용히 넘어간다.
  }
}
