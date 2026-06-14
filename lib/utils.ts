import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1,240 같은 천단위 콤마 (시안 fmt) */
export function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("ko-KR");
}
