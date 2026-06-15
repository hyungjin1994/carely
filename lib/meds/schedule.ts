// 약 등록 시 2주치 복용 스케줄 + 알림을 생성한다. 시간은 KST 기준 → UTC 저장.

/** 시간대 라벨 → KST 시각 (시:분). */
export const SLOT_TIME: Record<string, [number, number]> = {
  아침: [8, 0],
  점심: [12, 30],
  저녁: [18, 30],
  "자기 전": [21, 30],
};

export const SLOT_ORDER: Record<string, number> = {
  아침: 0,
  점심: 1,
  저녁: 2,
  "자기 전": 3,
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** KST 의 (오늘+dayOffset) 날짜의 hh:mm 을 가리키는 UTC Date. */
function kstSlotToUtc(now: Date, dayOffset: number, hh: number, mm: number): Date {
  // 현재 KST 날짜 파트
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const y = kstNow.getUTCFullYear();
  const mo = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate() + dayOffset;
  // 해당 KST 시각을 UTC 로: KST = UTC+9 이므로 UTC = KST - 9h
  const asUtcMidnightKst = Date.UTC(y, mo, d, hh, mm, 0);
  return new Date(asUtcMidnightKst - KST_OFFSET_MS);
}

/** 시간대 라벨 → KST hour (홈 화면 슬롯 복원용, 옛 데이터 호환). */
export function hourToSlot(kstHour: number): string {
  if (kstHour < 11) return "아침";
  if (kstHour < 15) return "점심";
  if (kstHour < 21) return "저녁";
  return "자기 전";
}

/** "HH:MM" 또는 옛 슬롯 라벨 → [시, 분] (KST). 형식이 틀리면 null. */
export function parseMedTime(t: string): [number, number] | null {
  const slot = SLOT_TIME[t];
  if (slot) return slot;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return [hh, mm];
}

export type DoseSeed = { scheduled_at: string };
export type NotificationSeed = {
  kind: "med";
  title: string;
  body: string;
  send_at: string;
};

/** 2주(14일)치 복용 스케줄 + 알림 시드 생성. 이미 지난 시각은 건너뛴다. */
export function buildTwoWeekDoses(
  med: { name: string; dose: string; times: string[] },
  now: Date = new Date(),
): { doses: DoseSeed[]; notifications: NotificationSeed[] } {
  const doses: DoseSeed[] = [];
  const notifications: NotificationSeed[] = [];

  for (let day = 0; day < 14; day++) {
    for (const time of med.times) {
      const t = parseMedTime(time);
      if (!t) continue;
      const when = kstSlotToUtc(now, day, t[0], t[1]);
      if (when.getTime() <= now.getTime()) continue; // 지난 시각 제외
      const iso = when.toISOString();
      doses.push({ scheduled_at: iso });
      notifications.push({
        kind: "med",
        title: "약 드실 시간이에요",
        body: `${med.name} ${med.dose} 챙겨 드세요`,
        send_at: iso,
      });
    }
  }

  return { doses, notifications };
}
