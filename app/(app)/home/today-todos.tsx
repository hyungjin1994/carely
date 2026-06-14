"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/common/icon";
import { toggleMedDose, toggleEventDone } from "./actions";
import type { TodoItem } from "@/lib/queries";

export function TodayTodos({ items }: { items: TodoItem[] }) {
  const [done, setDone] = useState<Record<string, boolean>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.done])),
  );
  const [, startTransition] = useTransition();

  const toggle = (item: TodoItem) => {
    const next = !done[item.id];
    setDone((d) => ({ ...d, [item.id]: next }));
    startTransition(async () => {
      if (item.kind === "med") await toggleMedDose(item.id, next);
      else await toggleEventDone(item.id, next);
    });
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(15px*var(--fs))", padding: "20px 0" }}>
        오늘은 챙길 일이 없어요
      </div>
    );
  }

  return (
    <div>
      {items.map((item, i) => {
        const taken = done[item.id];
        return (
          <button
            key={item.id}
            onClick={() => toggle(item)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              background: "transparent",
              border: "none",
              borderTop: i === 0 ? "none" : "1px solid var(--c-line)",
              padding: "13px 0",
              textAlign: "left",
            }}
          >
            <span
              style={{
                fontSize: "calc(12px*var(--fs))",
                fontWeight: 800,
                color: "#fff",
                background: item.chipColor,
                padding: "5px 10px",
                borderRadius: 9,
                flexShrink: 0,
              }}
            >
              {item.chip}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: "calc(17px*var(--fs))",
                fontWeight: 700,
                color: "var(--c-text)",
                textDecoration: taken ? "line-through" : "none",
                opacity: taken ? 0.4 : 1,
              }}
            >
              {item.title}
            </span>
            <Icon
              name={taken ? "circle-check-fill" : "check-thick"}
              size={30}
              color={taken ? "#00A63E" : "var(--c-line)"}
            />
          </button>
        );
      })}
    </div>
  );
}
