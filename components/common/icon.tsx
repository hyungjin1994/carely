import * as React from "react";

/**
 * 시안의 iconSpan 재현. /icons/{name}.svg 를 CSS mask 로 깔고
 * background:currentColor (또는 color prop) 로 틴트한다. 이모지 금지 — 아이콘만.
 */
export type IconName = string;

export function Icon({
  name,
  size = 24,
  color = "currentColor",
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  const url = `/icons/${name}.svg`;
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        width: size,
        height: size,
        flexShrink: 0,
        background: color,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        ...style,
      }}
    />
  );
}
