"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/common/sub-header";
import { BottomSheet } from "@/components/common/bottom-sheet";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { createEvent, toggleEventDone } from "./actions";

type EventRow = {
  id: string;
  date: string;
  type: string;
  title: string;
  time: string | null;
  done: boolean;
};

const WD = ["일", "월", "화", "수", "목", "금", "토"];
const TYPE_COLOR: Record<string, string> = { 약: "#00A63E", 병원: "#0066FF", 운동: "#FF9200", 가족: "#E846CD", 기타: "#5B37ED" };
const TYPES = ["약", "병원", "운동", "가족", "기타"];

const sheetInput: React.CSSProperties = {
  width: "100%",
  border: "2px solid var(--c-line)",
  borderRadius: 14,
  padding: "0 16px",
  height: 58,
  fontSize: "calc(17px*var(--fs))",
  outline: "none",
  fontFamily: "inherit",
  background: "var(--c-card)",
  color: "var(--c-text)",
  boxSizing: "border-box",
};

export function CalendarView({
  year,
  month,
  today,
  events,
}: {
  year: number;
  month: number;
  today: string;
  events: EventRow[];
}) {
  const router = useRouter();
  const [selDate, setSelDate] = useState(today);
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState("약");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [pending, startTransition] = useTransition();

  const iso = (d: number) => `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const byDate = useMemo(() => {
    const map: Record<string, EventRow[]> = {};
    for (const e of events) (map[e.date] ??= []).push(e);
    return map;
  }, [events]);

  const first = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const dayEvents = byDate[selDate] ?? [];
  const selDay = Number(selDate.split("-")[2]);

  const save = () => {
    startTransition(async () => {
      const res = await createEvent({ date: selDate, type, title, time });
      if (res.error) showToast(res.error);
      else {
        setAddOpen(false);
        setTitle("");
        showToast("알림 시간에 맞춰 알려드릴게요");
        router.refresh();
      }
    });
  };

  const toggle = (id: string, done: boolean) => {
    startTransition(async () => {
      await toggleEventDone(id, !done);
      router.refresh();
    });
  };

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader
        title="일정"
        href="/home"
        right={
          <button
            onClick={() => setAddOpen(true)}
            style={{ border: "none", background: "var(--c-primary)", color: "#fff", borderRadius: 13, height: 42, padding: "0 14px", display: "flex", alignItems: "center", gap: 5, fontSize: "calc(14px*var(--fs))", fontWeight: 800 }}
          >
            <Icon name="plus" size={20} color="#fff" />
            추가
          </button>
        }
      />

      <div style={{ textAlign: "center", fontSize: "calc(19px*var(--fs))", fontWeight: 800, color: "var(--c-text)", marginBottom: 14 }}>
        {year}년 {month}월
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {WD.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: "calc(13px*var(--fs))", fontWeight: 700, color: i === 0 ? "#E52222" : i === 6 ? "#0066FF" : "var(--c-sub)" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = iso(d);
          const has = (byDate[dateStr] ?? []).length > 0;
          const sel = selDate === dateStr;
          const col = sel ? "#fff" : i % 7 === 0 ? "#E52222" : i % 7 === 6 ? "#0066FF" : "var(--c-text)";
          return (
            <button
              key={i}
              onClick={() => setSelDate(dateStr)}
              style={{ aspectRatio: "1/1", border: "none", borderRadius: 12, background: sel ? "#0066FF" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 0 }}
            >
              <span style={{ fontSize: "calc(15px*var(--fs))", fontWeight: sel ? 800 : 600, color: col }}>{d}</span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: has ? (sel ? "#fff" : "#FF5E00") : "transparent" }} />
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "22px 0 12px" }}>
        {month}월 {selDay}일 일정
      </div>

      {dayEvents.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dayEvents.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 16, padding: "14px 16px" }}>
              <span style={{ fontSize: "calc(12px*var(--fs))", fontWeight: 800, color: "#fff", background: TYPE_COLOR[e.type] ?? "#5B37ED", padding: "5px 10px", borderRadius: 9 }}>{e.type}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 700, color: "var(--c-text)", textDecoration: e.done ? "line-through" : "none", opacity: e.done ? 0.5 : 1 }}>{e.title}</div>
                {e.time && <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>{e.time}</div>}
              </div>
              <button onClick={() => toggle(e.id, e.done)} style={{ border: "none", background: "transparent", padding: 4 }}>
                <Icon name={e.done ? "circle-check-fill" : "check-thick"} size={28} color={e.done ? "#00A63E" : "var(--c-line)"} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(15px*var(--fs))", padding: "24px 0" }}>이 날은 일정이 없어요</div>
      )}

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="일정 추가">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {TYPES.map((t) => {
            const on = type === t;
            return (
              <button key={t} onClick={() => setType(t)} style={{ padding: "10px 16px", borderRadius: 12, border: "2px solid " + (on ? "#0066FF" : "var(--c-line)"), background: on ? "#EAF2FE" : "var(--c-card)", fontSize: "calc(15px*var(--fs))", fontWeight: 700, color: on ? "#0066FF" : "var(--c-text)" }}>
                {t}
              </button>
            );
          })}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="무슨 일정인가요?" style={{ ...sheetInput, marginBottom: 12 }} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={sheetInput} />
        <button onClick={save} disabled={pending} style={{ marginTop: 16, width: "100%", border: "none", borderRadius: 16, height: 60, background: "var(--c-primary)", color: "#fff", fontSize: "calc(18px*var(--fs))", fontWeight: 800, opacity: pending ? 0.6 : 1 }}>
          저장하기
        </button>
      </BottomSheet>
    </div>
  );
}
