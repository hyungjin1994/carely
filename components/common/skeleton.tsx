import * as React from "react";

/** 로딩 중 자리표시용 회색 블록 (shimmer). */
export function Skeleton({
  w = "100%",
  h = 16,
  r = 12,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  style?: React.CSSProperties;
}) {
  return <div className="cy-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** 카드형 스켈레톤 (둥근 박스). */
export function SkeletonCard({ h = 90, style }: { h?: number | string; style?: React.CSSProperties }) {
  return <Skeleton w="100%" h={h} r={20} style={style} />;
}
