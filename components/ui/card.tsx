import * as React from "react";
import { cardStyle } from "@/components/ui/styles";

/** 시안 card(): 흰 배경, 1px 라인, radius 24, 옅은 그림자. */
export function Card({
  children,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ ...cardStyle, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
