import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatKstIsoDate, kstHour } from "@/lib/time";
import { DAILY_CAP } from "@/lib/games/config";
import { getSignedPhotoUrls } from "@/lib/storage";
import type { MeasurementKind } from "@/lib/database.types";

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
  여행: "#0098B2",
  모임: "#7A5CFF",
  생일: "#FF3D8B",
  기타: "#5B37ED",
};

// 본인이면 user_id 생략(현재 로그인 사용자), 관리자가 어르신을 볼 땐 seniorId 전달.
// 가족 읽기 RLS 가 생겨 명시적 user_id 필터가 없으면 관리자가 어르신 행까지 읽어 합산되므로 항상 필터한다.
async function uidFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId?: string,
): Promise<string | null> {
  if (userId) return userId;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** 포인트 잔액 = point_ledger delta 합. */
export async function getBalance(userId?: string): Promise<number> {
  const supabase = await createClient();
  const uid = await uidFor(supabase, userId);
  if (!uid) return 0;
  const { data } = await supabase.from("point_ledger").select("delta").eq("user_id", uid);
  return (data ?? []).reduce((sum, r) => sum + (r.delta ?? 0), 0);
}

/** KST 오늘 누적 포인트. */
export async function getTodayPoints(userId?: string): Promise<number> {
  const supabase = await createClient();
  const uid = await uidFor(supabase, userId);
  if (!uid) return 0;
  const today = formatKstIsoDate();
  const { data } = await supabase
    .from("daily_points")
    .select("total")
    .eq("user_id", uid)
    .eq("date", today)
    .maybeSingle();
  return data?.total ?? 0;
}

export async function getPointsSummary(userId?: string) {
  const [balance, today] = await Promise.all([getBalance(userId), getTodayPoints(userId)]);
  return { balance, today, cap: DAILY_CAP };
}

/** KST 오늘 게임별 적립 포인트 합 — { [gameId]: points }. 게임 목록 진행도용. */
export async function getTodayGamePoints(userId?: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  const uid = await uidFor(supabase, userId);
  if (!uid) return {};
  const today = formatKstIsoDate();
  const dayStart = new Date(`${today}T00:00:00+09:00`).toISOString();
  const dayEnd = new Date(`${today}T23:59:59+09:00`).toISOString();

  const { data } = await supabase
    .from("game_scores")
    .select("game_id, points")
    .eq("user_id", uid)
    .gte("created_at", dayStart)
    .lte("created_at", dayEnd);

  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    out[r.game_id] = (out[r.game_id] ?? 0) + (r.points ?? 0);
  }
  return out;
}

/** 오늘 챙길 일 = 오늘(KST) med_doses + events. */
export async function getTodayTodos(userId?: string): Promise<TodoItem[]> {
  const supabase = await createClient();
  const uid = await uidFor(supabase, userId);
  if (!uid) return [];
  const today = formatKstIsoDate();
  const dayStart = new Date(`${today}T00:00:00+09:00`).toISOString();
  const dayEnd = new Date(`${today}T23:59:59+09:00`).toISOString();

  const [{ data: doses }, { data: events }] = await Promise.all([
    supabase
      .from("med_doses")
      .select("id, scheduled_at, taken, medications(name, dose)")
      .eq("user_id", uid)
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .order("scheduled_at"),
    supabase
      .from("events")
      .select("id, type, title, time, done")
      .eq("user_id", uid)
      .eq("date", today)
      .order("time"),
  ]);

  const items: TodoItem[] = [];
  for (const d of doses ?? []) {
    const med = (d as unknown as { medications: { name: string; dose: string } | null }).medications;
    const dt = new Date(d.scheduled_at);
    // KST 시각 (HH:MM)
    const kstH = (dt.getUTCHours() + 9) % 24;
    const kstM = dt.getUTCMinutes();
    items.push({
      kind: "med",
      id: d.id,
      chip: `${kstH}:${String(kstM).padStart(2, "0")}`,
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

/** 어르신: 활성 가족 링크 + 최신 메시지 1줄 + 대표 사진. */
export async function getFamilySummary(uid: string) {
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("family_links")
    .select("id, manager_id")
    .eq("senior_id", uid)
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

export type SeniorSummary = {
  balance: number;
  today: number;
  meds: { taken: number; total: number };
  events: { done: number; total: number };
  games: { plays: number; points: number };
};

/** 관리자 대시보드용 — 연결된 어르신 한 명의 오늘 활동 요약 (가족 읽기 RLS 필요). */
export async function getSeniorSummary(seniorId: string): Promise<SeniorSummary> {
  const supabase = await createClient();
  const today = formatKstIsoDate();
  const dayStart = new Date(`${today}T00:00:00+09:00`).toISOString();
  const dayEnd = new Date(`${today}T23:59:59+09:00`).toISOString();

  const [balance, todayPts, doses, events, games] = await Promise.all([
    getBalance(seniorId),
    getTodayPoints(seniorId),
    supabase
      .from("med_doses")
      .select("taken")
      .eq("user_id", seniorId)
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd),
    supabase.from("events").select("done").eq("user_id", seniorId).eq("date", today),
    supabase
      .from("game_scores")
      .select("points")
      .eq("user_id", seniorId)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),
  ]);

  const doseRows = doses.data ?? [];
  const eventRows = events.data ?? [];
  const gameRows = games.data ?? [];

  return {
    balance,
    today: todayPts,
    meds: { taken: doseRows.filter((d) => d.taken).length, total: doseRows.length },
    events: { done: eventRows.filter((e) => e.done).length, total: eventRows.length },
    games: {
      plays: gameRows.length,
      points: gameRows.reduce((s, g) => s + (g.points ?? 0), 0),
    },
  };
}

export type MeasureLatest = {
  v1: number | null;
  v2: number | null;
  v3: number | null;
  measured_at: string;
};

/** 사용자별 측정 항목 최신값 — { [kind]: latest }. 관리자 대시보드/측정 화면 공용. */
export async function getLatestMeasurements(
  userId: string,
): Promise<Partial<Record<MeasurementKind, MeasureLatest>>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("measurements")
    .select("kind, v1, v2, v3, measured_at")
    .eq("user_id", userId)
    .order("measured_at", { ascending: false })
    .limit(40);

  const out: Partial<Record<MeasurementKind, MeasureLatest>> = {};
  for (const r of data ?? []) {
    const k = r.kind as MeasurementKind;
    if (!out[k]) out[k] = { v1: r.v1, v2: r.v2, v3: r.v3, measured_at: r.measured_at };
  }
  return out;
}

export type TimelineComment = { id: string; name: string; text: string; mine: boolean; createdAt: string };
export type TimelinePost = {
  id: string;
  url: string | null;
  caption: string | null;
  ownerName: string;
  mine: boolean;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  comments: TimelineComment[];
};

/** 가족 타임라인 — 볼 수 있는 사진(본인+연결가족) 최신순 + 좋아요/댓글.
 *  ownerIds 를 주면 그 소유자들 것만 (관리자가 특정 어르신 앨범 볼 때). */
export async function getTimeline(ownerIds?: string[]): Promise<TimelinePost[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user?.id ?? "";

  let q = supabase
    .from("photos")
    .select("id, owner_id, storage_path, caption, created_at, profiles(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (ownerIds && ownerIds.length) q = q.in("owner_id", ownerIds);
  const { data: photos } = await q;
  const list = photos ?? [];
  if (!list.length) return [];

  const ids = list.map((p) => p.id);
  const urls = await getSignedPhotoUrls(list.map((p) => p.storage_path));
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from("photo_likes").select("photo_id, user_id").in("photo_id", ids),
    supabase
      .from("photo_comments")
      .select("id, photo_id, user_id, text, created_at, profiles(name)")
      .in("photo_id", ids)
      .order("created_at"),
  ]);

  return list.map((p) => {
    const owner = (p as unknown as { profiles: { name: string | null } | null }).profiles;
    const pl = (likes ?? []).filter((l) => l.photo_id === p.id);
    const pc = (comments ?? []).filter((c) => c.photo_id === p.id);
    return {
      id: p.id,
      url: urls[p.storage_path] ?? null,
      caption: p.caption,
      ownerName: owner?.name ?? "가족",
      mine: p.owner_id === uid,
      createdAt: p.created_at,
      likeCount: pl.length,
      likedByMe: pl.some((l) => l.user_id === uid),
      comments: pc.map((c) => {
        const cn = (c as unknown as { profiles: { name: string | null } | null }).profiles;
        return { id: c.id, name: cn?.name ?? "가족", text: c.text, mine: c.user_id === uid, createdAt: c.created_at };
      }),
    };
  });
}

export { kstHour, EVENT_TYPE_COLOR };
