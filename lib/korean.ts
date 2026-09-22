/**
 * 한글 조사 처리.
 *
 * 회상 질문의 `{자녀}` 자리표시자를 관리자가 정한 호칭으로 바꿀 때 필요하다.
 * 조사가 받침 유무로 갈리기 때문이다.
 *
 *   형진이 + 가 → 형진이가      아들 + 이 → 아들이
 *   형진이 + 를 → 형진이를      아들 + 을 → 아들을
 *
 * ── 왜 "이름 뒤에 이 붙이기" 로는 안 되나 ──
 * 처음엔 받침 있는 이름에 "이" 를 붙여(형진 → 형진이) 뒤 조사를 고정하려 했다.
 * 그런데 그 규칙은 **이름에만** 통한다. 일반 호칭에 적용하면 "아들" → "아들이"
 * → "아들이가" 가 되어버린다. 이름인지 호칭인지는 자동으로 알 수 없다.
 *
 * 그래서 호칭은 관리자가 읽히는 그대로 적고(형진이 · 아들 · 큰딸),
 * 조사만 여기서 고른다. 질문 문구에는 `{자녀}이/가` 처럼 조사 쌍을 써 둔다.
 */

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
/** 한글 음절은 (초성 19 × 중성 21 × 종성 28) 순으로 배열돼 있다. */
const JONGSEONG_COUNT = 28;

/** 마지막 글자에 받침이 있는지. 한글 음절이 아니면 false. */
export function hasFinalConsonant(word: string): boolean {
  const trimmed = word.trim();
  if (!trimmed) return false;
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < HANGUL_START || code > HANGUL_END) return false;
  return (code - HANGUL_START) % JONGSEONG_COUNT !== 0;
}

/**
 * 사람 이름을 호칭으로 바꾼다. 받침이 있으면 "이" 를 붙인다.
 *
 *   형진 → 형진이      수미 → 수미
 *
 * 한국어에서 받침 있는 이름은 부를 때 "이" 가 붙는다. 이게 없으면 문법은
 * 맞는데 읽는 결이 딱딱해진다 — "형진 낳으실 때" vs "형진이 낳으실 때".
 *
 * ── 이 함수는 이름에만 쓴다 ──
 * 일반 호칭에 적용하면 "아들" → "아들이" → 뒤에 조사가 붙어 "아들이가" 가 된다.
 * 그래서 profiles.name(사람 이름이 확실한 값)에만 적용하고, 관리자가 직접 적은
 * child_label 에는 쓰지 않는다. 그 칸은 읽히는 그대로 적는 칸이다.
 */
export function nameToLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return hasFinalConsonant(trimmed) ? `${trimmed}이` : trimmed;
}

/** 질문 문구에 쓸 수 있는 조사 쌍. 앞이 받침 있을 때, 뒤가 없을 때. */
export const PARTICLE_PAIRS = ["이/가", "을/를", "과/와", "이랑/랑", "은/는", "으로/로"] as const;
export type ParticlePair = (typeof PARTICLE_PAIRS)[number];

/** 받침 유무에 맞는 조사를 고른다. */
export function pickParticle(word: string, pair: ParticlePair): string {
  const [withFinal, withoutFinal] = pair.split("/");
  return hasFinalConsonant(word) ? withFinal : withoutFinal;
}

/**
 * `{자녀}` 자리표시자를 호칭으로 바꾼다. 뒤에 조사 쌍이 붙어 있으면 같이 고른다.
 *
 *   "{자녀}이/가 좋아하는 음식이 뭘까요?"
 *     형진이 → "형진이가 좋아하는 음식이 뭘까요?"
 *     아들   → "아들이 좋아하는 음식이 뭘까요?"
 *
 *   "{자녀} 낳으실 때 어떤 기분이었어요?"   (조사 없이)
 *     형진이 → "형진이 낳으실 때 어떤 기분이었어요?"
 *
 * 한테·에게·보다 처럼 받침에 따라 변하지 않는 조사는 문구에 그대로 쓴다.
 */
const PLACEHOLDER = /\{자녀\}(이\/가|을\/를|과\/와|이랑\/랑|은\/는|으로\/로)?/g;

export function fillChildLabel(prompt: string, label: string): string {
  const name = label.trim();
  if (!name) return prompt.replace(PLACEHOLDER, "아이");
  return prompt.replace(PLACEHOLDER, (_m, pair?: string) =>
    pair ? name + pickParticle(name, pair as ParticlePair) : name,
  );
}
