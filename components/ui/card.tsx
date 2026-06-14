import * as React from "react";

/** 시안 card(): 흰 배경, 1px 라인, radius 24, 옅은 그림자. */
export function Card({
  children,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: "var(--c-card)",
        border: "1px solid var(--c-line)",
        borderRadius: 24,
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
