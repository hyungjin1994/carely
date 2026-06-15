"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/database.types";

const TYPES: EventType[] = ["약", "병원", "운동", "가족", "여행", "모임", "생일", "기타"];

export type CreateEventState = { ok?: boolean; error?: string };

export type EventFields = {
  date: string; // YYYY-MM-DD
  type: string;
  title: string;
  time: string; // HH:MM
  place?: string;
  withWhom?: string;
  memo?: string;
  userId?: string; // 관리자가 어르신 대신 등록할 때 (생략 시 본인)
};

function normType(t: string): string {
  return (TYPES as string[]).includes(t) ? t : "기타";
}

export async function createEvent(input: EventFields): Promise<CreateEventState> {
  const title = input.title.trim();
  if (!title) return { error: "내용을 적어주세요" };
  const type = normType(input.type);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };
  const targetId = input.userId ?? user.id;

  const { error } = await supabase.from("events").insert({
    user_id: targetId,
    date: input.date,
    type,
    title,
    time: input.time || null,
    place: input.place?.trim() || null,
    with_whom: input.withWhom?.trim() || null,
    memo: input.memo?.trim() || null,
    done: false,
  });
  if (error) return { error: "저장에 실패했어요" };

  // 시간이 있으면 알림 예약 (미래 시각만). 본인 등록 시에만 — 알림 insert 는 본인 권한.
  if (input.time && targetId === user.id) {
    const sendAt = new Date(`${input.date}T${input.time}:00+09:00`);
    if (sendAt.getTime() > Date.now()) {
      await supabase.from("notifications").insert({
        user_id: targetId,
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
  revalidatePath("/connect");
  return { ok: true };
}

export async function updateEvent(
  id: string,
  input: { type: string; title: string; time: string; place?: string; withWhom?: string; memo?: string },
): Promise<CreateEventState> {
  const title = input.title.trim();
  if (!title) return { error: "내용을 적어주세요" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      type: normType(input.type),
      title,
      time: input.time || null,
      place: input.place?.trim() || null,
      with_whom: input.withWhom?.trim() || null,
      memo: input.memo?.trim() || null,
    })
    .eq("id", id);
  if (error) return { error: "수정에 실패했어요" };

  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/connect");
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<CreateEventState> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: "삭제에 실패했어요" };

  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/connect");
  return { ok: true };
}

export async function toggleEventDone(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("events").update({ done }).eq("id", id);
  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/connect");
}
