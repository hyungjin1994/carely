import { createClient } from "@/lib/supabase/server";
import { formatKstIsoDate } from "@/lib/time";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const supabase = await createClient();

  // KST 기준 현재 연·월
  const today = formatKstIsoDate(); // YYYY-MM-DD
  const [yStr, mStr] = today.split("-");
  const year = Number(yStr);
  const month = Number(mStr); // 1-12

  const monthStart = `${yStr}-${mStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${yStr}-${mStr}-${String(lastDay).padStart(2, "0")}`;

  const { data: events } = await supabase
    .from("events")
    .select("id, date, type, title, time, place, with_whom, memo, done")
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .order("time");

  return (
    <CalendarView
      year={year}
      month={month}
      today={today}
      events={events ?? []}
    />
  );
}
