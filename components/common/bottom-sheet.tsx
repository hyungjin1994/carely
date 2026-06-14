"use client";

import * as React from "react";

/** 시안 _sheet(): 아래→위 슬라이드, dim 배경, radius 28. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(10,12,20,.42)",
        zIndex: 30,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--c-card)",
          borderRadius: "28px 28px 0 0",
          padding: "22px 22px 30px",
          animation: "cyrise .26s ease",
        }}
      >
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--c-line)", margin: "0 auto 16px" }} />
        <div
          style={{
            fontSize: "calc(22px*var(--fs))",
            fontWeight: 800,
            color: "var(--c-text)",
            marginBottom: 18,
          }}
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}
