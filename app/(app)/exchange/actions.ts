"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  revalidatePath("/exchange");
  return { ok: true };
}
