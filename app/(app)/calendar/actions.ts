"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/database.types";

const TYPES: EventType[] = ["약", "병원", "운동", "가족", "기타"];

export type CreateEventState = { ok?: boolean; error?: string };

export async function createEvent(input: {
  date: string; // YYYY-MM-DD
  type: string;
  title: string;
  time: string; // HH:MM
}): Promise<CreateEventState> {
  const title = input.title.trim();
  if (!title) return { error: "내용을 적어주세요" };
  const type = (TYPES as string[]).includes(input.type) ? input.type : "기타";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { error } = await supabase.from("events").insert({
    user_id: user.id,
    date: input.date,
    type,
    title,
    time: input.time || null,
    done: false,
  });
  if (error) return { error: "저장에 실패했어요" };

  // 시간이 있으면 알림 예약 (미래 시각만)
  if (input.time) {
    const sendAt = new Date(`${input.date}T${input.time}:00+09:00`);
    if (sendAt.getTime() > Date.now()) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        kind: "event",
        title: "일정 알림",
        body: `${type} · ${title}`,
        send_at: sendAt.toISOString(),
        sent: false,
        channel: "push",
      });
    }
  }

  revalidatePath("/calendar");
  revalidatePath("/home");
  return { ok: true };
}

export async function toggleEventDone(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("events").update({ done }).eq("id", id);
  revalidatePath("/calendar");
  revalidatePath("/home");
}
