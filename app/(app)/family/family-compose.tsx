"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { sendFamilyMessage } from "./actions";

export function FamilyCompose({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const send = () => {
    const text = msg.trim();
    if (!text) return;
    setMsg("");
    startTransition(async () => {
      const res = await sendFamilyMessage(familyId, text);
      if (res.error) showToast(res.error);
      else {
        showToast("소식을 보냈어요");
        router.refresh();
      }
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="관리자에게 한마디..."
        style={{ flex: 1, border: "2px solid var(--c-line)", borderRadius: 14, padding: "0 16px", height: 54, fontSize: "calc(15px*var(--fs))", outline: "none", fontFamily: "inherit", background: "var(--c-card)", color: "var(--c-text)", boxSizing: "border-box" }}
      />
      <button onClick={send} disabled={pending} aria-label="보내기" style={{ border: "none", background: "#0066FF", borderRadius: 14, width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="send" size={24} color="#fff" />
      </button>
    </div>
  );
}
