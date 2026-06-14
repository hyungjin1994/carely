"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function approveExchange(id: string): Promise<ConnectState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_exchange", { p_id: id, p_approve: true });
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

export async function sendMessage(text: string): Promise<ConnectState> {
  const clean = text.trim();
  if (!clean) return { error: "내용을 적어주세요" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { data: link } = await supabase
    .from("family_links")
    .select("id")
    .eq("child_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!link) return { error: "먼저 어머니와 연결해 주세요" };

  const { error } = await supabase
    .from("messages")
    .insert({ family_id: link.id, from_id: user.id, text: clean });
  if (error) return { error: "전송에 실패했어요" };

  revalidatePath("/connect");
  return { ok: true };
}
