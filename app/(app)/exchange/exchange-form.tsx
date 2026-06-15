"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/utils";
import { showToast } from "@/components/common/toast";
import { requestExchange } from "./actions";

const OPTS = [10000, 30000, 50000];

export function ExchangeForm() {
  const router = useRouter();
  const [amount, setAmount] = useState(10000);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const res = await requestExchange(amount);
      if (res.error) showToast(res.error);
      else {
        showToast(`${fmt(amount)}P 환전을 신청했어요`);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {OPTS.map((o) => {
          const on = amount === o;
          return (
            <button
              key={o}
              onClick={() => setAmount(o)}
              style={{
                padding: "18px 10px",
                borderRadius: 18,
                border: "2px solid " + (on ? "#0066FF" : "var(--c-line)"),
                background: on ? "#EAF2FE" : "var(--c-card)",
                fontSize: "calc(20px*var(--fs))",
                fontWeight: 800,
                color: on ? "#0066FF" : "var(--c-text)",
              }}
            >
              {fmt(o)}P
            </button>
          );
        })}
      </div>
      <button
        onClick={submit}
        disabled={pending}
        style={{
          marginTop: 16,
          width: "100%",
          border: "none",
          borderRadius: 18,
          height: 64,
          background: "var(--c-primary)",
          color: "#fff",
          fontSize: "calc(18px*var(--fs))",
          fontWeight: 800,
          opacity: pending ? 0.6 : 1,
        }}
      >
        {fmt(amount)}P 환전 신청
      </button>
    </>
  );
}
