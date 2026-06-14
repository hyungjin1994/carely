"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/common/sub-header";
import { BottomSheet } from "@/components/common/bottom-sheet";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { createMedication, deleteMedication } from "./actions";

type Med = { id: string; name: string; dose: string; times: string[] };
const TIMES = ["아침", "점심", "저녁", "자기 전"];

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

export function MedsView({ meds }: { meds: Med[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("1정");
  const [times, setTimes] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const toggleTime = (t: string) =>
    setTimes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const save = () => {
    startTransition(async () => {
      const res = await createMedication({ name, dose, times });
      if (res.error) showToast(res.error);
      else {
        setAddOpen(false);
        setName("");
        setDose("1정");
        setTimes([]);
        showToast("2주치 복용 알림을 만들었어요");
        router.refresh();
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteMedication(id);
      router.refresh();
    });
  };

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader
        title="약 관리"
        href="/home"
        right={
          <button onClick={() => setAddOpen(true)} style={{ border: "none", background: "var(--c-primary)", color: "#fff", borderRadius: 13, height: 42, padding: "0 14px", display: "flex", alignItems: "center", gap: 5, fontSize: "calc(14px*var(--fs))", fontWeight: 800 }}>
            <Icon name="plus" size={20} color="#fff" />
            추가
          </button>
        }
      />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "14px 16px", background: "#EAFBF0", border: "1px solid #ACFCC7", borderRadius: 16, fontSize: "calc(14px*var(--fs))", color: "#067A33", fontWeight: 600, lineHeight: 1.5, marginBottom: 18 }}>
        <Icon name="pill" size={20} color="#00A63E" />
        <span>약을 등록하면 2주치 복용 알림이 자동으로 만들어져요.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {meds.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 18, padding: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#EAFBF0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="pill" size={28} color="#00A63E" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "calc(18px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{m.name} · {m.dose}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {m.times.map((t) => (
                  <span key={t} style={{ fontSize: "calc(12px*var(--fs))", fontWeight: 700, color: "#0066FF", background: "#EAF2FE", padding: "4px 10px", borderRadius: 8 }}>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={() => remove(m.id)} aria-label="삭제" style={{ border: "none", background: "transparent", padding: 6 }}>
              <Icon name="trash" size={24} color="var(--c-faint)" />
            </button>
          </div>
        ))}
        {meds.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(15px*var(--fs))", padding: "24px 0" }}>등록된 약이 없어요</div>
        )}
      </div>

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="약 추가">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="약 이름 (예: 혈압약)" style={{ ...sheetInput, marginBottom: 12 }} />
        <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="용량 (예: 1정)" style={{ ...sheetInput, marginBottom: 14 }} />
        <div style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 700, color: "var(--c-sub)", marginBottom: 8 }}>먹는 시간</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TIMES.map((t) => {
            const on = times.includes(t);
            return (
              <button key={t} onClick={() => toggleTime(t)} style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid " + (on ? "#00A63E" : "var(--c-line)"), background: on ? "#EAFBF0" : "var(--c-card)", fontSize: "calc(15px*var(--fs))", fontWeight: 700, color: on ? "#067A33" : "var(--c-text)" }}>
                {t}
              </button>
            );
          })}
        </div>
        <button onClick={save} disabled={pending} style={{ marginTop: 18, width: "100%", border: "none", borderRadius: 16, height: 60, background: "var(--c-primary)", color: "#fff", fontSize: "calc(18px*var(--fs))", fontWeight: 800, opacity: pending ? 0.6 : 1 }}>
          저장하기
        </button>
      </BottomSheet>
    </div>
  );
}
