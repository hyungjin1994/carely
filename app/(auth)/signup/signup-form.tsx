"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "../actions";
import { Icon } from "@/components/common/icon";

const fieldLabel: React.CSSProperties = {
  fontSize: "calc(15px*var(--fs))",
  fontWeight: 700,
  color: "var(--c-sub)",
  marginBottom: 8,
  paddingLeft: 4,
};
const field: React.CSSProperties = {
  width: "100%",
  border: "2px solid var(--c-line)",
  borderRadius: 16,
  padding: "0 18px",
  height: 62,
  fontSize: "calc(18px*var(--fs))",
  color: "var(--c-text)",
  outline: "none",
  fontFamily: "inherit",
  background: "var(--c-card)",
  boxSizing: "border-box",
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signup, {});
  const [role, setRole] = useState<"mom" | "child">("mom");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const mismatch = pw2.length > 0 && pw !== pw2;

  return (
    <form action={formAction} style={{ padding: "8px 26px 40px" }}>
      <input type="hidden" name="role" value={role} />
      <Link
        href="/login"
        style={{
          border: "none",
          background: "transparent",
          padding: "10px 0",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--c-sub)",
          fontSize: "calc(16px*var(--fs))",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <Icon name="chevron-left" size={22} color="var(--c-sub)" />
        로그인으로
      </Link>
      <div style={{ fontSize: "calc(30px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--c-text)", marginTop: 10 }}>
        회원가입
      </div>
      <div style={{ fontSize: "calc(16px*var(--fs))", color: "var(--c-sub)", marginTop: 8, lineHeight: 1.5 }}>
        이름(호칭)은 인사말에 사용해요
      </div>

      {/* 역할 선택 */}
      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        {([
          { v: "mom", label: "어머니" },
          { v: "child", label: "자녀" },
        ] as const).map((r) => {
          const on = role === r.v;
          return (
            <button
              type="button"
              key={r.v}
              onClick={() => setRole(r.v)}
              style={{
                flex: 1,
                padding: "14px 4px",
                borderRadius: 14,
                border: "2px solid " + (on ? "#0066FF" : "var(--c-line)"),
                background: on ? "#EAF2FE" : "var(--c-card)",
                color: on ? "#0066FF" : "var(--c-text)",
                fontWeight: 800,
                fontSize: "calc(16px*var(--fs))",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={fieldLabel}>이름 (호칭)</div>
          <input name="name" placeholder="예: 형진엄마" style={field} />
        </div>
        <div>
          <div style={fieldLabel}>이메일</div>
          <input name="email" type="email" autoComplete="email" placeholder="이메일 주소" style={field} />
        </div>
        <div>
          <div style={fieldLabel}>비밀번호</div>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호 (6자 이상)"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            style={field}
          />
        </div>
        <div>
          <div style={fieldLabel}>비밀번호 확인</div>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호 한 번 더"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            style={{ ...field, borderColor: mismatch ? "#E52222" : "var(--c-line)" }}
          />
          {mismatch && (
            <div style={{ marginTop: 6, paddingLeft: 4, color: "var(--c-bad)", fontSize: "calc(13px*var(--fs))", fontWeight: 700 }}>
              비밀번호가 일치하지 않아요
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <div style={{ marginTop: 14, color: "var(--c-bad)", fontSize: "calc(14px*var(--fs))", fontWeight: 700 }}>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || mismatch || pw.length === 0}
        style={{
          marginTop: 26,
          width: "100%",
          border: "none",
          borderRadius: 16,
          height: 64,
          background: "var(--c-primary)",
          color: "#fff",
          fontSize: "calc(19px*var(--fs))",
          fontWeight: 800,
          opacity: pending || mismatch || pw.length === 0 ? 0.6 : 1,
          boxShadow: "0 8px 20px rgba(0,102,255,.26)",
        }}
      >
        {pending ? "가입 중..." : "가입하고 시작하기"}
      </button>
    </form>
  );
}
