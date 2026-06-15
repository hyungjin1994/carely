import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { formatKstIsoDate } from "@/lib/time";
import { CalendarView } from "@/app/(app)/calendar/calendar-view";

export default async function SeniorCalendarPage({
  params,
}: {
  params: Promise<{ seniorId: string }>;
}) {
  const { seniorId } = await params;
  const profile = await ensureProfile();
  const supabase = await createClient();

  // 연결된 어르신인지 확인
  const { data: link } = await supabase
    .from("family_links")
    .select("id")
    .eq("manager_id", profile.id)
    .eq("senior_id", seniorId)
    .eq("status", "active")
    .maybeSingle();
  if (!link) redirect("/connect");

  const { data: senior } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", seniorId)
    .maybeSingle();

  const today = formatKstIsoDate();
  const [yStr, mStr] = today.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const monthStart = `${yStr}-${mStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${yStr}-${mStr}-${String(lastDay).padStart(2, "0")}`;

  const { data: events } = await supabase
    .from("events")
    .select("id, date, type, title, time, place, with_whom, memo, done")
    .eq("user_id", seniorId)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .order("time");

  return (
    <CalendarView
      year={year}
      month={month}
      today={today}
      events={events ?? []}
      targetUserId={seniorId}
      backHref="/connect"
      heading={`${senior?.name ?? "어르신"} 일정`}
    />
  );
}
