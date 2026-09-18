// 게임 정적 데이터 (클라이언트에서 쓰는 것만).
//
// 퀴즈·단어 문제 은행은 서버 전용이라 lib/games/quiz-bank.ts 로 분리했다.
// 이 파일은 클라이언트 번들에 실리므로 문항 데이터를 여기에 두지 말 것.

export type StroopColor = { name: string; hex: string };

export const SCOLORS: StroopColor[] = [
  { name: "빨강", hex: "#E52222" },
  { name: "파랑", hex: "#0066FF" },
  { name: "초록", hex: "#00A63E" },
  { name: "노랑", hex: "#E08800" },
  { name: "보라", hex: "#5B37ED" },
];

export type MemFace = { icon: string; color: string };

export const MEMFACES: MemFace[] = [
  { icon: "heart-fill", color: "#E846CD" },
  { icon: "star-fill", color: "#FF9200" },
  { icon: "sun", color: "#E08800" },
  { icon: "moon", color: "#5B37ED" },
  { icon: "crown", color: "#0098B2" },
  { icon: "sparkle-fill", color: "#42A800" },
  { icon: "fire-fill", color: "#FF5E00" },
  { icon: "trophy", color: "#0066FF" },
  { icon: "coins-fill", color: "#D4A000" },
  { icon: "bell-fill", color: "#E52222" },
  { icon: "gift", color: "#7D5EF7" },
  { icon: "medal", color: "#00A63E" },
];

export type SeqPad = { color: string; lit: string };

export const SEQPADS: SeqPad[] = [
  { color: "#5B37ED", lit: "#B79BFF" },
  { color: "#FF5E00", lit: "#FFB78F" },
  { color: "#0098B2", lit: "#7DE3F5" },
  { color: "#42A800", lit: "#A6F26B" },
];
