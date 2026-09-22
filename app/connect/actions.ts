"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import { kstWeekStart } from "@/lib/time";
import { getWeeklyReport, weeklyDigest } from "@/lib/weekly/queries";

export type ConnectState = { ok?: boolean; error?: string };

export async function redeemConnectCode(code: string): Promise<ConnectState> {
  const clean = code.trim().toUpperCase();
  if (clean.length < 4) return { error: "코드 4자리를 입력하세요" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_connect_code", { p_code: clean });
  if (error) {
    const map: Record<string, string> = {
      invalid_code: "코드가 올바르지 않거나 만료됐어요",
      cannot_link_self: "본인 코드는 사용할 수 없어요",
    };
    return { error: map[error.message] ?? "연결에 실패했어요" };
  }
  revalidatePath("/connect");
  return { ok: true };
}

/** 환전 완료 — 입금을 마친 뒤 누른다. 상태 done + 어르신 포인트 차감(RPC). */
export async function completeExchange(id: string): Promise<ConnectState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_exchange", { p_id: id });
  if (error) return { error: "처리에 실패했어요" };
  revalidatePath("/connect");
  return { ok: true };
}

export async function rejectExchange(id: string): Promise<ConnectState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_exchange", { p_id: id, p_approve: false });
  if (error) return { error: "처리에 실패했어요" };
  revalidatePath("/connect");
  return { ok: true };
}

/** 특정 어르신(familyId = family_links.id)에게 메시지 전송. RLS 가 멤버십 검증. */
export async function sendMessage(familyId: string, text: string): Promise<ConnectState> {
  const clean = text.trim();
  if (!clean) return { error: "내용을 적어주세요" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { error } = await supabase
    .from("messages")
    .insert({ family_id: familyId, from_id: user.id, text: clean });
  if (error) return { error: "전송에 실패했어요" };

  revalidatePath("/connect");
  return { ok: true };
}

/** 알림 확인 처리. 본인 알림만 (notifications_update_self, 0018). */
export async function markNoticeRead(id: string): Promise<ConnectState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) return { error: "확인 처리에 실패했어요" };
  revalidatePath("/connect");
  return { ok: true };
}

/** 쌓인 알림을 한 번에 확인 처리. */
export async function markAllNoticesRead(): Promise<ConnectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return { error: "확인 처리에 실패했어요" };
  revalidatePath("/connect");
  return { ok: true };
}

/**
 * 관리자 알림 수신 여부. sendPushToUser 가 profiles.notify_on 을 보고
 * 꺼져 있으면 건너뛰므로, 구독만 해두고 이 값이 false 면 푸시가 안 간다.
 */
export async function setManagerNotify(on: boolean): Promise<ConnectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };
  const { error } = await supabase.from("profiles").update({ notify_on: on }).eq("id", user.id);
  if (error) return { error: "설정을 저장하지 못했어요" };
  revalidatePath("/connect");
  return { ok: true };
}

/**
 * 테스트 알림. 알림을 켠 뒤 실제로 오는지 확인할 수단이 없으면
 * 환전 신청이 들어와야 비로소 알게 된다 — 그때는 이미 늦다.
 *
 * 자기 자신에게만 보낸다. admin 클라이언트를 쓰는 이유는 sendPushToUser 가
 * push_subscriptions 를 읽어야 하고 그 조회에 service-role 이 필요하기 때문이다.
 */
export async function sendTestPush(): Promise<ConnectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  try {
    const admin = createAdminClient();
    const sent = await sendPushToUser(admin, user.id, {
      title: "Carely 테스트 알림",
      body: "알림이 잘 오고 있어요. 이제 환전 신청이 들어오면 바로 알려드려요.",
      url: "/connect",
      tag: "test",
    });
    if (sent === 0) {
      // 구독이 없거나 notify_on 이 꺼져 있거나 VAPID 키가 없는 경우.
      return { error: "보낼 수 없었어요. 알림을 켰는지, 홈 화면에 추가했는지 확인해 주세요" };
    }
    return { ok: true };
  } catch {
    return { error: "알림 설정이 준비되지 않았어요" };
  }
}

/**
 * 자녀가 어머니보다 먼저 /connect 를 열었을 때의 주간 리포트 폴백.
 *
 * 평소에는 어머니가 시트를 확인할 때 만들어진다(home/actions.ts confirmWeekly).
 * 어머니가 그 주에 앱을 안 열면 자녀도 못 보게 되므로 여기서도 만든다.
 * 이미 있으면 아무 일도 하지 않는다 — 배너가 그대로 뜬다.
 * 자녀는 지금 앱을 보고 있으므로 푸시는 보내지 않는다.
 */
export async function ensureWeeklyNotice(seniorId: string, seniorName: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const weekStart = kstWeekStart();
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "weekly")
    .gte("send_at", `${weekStart}T00:00:00+09:00`)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  try {
    const report = await getWeeklyReport(seniorId);
    const { title, body } = weeklyDigest(seniorName, report);
    await supabase
      .from("notifications")
      .insert({ user_id: user.id, kind: "weekly", title, body, send_at: new Date().toISOString(), sent: true });
  } catch {
    // 집계 실패 — 다음 진입에 다시 시도된다.
  }
}
