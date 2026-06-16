"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { saveOnboarding } from "./actions";

type Initial = {
  birth_date: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  wake_time: string | null;
  sleep_time: string | null;
  meal_morning: string | null;
  meal_noon: string | null;
  meal_evening: string | null;
  exercise_time: string | null;
  conditions: string[];
  allergies: string | null;
  living: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
};

const CONDITIONS = ["당뇨", "고혈압", "심장질환", "관절염", "치매", "기타"];
const LIVING = ["혼자", "배우자와", "가족과"];

const input: React.CSSProperties = {
  width: "100%",
  border: "2px solid var(--c-line)",
  borderRadius: 14,
  padding: "0 16px",
  height: 56,
  fontSize: "calc(17px*var(--fs))",
  outline: "none",
  fontFamily: "inherit",
  background: "var(--c-card)",
  color: "var(--c-text)",
  boxSizing: "border-box",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 18, padding: 18 }}>
      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "calc(13px*var(--fs))", fontWeight: 700, color: "var(--c-sub)", marginBottom: 6, paddingLeft: 2 }}>{label}</div>
      {children}
    </div>
  );
}

function Pills({ options, value, onChange, color = "#0066FF" }: { options: string[]; value: string; onChange: (v: string) => void; color?: string }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" onClick={() => onChange(on ? "" : o)} style={{ padding: "11px 18px", borderRadius: 12, border: "2px solid " + (on ? color : "var(--c-line)"), background: on ? color + "14" : "var(--c-card)", fontSize: "calc(15px*var(--fs))", fontWeight: 700, color: on ? color : "var(--c-text)" }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function OnboardingView({ initial, onboarded }: { initial: Initial; onboarded: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [conditions, setConditions] = useState<string[]>(initial.conditions);
  const [f, setF] = useState({
    birth_date: initial.birth_date ?? "",
    gender: initial.gender ?? "",
    height_cm: initial.height_cm != null ? String(initial.height_cm) : "",
    weight_kg: initial.weight_kg != null ? String(initial.weight_kg) : "",
    wake_time: initial.wake_time ?? "",
    sleep_time: initial.sleep_time ?? "",
    meal_morning: initial.meal_morning ?? "",
    meal_noon: initial.meal_noon ?? "",
    meal_evening: initial.meal_evening ?? "",
    exercise_time: initial.exercise_time ?? "",
    allergies: initial.allergies ?? "",
    living: initial.living ?? "",
    emergency_name: initial.emergency_name ?? "",
    emergency_phone: initial.emergency_phone ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const num = (s: string) => (s && !Number.isNaN(Number(s)) ? Number(s) : null);
  const toggleCond = (c: string) => setConditions((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const submit = () =>
    startTransition(async () => {
      const res = await saveOnboarding({
        birth_date: f.birth_date || null,
        gender: f.gender || null,
        height_cm: num(f.height_cm),
        weight_kg: num(f.weight_kg),
        wake_time: f.wake_time || null,
        sleep_time: f.sleep_time || null,
        meal_morning: f.meal_morning || null,
        meal_noon: f.meal_noon || null,
        meal_evening: f.meal_evening || null,
        exercise_time: f.exercise_time || null,
        conditions,
        allergies: f.allergies || null,
        living: f.living || null,
        emergency_name: f.emergency_name || null,
        emergency_phone: f.emergency_phone || null,
      });
      if (res.error) showToast(res.error);
      else {
        showToast("저장했어요");
        router.push("/home");
      }
    });

  return (
    <div style={{ padding: "12px 22px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: "calc(26px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--c-text)" }}>
          {onboarded ? "내 정보" : "초기 설정"}
        </div>
        <button onClick={() => router.push("/home")} style={{ border: "none", background: "transparent", color: "var(--c-sub)", fontSize: "calc(15px*var(--fs))", fontWeight: 700 }}>
          {onboarded ? "닫기" : "건너뛰기"}
        </button>
      </div>
      <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-sub)", marginBottom: 18, lineHeight: 1.5 }}>
        채워두면 약·일정 알림과 가족 돌봄에 도움이 돼요. 나중에 설정에서 바꿀 수 있어요.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Section title="기본 정보">
          <Field label="생년월일">
            <input type="date" value={f.birth_date} onChange={(e) => set("birth_date", e.target.value)} style={input} />
          </Field>
          <Field label="성별">
            <Pills options={["남", "여"]} value={f.gender} onChange={(v) => set("gender", v)} />
          </Field>
        </Section>

        <Section title="몸 정보">
          <Field label="키 (cm)">
            <input inputMode="decimal" value={f.height_cm} onChange={(e) => set("height_cm", e.target.value)} placeholder="예: 162" style={input} />
          </Field>
          <Field label="몸무게 (kg)">
            <input inputMode="decimal" value={f.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} placeholder="예: 58" style={input} />
          </Field>
        </Section>

        <Section title="하루 루틴">
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="기상"><input type="time" value={f.wake_time} onChange={(e) => set("wake_time", e.target.value)} style={input} /></Field>
            <Field label="취침"><input type="time" value={f.sleep_time} onChange={(e) => set("sleep_time", e.target.value)} style={input} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="아침"><input type="time" value={f.meal_morning} onChange={(e) => set("meal_morning", e.target.value)} style={input} /></Field>
            <Field label="점심"><input type="time" value={f.meal_noon} onChange={(e) => set("meal_noon", e.target.value)} style={input} /></Field>
            <Field label="저녁"><input type="time" value={f.meal_evening} onChange={(e) => set("meal_evening", e.target.value)} style={input} /></Field>
          </div>
          <Field label="운동 시간">
            <input type="time" value={f.exercise_time} onChange={(e) => set("exercise_time", e.target.value)} style={input} />
          </Field>
        </Section>

        <Section title="건강">
          <Field label="앓고 있는 병 (해당되는 것 모두)">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CONDITIONS.map((c) => {
                const on = conditions.includes(c);
                return (
                  <button key={c} type="button" onClick={() => toggleCond(c)} style={{ padding: "11px 16px", borderRadius: 12, border: "2px solid " + (on ? "#E52222" : "var(--c-line)"), background: on ? "#FEECEC" : "var(--c-card)", fontSize: "calc(15px*var(--fs))", fontWeight: 700, color: on ? "#E52222" : "var(--c-text)" }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="약 알레르기 (있으면)">
            <input value={f.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="예: 페니실린" style={input} />
          </Field>
        </Section>

        <Section title="생활 · 응급">
          <Field label="누구와 사세요">
            <Pills options={LIVING} value={f.living} onChange={(v) => set("living", v)} color="#00A63E" />
          </Field>
          <Field label="응급 연락처">
            <div style={{ display: "flex", gap: 10 }}>
              <input value={f.emergency_name} onChange={(e) => set("emergency_name", e.target.value)} placeholder="이름" style={{ ...input, flex: 1 }} />
              <input type="tel" value={f.emergency_phone} onChange={(e) => set("emergency_phone", e.target.value)} placeholder="전화번호" style={{ ...input, flex: 1.4 }} />
            </div>
          </Field>
        </Section>
      </div>

      <button onClick={submit} disabled={pending} style={{ marginTop: 20, width: "100%", border: "none", borderRadius: 16, height: 62, background: "var(--c-primary)", color: "#fff", fontSize: "calc(18px*var(--fs))", fontWeight: 800, opacity: pending ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Icon name="circle-check-fill" size={24} color="#fff" />
        {onboarded ? "저장하기" : "저장하고 시작하기"}
      </button>
    </div>
  );
}
