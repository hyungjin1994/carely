"use client";

import { useEffect } from "react";

/**
 * 프로필의 글자배율/고대비를 document root 에 적용한다.
 * 서버 레이아웃이 래퍼 인라인 스타일로 1차 적용(FOUC 방지)하고,
 * 이 컴포넌트가 root 에도 반영해 설정 변경 시 즉시 전 화면에 퍼지게 한다.
 */
export function ThemeRoot({
  fontScale,
  highContrast,
}: {
  fontScale: number;
  highContrast: boolean;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--fs", String(fontScale));
    root.setAttribute("data-contrast", highContrast ? "high" : "normal");
  }, [fontScale, highContrast]);

  return null;
}

/** 설정 화면에서 저장 전 즉시 미리보기용. */
export function applyThemeNow(fontScale: number, highContrast: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--fs", String(fontScale));
  root.setAttribute("data-contrast", highContrast ? "high" : "normal");
}
