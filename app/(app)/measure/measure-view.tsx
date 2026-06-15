"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/common/sub-header";
import { BottomSheet } from "@/components/common/bottom-sheet";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { formatKstHeader } from "@/lib/time";
import { MEASURE_KINDS, measureMeta, measureStatus, type MeasureKindMeta } from "@/lib/measurements";
import { Sparkline } from "@/components/common/sparkline";
import type { MeasurementKind } from "@/lib/database.types";
import { addMeasurement } from "./actions";

export type MeasureRow = {
  id: string;
  kind: MeasurementKind;
  v1: number | null;
  v2: number | null;
  v3: number | null;
  memo: string | null;
  measured_at: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "2px solid var(--c-line)",
  borderRadius: 14,
  padding: "0 16px",
  height: 58,
  fontSize: "calc(18px*var(--fs))",
  outline: "none",
  fontFamily: "inherit",
  background: "var(--c-card)",
  color: "var(--c-text)",
  boxSizing: "border-box",
};

export function MeasureView({ recent }: { recent: MeasureRow[] }) {
  const router = useRouter();
  const [active, setActive] = useState<MeasureKindMeta | null>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [memo, setMemo] = useState("");
  const [pending, startTransition] = useTransition();

  // 항목별 최신값 (recent 는 measured_at desc)
  const latest = useMemo(() => {
    const m: Partial<Record<MeasurementKind, MeasureRow>> = {};
    for (const r of recent) if (!m[r.kind]) m[r.kind] = r;
    return m;
  }, [recent]);

  const open = (meta: MeasureKindMeta) => {
    setActive(meta);
    setVals({});
    setMemo("");
  };

  const save = () => {
    if (!active) return;
    const num = (k: string) => {
      const s = (vals[k] ?? "").trim();
      if (!s) return null;
      const n = Number(s);
      return Number.isNaN(n) ? null : n;
    };
    const keys = active.fields.map((f) => f.key);
    startTransition(async () => {
      const res = await addMeasurement({
        kind: active.kind,
        v1: keys.includes("v1") ? num("v1") : null,
        v2: keys.includes("v2") ? num("v2") : null,
        v3: keys.includes("v3") ? num("v3") : null,
        memo,
      });
      if (res.error) showToast(res.error);
      else {
        setActive(null);
        showToast("측정값을 기록했어요");
        router.refresh();
      }
    });
  };

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader title="측정" href="/home" />
      <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-sub)", marginBottom: 16 }}>
        혈당·혈압·체중을 기록하면 가족이 함께 확인해요
      </div>

      {/* 항목 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {MEASURE_KINDS.map((m) => {
          const l = latest[m.kind];
          const st = l ? measureStatus(m.kind, l.v1, l.v2) : null;
          const series = recent
            .filter((r) => r.kind === m.kind)
            .map((r) => r.v1)
            .filter((n): n is number => n != null)
            .reverse();
          return (
            <button
              key={m.kind}
              onClick={() => open(m)}
              style={{ textAlign: "left", border: "1px solid var(--c-line)", background: "var(--c-card)", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={m.icon} size={20} color="#fff" />
                </div>
                <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{m.label}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 800, color: st ? st.color : l ? m.color : "var(--c-faint)" }}>
                  {l ? m.format(l.v1, l.v2, l.v3) : "기록 없음"}
                </span>
                {st && (
                  <span style={{ fontSize: "calc(12px*var(--fs))", fontWeight: 800, color: st.color, background: st.color + "1A", padding: "2px 8px", borderRadius: 8 }}>
                    {st.label}
                  </span>
                )}
              </div>
              {series.length >= 2 && <Sparkline values={series} color={st?.color ?? m.color} />}
            </button>
          );
        })}
      </div>

      {/* 최근 기록 */}
      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "24px 0 12px" }}>최근 기록</div>
      {recent.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(15px*var(--fs))", padding: "20px 0" }}>아직 기록이 없어요</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recent.map((r) => {
            const meta = measureMeta(r.kind);
            const st = measureStatus(r.kind, r.v1, r.v2);
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 16, padding: "14px 16px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={meta.icon} size={20} color={meta.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 700, color: "var(--c-text)" }}>
                    {meta.label} · <span style={{ fontWeight: 800, color: st ? st.color : "var(--c-text)" }}>{meta.format(r.v1, r.v2, r.v3)}</span>
                    {st ? <span style={{ marginLeft: 6, fontSize: "calc(12px*var(--fs))", fontWeight: 800, color: st.color }}>{st.label}</span> : null}
                  </div>
                  <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>
                    {formatKstHeader(new Date(r.measured_at), "month-day")}
                    {r.memo ? ` · ${r.memo}` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomSheet open={active !== null} onClose={() => setActive(null)} title={active ? `${active.label} 기록` : ""}>
        {active && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {active.fields.map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 700, color: "var(--c-sub)", marginBottom: 6, paddingLeft: 4 }}>
                    {f.label} ({active.unit})
                  </div>
                  <input
                    inputMode="decimal"
                    value={vals[f.key] ?? ""}
                    onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}
              <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (선택)" style={inputStyle} />
            </div>
            <button onClick={save} disabled={pending} style={{ marginTop: 16, width: "100%", border: "none", borderRadius: 16, height: 60, background: "var(--c-primary)", color: "#fff", fontSize: "calc(18px*var(--fs))", fontWeight: 800, opacity: pending ? 0.6 : 1 }}>
              기록하기
            </button>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
