"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type AuthState } from "../actions";
import { Icon } from "@/components/common/icon";

const inputWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "var(--c-card)",
  border: "2px solid var(--c-line)",
  borderRadius: 16,
  padding: "0 16px",
  height: 62,
};
const inputStyle: React.CSSProperties = {
  border: "none",
  outline: "none",
  background: "transparent",
  flex: 1,
  fontSize: "calc(18px*var(--fs))",
  color: "var(--c-text)",
  fontFamily: "inherit",
  minWidth: 0,
};

export function LoginForm({ emailCheck }: { emailCheck: boolean }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});
  const [showPw, setShowPw] = useState(false);

  return (
    <form
      action={formAction}
      style={{ padding: "24px 26px 40px", display: "flex", flexDirection: "column", minHeight: "100%" }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: 22,
            background: "linear-gradient(135deg,#0066FF,#5B37ED)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
            boxShadow: "0 10px 24px rgba(91,55,237,.28)",
          }}
        >
          <Icon name="heart-fill" size={40} color="#fff" />
        </div>
        <div
          style={{
            fontSize: "calc(34px*var(--fs))",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--c-text)",
            lineHeight: 1.15,
          }}
        >
          반가워요!
          <br />
          Carely 예요
        </div>
        <div style={{ fontSize: "calc(17px*var(--fs))", color: "var(--c-sub)", marginTop: 12, lineHeight: 1.5 }}>
          매일 게임하고 가족과 소식도 나눠요
        </div>

        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={inputWrap}>
            <Icon name="mail" size={24} color="var(--c-faint)" />
            <input name="email" type="email" autoComplete="email" placeholder="이메일" style={inputStyle} />
          </label>
          <label style={inputWrap}>
            <Icon name="lock" size={24} color="var(--c-faint)" />
            <input
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="비밀번호"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label="비밀번호 보기"
              style={{ border: "none", background: "transparent", padding: 8, display: "flex" }}
            >
              <Icon name={showPw ? "eye-slash" : "eye"} size={24} color="var(--c-faint)" />
            </button>
          </label>
        </div>

        {state.error && (
          <div style={{ marginTop: 14, color: "var(--c-bad)", fontSize: "calc(14px*var(--fs))", fontWeight: 700 }}>
            {state.error}
          </div>
        )}
        {emailCheck && !state.error && (
          <div style={{ marginTop: 14, color: "var(--c-sub)", fontSize: "calc(14px*var(--fs))", fontWeight: 600 }}>
            메일로 보낸 확인 링크를 눌러주세요.
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            marginTop: 22,
            border: "none",
            borderRadius: 16,
            height: 64,
            background: "var(--c-primary)",
            color: "#fff",
            fontSize: "calc(19px*var(--fs))",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: pending ? 0.6 : 1,
            boxShadow: "0 8px 20px rgba(0,102,255,.26)",
          }}
        >
          {pending ? "들어가는 중..." : "로그인"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
            marginTop: 18,
            color: "var(--c-faint)",
            fontSize: "calc(14px*var(--fs))",
          }}
        >
          <Icon name="circle-check-fill" size={18} color="var(--c-primary)" />
          한 번 로그인하면 다음엔 바로 들어와요
        </div>
      </div>

      <div style={{ textAlign: "center", paddingTop: 20, fontSize: "calc(16px*var(--fs))", color: "var(--c-sub)" }}>
        처음이신가요?{" "}
        <Link href="/signup" style={{ color: "var(--c-primary)", fontWeight: 800, textDecoration: "none" }}>
          회원가입
        </Link>
      </div>
    </form>
  );
}
