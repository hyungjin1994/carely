"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(patch: {
  name?: string;
  font_scale?: number;
  high_contrast?: boolean;
  notify_on?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const update: Record<string, unknown> = {};
  if (typeof patch.name === "string") {
    const n = patch.name.trim();
    if (n) update.name = n;
  }
  if (typeof patch.font_scale === "number") update.font_scale = patch.font_scale;
  if (typeof patch.high_contrast === "boolean") update.high_contrast = patch.high_contrast;
  if (typeof patch.notify_on === "boolean") update.notify_on = patch.notify_on;

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: "저장에 실패했어요" };

  revalidatePath("/settings");
  revalidatePath("/home");
  return { ok: true };
}
