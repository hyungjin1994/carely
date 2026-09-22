"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatKstIsoDate, kstWeekStart } from "@/lib/time";
import { getWeeklyReport, weeklyDigest } from "@/lib/weekly/queries";
import { pushToManagers } from "@/lib/push/family";
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

/**
 * 주간 리포트 확인 처리 + 자녀에게 알림·푸시.
 *
 * 어머니가 시트를 닫을 때 한 번만 실행된다(weekly_report_seen PK 로 보장).
 * 이때 자녀 알림도 같이 만든다 — 어머니가 앱을 여는 게 한 주의 자연스러운
 * 시작점이고, 크론(하루 1회)에 의존하지 않아도 되기 때문이다.
 *
 * 자녀가 어머니보다 먼저 /connect 를 열면 그쪽에서 알림을 만든다(중복은
 * notify_managers_weekly 가 막는다).
 */
export async function confirmWeekly(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const weekStart = kstWeekStart();
  const { error } = await supabase
    .from("weekly_report_seen")
    .insert({ user_id: user.id, week_start: weekStart });
  // 이미 본 주(PK 충돌)면 알림도 이미 갔다.
  if (error) return error.code === "23505" ? {} : { error: "기록에 실패했어요" };

  // 자녀 알림. 실패해도 확인 처리를 되돌리지 않는다.
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    const report = await getWeeklyReport(user.id);
    const { title, body } = weeklyDigest(profile?.name ?? "어르신", report);

    const { data: made } = await supabase.rpc("notify_managers_weekly", {
      p_week_start: weekStart,
      p_title: title,
      p_body: body,
    });
    // 새로 만든 알림이 있을 때만 푸시한다(중복 푸시 방지).
    if ((made as number) > 0) {
      await pushToManagers(user.id, { title, body, url: "/connect", tag: "weekly" });
    }
  } catch {
    // 알림 실패 — 자녀는 /connect 를 열 때 배너로 보게 된다.
  }

  revalidatePath("/home");
  return {};
}
