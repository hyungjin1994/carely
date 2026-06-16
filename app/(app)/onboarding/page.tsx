import { ensureProfile } from "@/lib/auth/dal";
import { OnboardingView } from "./onboarding-view";

export default async function OnboardingPage() {
  const p = await ensureProfile();
  return (
    <OnboardingView
      initial={{
        birth_date: p.birth_date,
        gender: p.gender,
        height_cm: p.height_cm,
        weight_kg: p.weight_kg,
        wake_time: p.wake_time,
        sleep_time: p.sleep_time,
        meal_morning: p.meal_morning,
        meal_noon: p.meal_noon,
        meal_evening: p.meal_evening,
        exercise_time: p.exercise_time,
        conditions: p.conditions ?? [],
        allergies: p.allergies,
        living: p.living,
        emergency_name: p.emergency_name,
        emergency_phone: p.emergency_phone,
      }}
      onboarded={p.onboarded}
    />
  );
}
