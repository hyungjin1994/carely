"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@/components/common/icon";

/** 화면 오른쪽 아래 떠 있는 "가는 길"(네이버지도) 버튼. 게임 플레이 중엔 숨김. */
export function RouteFab() {
  const pathname = usePathname();
  if (pathname?.includes("/play")) return null;

  return (
    <a
      href="https://map.naver.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="가는 길 찾기"
      style={{
        position: "absolute",
        right: 18,
        bottom: "calc(80px + env(safe-area-inset-bottom))",
        width: 62,
        height: 62,
        borderRadius: "50%",
        background: "#03C75A",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        textDecoration: "none",
        boxShadow: "0 8px 20px rgba(3,199,90,.42)",
        zIndex: 40,
      }}
    >
      <Icon name="location" size={24} color="#fff" />
      <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1 }}>가는길</span>
    </a>
  );
}
