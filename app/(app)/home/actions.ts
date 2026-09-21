"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatKstIsoDate } from "@/lib/time";
import { HABIT_POINTS, todayHabit } from "@/lib/habits";

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

/**
 * 오늘의 한 가지 실천 처리.
 *
 * 행동 id 는 클라에서 받지 않는다 — 날짜로 결정되므로 서버가 직접 구한다.
 * 하루 한 건은 daily_habits 의 PK(user_id, date)가 보장하므로 중복 적립이
 * 구조적으로 막힌다.
 */
export async function completeTodayHabit(): Promise<{ awarded?: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { habit } = todayHabit();
  const { error } = await supabase.from("daily_habits").insert({
    user_id: user.id,
    date: formatKstIsoDate(),
    habit_id: habit.id,
  });
  // 이미 오늘 한 경우(PK 충돌)는 성공으로 본다. 두 번 눌러도 문제되지 않게.
  if (error) {
    if (error.code === "23505") return { awarded: 0 };
    return { error: "기록에 실패했어요" };
  }

  // 적립 실패가 실천 기록을 되돌리지는 않는다.
  const { data } = await supabase.rpc("award_points", {
    p_user: user.id,
    p_raw: HABIT_POINTS,
    p_reason: "habit",
    p_game_id: null as unknown as string,
  });

  revalidatePath("/home");
  revalidatePath("/points");
  return { awarded: (data as number) ?? 0 };
}
