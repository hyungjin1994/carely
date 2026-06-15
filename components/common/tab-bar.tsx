"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/common/icon";

const TABS = [
  { label: "홈", icon: "home-fill", href: "/home" },
  { label: "게임", icon: "sparkle-fill", href: "/games" },
  { label: "측정", icon: "heart-fill", href: "/measure" },
  { label: "일정", icon: "calendar", href: "/calendar" },
  { label: "가족", icon: "persons", href: "/family" },
  { label: "설정", icon: "setting", href: "/settings" },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--c-line)",
        background: "var(--c-card)",
        padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
        display: "flex",
      }}
    >
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        const color = active ? "var(--c-primary)" : "var(--c-faint)";
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 0",
              textDecoration: "none",
            }}
          >
            <Icon name={t.icon} size={27} color={color} />
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
