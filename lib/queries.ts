import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatKstIsoDate, kstHour } from "@/lib/time";
import { hourToSlot } from "@/lib/meds/schedule";
import { DAILY_CAP } from "@/lib/games/config";

export type TodoItem = {
  kind: "med" | "event";
  id: string;
  chip: string;
  chipColor: string;
  title: string;
  done: boolean;
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  약: "#00A63E",
  병원: "#0066FF",
  운동: "#FF9200",
  가족: "#E846CD",
  기타: "#5B37ED",
};

/** 포인트 잔액 = point_ledger delta 합. */
export async function getBalance(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("point_ledger").select("delta");
  return (data ?? []).reduce((sum, r) => sum + (r.delta ?? 0), 0);
}

/** KST 오늘 누적 포인트. */
export async function getTodayPoints(): Promise<number> {
  const supabase = await createClient();
  const today = formatKstIsoDate();
  const { data } = await supabase
    .from("daily_points")
    .select("total")
    .eq("date", today)
    .maybeSingle();
  return data?.total ?? 0;
}

export async function getPointsSummary() {
  const [balance, today] = await Promise.all([getBalance(), getTodayPoints()]);
  return { balance, today, cap: DAILY_CAP };
}

/** 오늘 챙길 일 = 오늘(KST) med_doses + events. */
export async function getTodayTodos(): Promise<TodoItem[]> {
  const supabase = await createClient();
  const today = formatKstIsoDate();
  const dayStart = new Date(`${today}T00:00:00+09:00`).toISOString();
  const dayEnd = new Date(`${today}T23:59:59+09:00`).toISOString();

  const [{ data: doses }, { data: events }] = await Promise.all([
    supabase
      .from("med_doses")
      .select("id, scheduled_at, taken, medications(name, dose)")
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .order("scheduled_at"),
    supabase
      .from("events")
      .select("id, type, title, time, done")
      .eq("date", today)
      .order("time"),
  ]);

  const items: TodoItem[] = [];
  for (const d of doses ?? []) {
    const med = (d as unknown as { medications: { name: string; dose: string } | null }).medications;
    const hr = new Date(d.scheduled_at).getUTCHours();
    // KST hour
    const kstH = (hr + 9) % 24;
    items.push({
      kind: "med",
      id: d.id,
      chip: hourToSlot(kstH),
      chipColor: "#00A63E",
      title: med ? `${med.name} ${med.dose}` : "약",
      done: d.taken,
    });
  }
  for (const e of events ?? []) {
    items.push({
      kind: "event",
      id: e.id,
      chip: e.type,
      chipColor: EVENT_TYPE_COLOR[e.type] ?? "#5B37ED",
      title: e.time ? `${e.title} · ${e.time}` : e.title,
      done: e.done,
    });
  }
  return items;
}

/** 어머니: 활성 가족 링크 + 최신 메시지 1줄 + 대표 사진. */
export async function getFamilySummary(uid: string) {
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("family_links")
    .select("id, child_id")
    .eq("mom_id", uid)
    .eq("status", "active")
    .maybeSingle();

  let latestMessage: { text: string; mine: boolean } | null = null;
  if (link) {
    const { data: msg } = await supabase
      .from("messages")
      .select("text, from_id")
      .eq("family_id", link.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (msg) latestMessage = { text: msg.text, mine: msg.from_id === uid };
  }

  const { data: photo } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("owner_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { link, latestMessage, photoPath: photo?.storage_path ?? null };
}

export { kstHour, EVENT_TYPE_COLOR };
