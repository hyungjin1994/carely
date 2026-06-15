"use client";

/** 의존성 없는 초경량 추이 스파크라인 (인라인 SVG). 값 2개 미만이면 렌더 안 함. */
export function Sparkline({
  values,
  color,
  height = 34,
}: {
  values: number[];
  color: string;
  height?: number;
}) {
  if (values.length < 2) return null;
  const w = 100;
  const h = height;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lx, ly] = pts[pts.length - 1].split(",");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }} aria-hidden>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r={2} fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
