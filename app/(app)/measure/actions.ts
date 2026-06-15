"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MeasureState = { ok?: boolean; error?: string };

export async function addMeasurement(input: {
  kind: string;
  v1: number | null;
  v2?: number | null;
  v3?: number | null;
  memo?: string;
}): Promise<MeasureState> {
  if (input.v1 == null || Number.isNaN(input.v1)) return { error: "값을 입력해 주세요" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { error } = await supabase.from("measurements").insert({
    user_id: user.id,
    kind: input.kind,
    v1: input.v1,
    v2: input.v2 ?? null,
    v3: input.v3 ?? null,
    memo: input.memo?.trim() || null,
  });
  if (error) return { error: "저장에 실패했어요" };

  revalidatePath("/measure");
  revalidatePath("/connect");
  return { ok: true };
}
