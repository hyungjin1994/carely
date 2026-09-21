/** 1,240 같은 천단위 콤마 (시안 fmt) */
export function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("ko-KR");
}
