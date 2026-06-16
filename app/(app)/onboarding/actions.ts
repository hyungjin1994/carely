"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type OnboardingInput = {
  birth_date: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  wake_time: string | null;
  sleep_time: string | null;
  meal_morning: string | null;
  meal_noon: string | null;
  meal_evening: string | null;
  exercise_time: string | null;
  conditions: string[];
  allergies: string | null;
  living: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
};

export type OnboardingState = { ok?: boolean; error?: string };

const clean = (s: string | null) => {
  const t = (s ?? "").trim();
  return t ? t : null;
};

export async function saveOnboarding(input: OnboardingInput): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { error } = await supabase
    .from("profiles")
    .update({
      birth_date: clean(input.birth_date),
      gender: clean(input.gender),
      height_cm: input.height_cm,
      weight_kg: input.weight_kg,
      wake_time: clean(input.wake_time),
      sleep_time: clean(input.sleep_time),
      meal_morning: clean(input.meal_morning),
      meal_noon: clean(input.meal_noon),
      meal_evening: clean(input.meal_evening),
      exercise_time: clean(input.exercise_time),
      conditions: input.conditions.length ? input.conditions : null,
      allergies: clean(input.allergies),
      living: clean(input.living),
      emergency_name: clean(input.emergency_name),
      emergency_phone: clean(input.emergency_phone),
      onboarded: true,
    })
    .eq("id", user.id);
  if (error) return { error: "저장에 실패했어요" };

  revalidatePath("/home");
  revalidatePath("/settings");
  revalidatePath("/onboarding");
  return { ok: true };
}
