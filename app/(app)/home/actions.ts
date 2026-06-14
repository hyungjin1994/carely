"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleMedDose(id: string, taken: boolean) {
  const supabase = await createClient();
  await supabase.from("med_doses").update({ taken }).eq("id", id);
  revalidatePath("/home");
}

export async function toggleEventDone(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("events").update({ done }).eq("id", id);
  revalidatePath("/home");
  revalidatePath("/calendar");
}
