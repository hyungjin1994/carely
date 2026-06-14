// 게임 정적 데이터 — 시안 Carely.dc.html 의 QUIZ / WORDQ / SCOLORS / MEMFACES / SEQPADS 그대로.

export type QuizItem = { q: string; o: string[]; a: number };

export const QUIZ: QuizItem[] = [
  { q: "프랑스의 수도는 어디일까요?", o: ["파리", "런던", "로마", "베를린"], a: 0 },
  { q: "일본의 수도는 어디일까요?", o: ["오사카", "도쿄", "교토", "삿포로"], a: 1 },
  { q: "미국의 수도는 어디일까요?", o: ["뉴욕", "워싱턴 D.C.", "로스앤젤레스", "시카고"], a: 1 },
  { q: "한글을 만드신 임금님은?", o: ["세종대왕", "태조", "정조", "광개토대왕"], a: 0 },
  { q: "추석에 먹는 대표 음식은?", o: ["떡국", "부럼", "송편", "팥죽"], a: 2 },
  { q: "무지개는 모두 몇 가지 색일까요?", o: ["다섯", "여섯", "일곱", "여덟"], a: 2 },
  { q: '"가는 말이 고와야 ◯◯ 말이 곱다"', o: ["오는", "하는", "나쁜", "지는"], a: 0 },
  { q: '"티끌 모아 ◯◯"', o: ["강물", "태산", "보름", "큰일"], a: 1 },
  { q: "벌이 부지런히 모으는 것은?", o: ["꿀", "솜", "쌀", "물"], a: 0 },
  { q: "봄에 가장 먼저 피는 노란 꽃은?", o: ["장미", "국화", "개나리", "코스모스"], a: 2 },
  { q: "우리나라 국화(나라꽃)는?", o: ["진달래", "무궁화", "벚꽃", "목련"], a: 1 },
  { q: "김치의 주재료는 무엇일까요?", o: ["무", "오이", "배추", "당근"], a: 2 },
];

export type WordItem = { q: string; ans: string; d: string[] };

export const WORDQ: WordItem[] = [
  { q: "바늘", ans: "실", d: ["못", "풀", "종이"] },
  { q: "숟가락", ans: "젓가락", d: ["접시", "컵", "냄비"] },
  { q: "우산", ans: "비", d: ["눈사람", "모자", "바람"] },
  { q: "연필", ans: "지우개", d: ["가위", "자석", "풍선"] },
  { q: "구두", ans: "양말", d: ["장갑", "목도리", "안경"] },
  { q: "책상", ans: "의자", d: ["이불", "수건", "우산"] },
  { q: "장갑", ans: "손", d: ["발", "코", "귀"] },
  { q: "열쇠", ans: "자물쇠", d: ["바퀴", "단추", "거울"] },
];

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
];

export type SeqPad = { color: string; lit: string };

export const SEQPADS: SeqPad[] = [
  { color: "#5B37ED", lit: "#B79BFF" },
  { color: "#FF5E00", lit: "#FFB78F" },
  { color: "#0098B2", lit: "#7DE3F5" },
  { color: "#42A800", lit: "#A6F26B" },
];
