import { describe, expect, it } from "vitest";
import { fillChildLabel, hasFinalConsonant, nameToLabel, pickParticle } from "@/lib/korean";

describe("hasFinalConsonant", () => {
  it("받침 있는 글자", () => {
    for (const w of ["형진", "아들", "딸", "막내", "곽"]) {
      if (w === "막내") continue; // 내 = 받침 없음
      expect(hasFinalConsonant(w), w).toBe(true);
    }
  });

  it("받침 없는 글자", () => {
    for (const w of ["수미", "형진이", "누나", "아기", "막내"]) {
      expect(hasFinalConsonant(w), w).toBe(false);
    }
  });

  it("한글이 아니면 false", () => {
    expect(hasFinalConsonant("Tom")).toBe(false);
    expect(hasFinalConsonant("")).toBe(false);
    expect(hasFinalConsonant("  ")).toBe(false);
  });
});

describe("pickParticle", () => {
  it("받침 유무로 갈린다", () => {
    expect(pickParticle("아들", "이/가")).toBe("이");
    expect(pickParticle("형진이", "이/가")).toBe("가");
    expect(pickParticle("아들", "을/를")).toBe("을");
    expect(pickParticle("수미", "을/를")).toBe("를");
    expect(pickParticle("아들", "이랑/랑")).toBe("이랑");
    expect(pickParticle("형진이", "이랑/랑")).toBe("랑");
  });
});

describe("fillChildLabel", () => {
  const cases: [string, Record<string, string>][] = [
    [
      "{자녀}이/가 좋아하는 음식이 뭘까요?",
      {
        형진이: "형진이가 좋아하는 음식이 뭘까요?",
        아들: "아들이 좋아하는 음식이 뭘까요?",
        수미: "수미가 좋아하는 음식이 뭘까요?",
        큰딸: "큰딸이 좋아하는 음식이 뭘까요?",
      },
    ],
    [
      "{자녀} 낳으실 때 어떤 기분이었어요?",
      { 형진이: "형진이 낳으실 때 어떤 기분이었어요?", 아들: "아들 낳으실 때 어떤 기분이었어요?" },
    ],
    [
      "{자녀}을/를 보면 뭐라고 하실 것 같아요?",
      { 형진이: "형진이를 보면 뭐라고 하실 것 같아요?", 아들: "아들을 보면 뭐라고 하실 것 같아요?" },
    ],
    [
      "{자녀}한테 바라는 게 있어요?",
      // 한테는 받침에 따라 변하지 않으므로 문구에 그대로 쓴다
      { 형진이: "형진이한테 바라는 게 있어요?", 아들: "아들한테 바라는 게 있어요?" },
    ],
    [
      "{자녀}이랑/랑 둘이 제일 많이 갔던 데가 어디예요?",
      {
        형진이: "형진이랑 둘이 제일 많이 갔던 데가 어디예요?",
        아들: "아들이랑 둘이 제일 많이 갔던 데가 어디예요?",
      },
    ],
    [
      // 한 문장에 두 번 나오는 경우
      "남편이 {자녀}을/를 제일 예뻐했던 순간이 뭐예요? {자녀}이/가 몇 살쯤이었어요?",
      {
        형진이: "남편이 형진이를 제일 예뻐했던 순간이 뭐예요? 형진이가 몇 살쯤이었어요?",
        아들: "남편이 아들을 제일 예뻐했던 순간이 뭐예요? 아들이 몇 살쯤이었어요?",
      },
    ],
  ];

  for (const [prompt, expected] of cases) {
    for (const [label, want] of Object.entries(expected)) {
      it(`"${label}" → ${want}`, () => {
        expect(fillChildLabel(prompt, label)).toBe(want);
      });
    }
  }

  it("호칭이 비면 '아이' 로 채운다", () => {
    // 관리자가 이름을 안 넣었을 때도 문장이 깨지지 않아야 한다
    expect(fillChildLabel("{자녀}이/가 좋아하는 음식은?", "")).toBe("아이 좋아하는 음식은?");
    expect(fillChildLabel("{자녀} 낳으실 때", "   ")).toBe("아이 낳으실 때");
  });

  it("자리표시자가 없으면 그대로 둔다", () => {
    expect(fillChildLabel("제일 행복했던 순간이 언제예요?", "형진이")).toBe(
      "제일 행복했던 순간이 언제예요?",
    );
  });
});

describe("nameToLabel", () => {
  it("받침 있는 이름에는 이 를 붙인다", () => {
    expect(nameToLabel("형진")).toBe("형진이");
    expect(nameToLabel("민혁")).toBe("민혁이");
    expect(nameToLabel("정")).toBe("정이");
  });

  it("받침 없는 이름은 그대로", () => {
    expect(nameToLabel("수미")).toBe("수미");
    expect(nameToLabel("지호")).toBe("지호");
  });

  it("앞뒤 공백을 정리한다", () => {
    expect(nameToLabel("  형진 ")).toBe("형진이");
  });

  it("빈 값은 빈 값", () => {
    expect(nameToLabel("")).toBe("");
    expect(nameToLabel("   ")).toBe("");
  });

  it("한글이 아니면 그대로 — 조사 규칙을 적용할 수 없다", () => {
    expect(nameToLabel("Tom")).toBe("Tom");
  });

  it("이름만 읽어도 질문이 자연스럽게 읽힌다 — 설정이 필요 없다", () => {
    // profiles.name 이 "형진" 하나뿐일 때 실제로 나가는 문구.
    const label = nameToLabel("형진");
    expect(fillChildLabel("{자녀} 낳으실 때 어떤 기분이었어요?", label)).toBe(
      "형진이 낳으실 때 어떤 기분이었어요?",
    );
    expect(fillChildLabel("{자녀}한테 바라는 게 있어요?", label)).toBe(
      "형진이한테 바라는 게 있어요?",
    );
    expect(fillChildLabel("{자녀}이/가 좋아하는 음식이 뭘까요?", label)).toBe(
      "형진이가 좋아하는 음식이 뭘까요?",
    );
    expect(fillChildLabel("남편이 {자녀}을/를 제일 예뻐했던 순간이 뭐예요?", label)).toBe(
      "남편이 형진이를 제일 예뻐했던 순간이 뭐예요?",
    );
  });

  it("일반 호칭에는 쓰지 않는다 — 쓰면 아들이가 가 된다", () => {
    // 이 규칙이 왜 profiles.name 전용인지 고정해 둔다.
    expect(fillChildLabel("{자녀}이/가 좋아하는", nameToLabel("아들"))).toBe("아들이가 좋아하는");
    // 관리자가 적은 값은 그대로 써야 맞다.
    expect(fillChildLabel("{자녀}이/가 좋아하는", "아들")).toBe("아들이 좋아하는");
  });
});
