import type { Role } from "@/lib/database.types";

// 어르신(돌봄 대상) = parent | grandparent, 관리자(돌보는 사람) = manager.
// 서버/클라 양쪽에서 쓰는 순수 헬퍼.

export const isManager = (r: Role): boolean => r === "manager";
export const isSenior = (r: Role): boolean => r !== "manager";

/** 역할 표시 라벨. */
export function roleLabel(r: Role): string {
  switch (r) {
    case "grandparent":
      return "조부모님";
    case "manager":
      return "관리자";
    default:
      return "부모님";
  }
}

/** 옛 역할값(mom/child) 하위호환 매핑 — JWT 갱신 전 사용자 대응. */
export function normalizeRole(raw: string | undefined | null): Role {
  if (raw === "manager" || raw === "child") return "manager";
  if (raw === "grandparent") return "grandparent";
  return "parent"; // 'mom' 포함
}
