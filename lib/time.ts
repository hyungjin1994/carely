// Carely 는 한국 사용자 대상이라 모든 시간 계산을 KST 기준으로 한다.
// Vercel 함수의 시스템 timezone 은 UTC 라 직접 처리해야 함 (TZ 환경변수는 reserved).

const KST = "Asia/Seoul";

function kstParts(now: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

/** KST 기준 hour (0-23). */
export function kstHour(now: Date = new Date()): number {
  return kstParts(now).hour;
}

/** KST 기준 "YYYY-MM-DD" 문자열. */
export function formatKstIsoDate(now: Date = new Date()): string {
  const { year, month, day } = kstParts(now);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 헤더용 날짜 문자열 — 서버 tz 와 무관하게 항상 KST 로. "6월 11일 수요일" */
export function formatKstHeader(
  now: Date = new Date(),
  style: "month-day-weekday" | "month-day" | "year-month" = "month-day-weekday",
): string {
  const opts: Intl.DateTimeFormatOptions = { timeZone: KST };
  if (style === "month-day-weekday" || style === "month-day") {
    opts.month = "long";
    opts.day = "numeric";
  }
  if (style === "month-day-weekday") opts.weekday = "long";
  if (style === "year-month") {
    opts.year = "numeric";
    opts.month = "long";
  }
  return new Intl.DateTimeFormat("ko-KR", opts).format(now);
}

export type Greeting = { t: string; icon: "sun" | "moon"; g: string };

/** 시간대별 인사말 (시안 greeting()). */
export function greeting(now: Date = new Date()): Greeting {
  const hr = kstHour(now);
  if (hr < 11)
    return { t: "좋은 아침이에요", icon: "sun", g: "linear-gradient(135deg,#FFB347,#FF7B2E)" };
  if (hr < 17)
    return { t: "점심은 드셨어요?", icon: "sun", g: "linear-gradient(135deg,#4F95FF,#0066FF)" };
  if (hr < 21)
    return { t: "좋은 저녁이에요", icon: "moon", g: "linear-gradient(135deg,#7D5EF7,#5B37ED)" };
  return { t: "편안한 밤 되세요", icon: "moon", g: "linear-gradient(135deg,#37383C,#0F2A66)" };
}
