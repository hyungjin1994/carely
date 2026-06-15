import type { MeasurementKind } from "@/lib/database.types";

// 측정 항목 메타 — 입력 필드/단위/표시. 서버·클라 공용 순수 모듈.
// 매핑: 혈당 v1=mg/dL · 혈압 v1=수축/v2=이완/v3=맥박 · 체중 v1=kg

export type MeasureField = { key: "v1" | "v2" | "v3"; label: string; placeholder: string };

export type MeasureKindMeta = {
  kind: MeasurementKind;
  label: string;
  unit: string;
  color: string;
  icon: string;
  fields: MeasureField[];
  format: (v1: number | null, v2: number | null, v3: number | null) => string;
};

export const MEASURE_KINDS: MeasureKindMeta[] = [
  {
    kind: "glucose_fasting",
    label: "공복 혈당",
    unit: "mg/dL",
    color: "#0066FF",
    icon: "thunder-fill",
    fields: [{ key: "v1", label: "공복 혈당", placeholder: "예: 95" }],
    format: (v1) => (v1 != null ? `${v1} mg/dL` : "-"),
  },
  {
    kind: "glucose_post",
    label: "식후 혈당",
    unit: "mg/dL",
    color: "#00A63E",
    icon: "thunder-fill",
    fields: [{ key: "v1", label: "식후 혈당", placeholder: "예: 140" }],
    format: (v1) => (v1 != null ? `${v1} mg/dL` : "-"),
  },
  {
    kind: "bp",
    label: "혈압",
    unit: "mmHg",
    color: "#E52222",
    icon: "heart-fill",
    fields: [
      { key: "v1", label: "수축기", placeholder: "예: 120" },
      { key: "v2", label: "이완기", placeholder: "예: 80" },
      { key: "v3", label: "맥박", placeholder: "예: 70" },
    ],
    format: (v1, v2, v3) =>
      v1 != null ? `${v1}/${v2 ?? "-"} mmHg${v3 != null ? ` · 맥박 ${v3}` : ""}` : "-",
  },
  {
    kind: "weight",
    label: "체중",
    unit: "kg",
    color: "#FF9200",
    icon: "star-fill",
    fields: [{ key: "v1", label: "체중", placeholder: "예: 62.5" }],
    format: (v1) => (v1 != null ? `${v1} kg` : "-"),
  },
];

export function measureMeta(kind: MeasurementKind): MeasureKindMeta {
  return MEASURE_KINDS.find((m) => m.kind === kind) ?? MEASURE_KINDS[0];
}

// ── 정상범위 판정 (성인 일반 기준 참고치) ──
export type MeasureLevel = "low" | "normal" | "warn" | "high";
export type MeasureStatus = { level: MeasureLevel; label: string; color: string };

const LEVEL_COLOR: Record<MeasureLevel, string> = {
  low: "#0066FF",
  normal: "#00A63E",
  warn: "#FF9200",
  high: "#E52222",
};
const LEVEL_LABEL: Record<MeasureLevel, string> = {
  low: "낮음",
  normal: "정상",
  warn: "주의",
  high: "높음",
};
const lv = (level: MeasureLevel): MeasureStatus => ({
  level,
  label: LEVEL_LABEL[level],
  color: LEVEL_COLOR[level],
});

/** 측정값의 정상범위 판정. 기준 없음(체중)·값 없음이면 null. */
export function measureStatus(
  kind: MeasurementKind,
  v1: number | null,
  v2: number | null,
): MeasureStatus | null {
  switch (kind) {
    case "glucose_fasting":
      if (v1 == null) return null;
      if (v1 < 70) return lv("low");
      if (v1 <= 99) return lv("normal");
      if (v1 <= 125) return lv("warn");
      return lv("high");
    case "glucose_post":
      if (v1 == null) return null;
      if (v1 < 70) return lv("low");
      if (v1 < 140) return lv("normal");
      if (v1 < 200) return lv("warn");
      return lv("high");
    case "bp": {
      if (v1 == null) return null;
      const sys = v1;
      const dia = v2 ?? 0;
      if (sys >= 140 || dia >= 90) return lv("high");
      if (sys >= 120 || dia >= 80) return lv("warn");
      if (sys < 90 || (v2 != null && dia < 60)) return lv("low");
      return lv("normal");
    }
    default:
      return null; // weight: 키/BMI 의존이라 단독 판정 안 함
  }
}
