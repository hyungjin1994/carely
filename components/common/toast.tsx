"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/common/icon";

/** 어디서든 호출: 화면 하단 토스트 1.8초. */
export function showToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("carely:toast", { detail: message }));
}

export function ToastHost() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      setMsg(detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(""), 1800);
    };
    window.addEventListener("carely:toast", onToast);
    return () => {
      window.removeEventListener("carely:toast", onToast);
      clearTimeout(timer);
    };
  }, []);

  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 108,
        transform: "translateX(-50%)",
        zIndex: 60,
        background: "#16181D",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 14,
        fontSize: "calc(15px*var(--fs))",
        fontWeight: 700,
        maxWidth: "calc(100% - 48px)",
        boxShadow: "0 8px 24px rgba(0,0,0,.3)",
        animation: "cyrise .2s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Icon name="circle-check-fill" size={18} color="#69E59A" />
      {msg}
    </div>
  );
}
