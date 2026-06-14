"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { redeemConnectCode } from "./actions";
import { logout } from "@/app/(auth)/actions";

export function ConnectEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const connect = () => {
    startTransition(async () => {
      const res = await redeemConnectCode(code);
      if (res.error) showToast(res.error);
      else {
        showToast("어머니와 연결됐어요");
        router.refresh();
      }
    });
  };

  return (
    <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100%" }}>
      <div style={{ width: 70, height: 70, borderRadius: 20, background: "linear-gradient(135deg,#0098B2,#0066FF)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon name="persons" size={38} color="#fff" />
      </div>
      <div style={{ fontSize: "calc(28px*var(--fs))", fontWeight: 800, color: "var(--c-text)", letterSpacing: "-0.02em", whiteSpace: "pre-line" }}>
        {"어머니와\n연결하기"}
      </div>
      <div style={{ fontSize: "calc(16px*var(--fs))", color: "var(--c-sub)", marginTop: 10, lineHeight: 1.5, whiteSpace: "pre-line" }}>
        {"어머니 앱 [가족]에서 만든\n연결 코드를 입력하세요"}
      </div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="코드 4자리"
        maxLength={8}
        style={{ marginTop: 24, width: "100%", border: "2px solid var(--c-line)", borderRadius: 16, padding: "0 18px", height: 64, fontSize: "calc(24px*var(--fs))", fontWeight: 800, letterSpacing: "0.2em", textAlign: "center", outline: "none", fontFamily: "inherit", background: "var(--c-card)", color: "var(--c-text)", boxSizing: "border-box" }}
      />
      <button onClick={connect} disabled={pending} style={{ marginTop: 16, width: "100%", border: "none", borderRadius: 16, height: 62, background: "#0066FF", color: "#fff", fontSize: "calc(18px*var(--fs))", fontWeight: 800, opacity: pending ? 0.6 : 1 }}>
        {pending ? "연결 중..." : "연결하기"}
      </button>

      <form action={logout} style={{ marginTop: 18, textAlign: "center" }}>
        <button type="submit" style={{ border: "none", background: "transparent", color: "var(--c-faint)", fontSize: "calc(14px*var(--fs))", fontWeight: 700 }}>
          로그아웃
        </button>
      </form>
    </div>
  );
}
