// 시안 renderVals() 의 테마 객체. 일반/고대비 두 세트.
// globals.css 의 :root / :root[data-contrast="high"] 와 값이 일치해야 한다.

export const LIGHT_VARS: Record<string, string> = {
  "--c-bg": "#EDF0F4",
  "--c-card": "#FFFFFF",
  "--c-screen": "#F4F6F9",
  "--c-text": "#16181D",
  "--c-sub": "#5A5C63",
  "--c-faint": "#8A8D95",
  "--c-line": "rgba(112,115,124,0.16)",
  "--c-primary": "#0066FF",
};

export const HIGH_CONTRAST_VARS: Record<string, string> = {
  "--c-bg": "#FFFFFF",
  "--c-card": "#FFFFFF",
  "--c-screen": "#FFFFFF",
  "--c-text": "#000000",
  "--c-sub": "#262626",
  "--c-faint": "#404040",
  "--c-line": "#111111",
  "--c-primary": "#0030B0",
};

/** 글자 크기 3단계 (시안 settings fonts). */
export const FONT_SCALES = [
  { label: "보통", v: 1 },
  { label: "크게", v: 1.18 },
  { label: "아주 크게", v: 1.4 },
] as const;
