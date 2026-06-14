"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { rotateConnectCode } from "./actions";

export function ConnectCodeCard({ initialCode }: { initialCode: string | null }) {
  const [code, setCode] = useState(initialCode);
  const [pending, startTransition] = useTransition();

  const rotate = () => {
    startTransition(async () => {
      const res = await rotateConnectCode();
      if (res.error) showToast(res.error);
      else {
        setCode(res.code ?? null);
        showToast("새 코드를 만들었어요");
      }
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, padding: 18, background: "var(--c-card)", border: "1px dashed #9EC5FF", borderRadius: 18 }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, background: "#EAF2FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="persons" size={24} color="#0066FF" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "calc(14px*var(--fs))", color: "var(--c-sub)", fontWeight: 600 }}>자녀 연결 코드</div>
        <div style={{ fontSize: "calc(26px*var(--fs))", fontWeight: 800, color: "var(--c-text)", letterSpacing: "0.1em" }}>
          {code ?? "—"}
        </div>
      </div>
      <button
        onClick={rotate}
        disabled={pending}
        style={{ border: "1px solid var(--c-line)", background: "var(--c-card)", borderRadius: 12, padding: "10px 12px", fontSize: "calc(13px*var(--fs))", fontWeight: 700, color: "var(--c-sub)", flexShrink: 0 }}
      >
        {code ? "새로" : "코드 만들기"}
      </button>
    </div>
  );
}
