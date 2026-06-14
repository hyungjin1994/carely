"use client";

import { Icon } from "@/components/common/icon";

/** 시안 _optBtn(): 4지선다 옵션. 정답=초록, 오답=빨강 테두리. */
export function OptionButton({
  label,
  index,
  selected,
  correctIndex,
  answered,
  center,
  onClick,
}: {
  label: string;
  index: number;
  selected: number | null;
  correctIndex: number;
  answered: boolean;
  center?: boolean;
  onClick: () => void;
}) {
  const picked = selected === index;
  const isCorrect = index === correctIndex;
  const show = answered && (picked || isCorrect);
  let bd = "var(--c-line)";
  let bg = "var(--c-card)";
  let cl = "var(--c-text)";
  if (show) {
    if (isCorrect) { bd = "#00A63E"; bg = "#EAFBF0"; cl = "#067A33"; }
    else { bd = "#E52222"; bg = "#FEECEC"; cl = "#C01616"; }
  }
  return (
    <button
      onClick={onClick}
      disabled={answered}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: center ? "center" : "space-between",
        gap: 10,
        minHeight: 64,
        padding: "0 18px",
        borderRadius: 18,
        border: "2px solid " + bd,
        background: bg,
        fontSize: "calc(19px*var(--fs))",
        fontWeight: 700,
        color: cl,
        textAlign: "left",
      }}
    >
      <span>{label}</span>
      {show ? (
        <Icon name={isCorrect ? "circle-check-fill" : "circle-info"} size={24} color={isCorrect ? "#00A63E" : "#E52222"} />
      ) : null}
    </button>
  );
}
