// 방해 금지 시간 판정. Carely 는 밤 9시(21:00)~아침 8시(08:00) KST 고정.

const KST = "Asia/Seoul";

export const DND_START = 21 * 60; // 21:00
export const DND_END = 8 * 60; //    08:00

function nowMinutesKst(now: Date): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

/** 지금이 DND(21:00~08:00 KST) 구간인지. 자정을 넘는 래핑 구간. */
export function isWithinDnd(now: Date = new Date()): boolean {
  const nm = nowMinutesKst(now);
  // start(1260) > end(480) → 래핑: nm >= 1260 || nm < 480
  return nm >= DND_START || nm < DND_END;
}

/** DND 구간이면 다음 08:00 KST 의 UTC Date 를 반환. */
export function nextMorningUtc(now: Date = new Date()): Date {
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + KST_OFFSET);
  const y = kstNow.getUTCFullYear();
  const mo = kstNow.getUTCMonth();
  let d = kstNow.getUTCDate();
  const nm = nowMinutesKst(now);
  // 21:00~24:00 이면 다음날 08:00, 00:00~08:00 이면 오늘 08:00
  if (nm >= DND_START) d += 1;
  const target = Date.UTC(y, mo, d, 8, 0, 0); // KST 08:00
  return new Date(target - KST_OFFSET);
}
