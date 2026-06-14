"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildTwoWeekDoses } from "@/lib/meds/schedule";

export type MedActionState = { ok?: boolean; error?: string };

export async function createMedication(input: {
  name: string;
  dose: string;
  times: string[];
}): Promise<MedActionState> {
  const name = input.name.trim();
  const dose = input.dose.trim() || "1정";
  const times = (input.times ?? []).filter(Boolean);
  if (!name || times.length === 0) return { error: "약 이름과 시간을 정해주세요" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { data: med, error } = await supabase
    .from("medications")
    .insert({ user_id: user.id, name, dose, times })
    .select("id")
    .single();
  if (error || !med) return { error: "저장에 실패했어요" };

  // 2주치 복용 스케줄 + 알림 자동 생성
  const { doses, notifications } = buildTwoWeekDoses({ name, dose, times });
  if (doses.length) {
    await supabase.from("med_doses").insert(
      doses.map((d) => ({ med_id: med.id, user_id: user.id, scheduled_at: d.scheduled_at, taken: false })),
    );
  }
  if (notifications.length) {
    await supabase.from("notifications").insert(
      notifications.map((nt) => ({
        user_id: user.id,
        kind: nt.kind,
        title: nt.title,
        body: nt.body,
        send_at: nt.send_at,
        sent: false,
        channel: "push",
      })),
    );
  }

  revalidatePath("/meds");
  revalidatePath("/home");
  return { ok: true };
}

export async function deleteMedication(id: string) {
  const supabase = await createClient();
  // med_doses 는 FK cascade 로 함께 삭제됨
  await supabase.from("medications").delete().eq("id", id);
  revalidatePath("/meds");
  revalidatePath("/home");
}
