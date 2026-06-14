"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";

/** 시안 subHeader(): chevron-left + 제목 + 우측 슬롯. back 미지정 시 router.back(). */
export function SubHeader({
  title,
  href,
  right,
}: {
  title: string;
  href?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px 16px" }}>
      <button
        onClick={() => (href ? router.push(href) : router.back())}
        aria-label="뒤로"
        style={{ border: "none", background: "transparent", padding: "8px 6px 8px 0", display: "flex" }}
      >
        <Icon name="chevron-left" size={28} color="var(--c-text)" />
      </button>
      <div
        style={{
          flex: 1,
          fontSize: "calc(24px*var(--fs))",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--c-text)",
        }}
      >
        {title}
      </div>
      {right ?? null}
    </div>
  );
}
