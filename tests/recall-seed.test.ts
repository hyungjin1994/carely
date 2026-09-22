import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PARTICLE_PAIRS, fillChildLabel } from "@/lib/korean";

/**
 * 회상 질문 seed 의 문구 규칙을 지킨다.
 *
 * 이 파일은 사람이 손으로 쓰는 SQL 이고, 한 번 DB 에 들어가면 문구를 고치는 데
 * 별도 update 문이 필요하다(prompt 가 unique 키다). 그래서 들어가기 전에 잡는다.
 */
const SEED = join(import.meta.dirname, "..", "supabase", "seed", "family_questions.sql");
const PATCH = join(
  import.meta.dirname,
  "..",
  "supabase",
  "seed",
  "family_questions_patch_01.sql",
);

/** insert values 행에서 문구만 뽑는다. */
function prompts(file: string): string[] {
  const sql = readFileSync(file, "utf8");
  const out: string[] = [];
  for (const line of sql.split("\n")) {
    if (!line.startsWith("    (v_senior, v_author, '")) continue;
    const m = line.match(/^ {4}\(v_senior, v_author, '(.*)', (?:null|\d+|true|false)\),?$/);
    if (!m) throw new Error("파싱 실패: " + line);
    out.push(m[1]);
  }
  return out;
}

const SEED_PROMPTS = prompts(SEED);
const PATCH_PROMPTS = prompts(PATCH);

describe("family_questions seed", () => {
  it("문구가 있다", () => {
    expect(SEED_PROMPTS.length).toBeGreaterThan(100);
  });

  it("문구가 겹치지 않는다 — unique(senior_id, prompt) 라 조용히 누락된다", () => {
    const seen = new Set<string>();
    const dup: string[] = [];
    for (const p of SEED_PROMPTS) {
      if (seen.has(p)) dup.push(p);
      seen.add(p);
    }
    expect(dup).toEqual([]);
  });

  it("SQL 문자열을 깨뜨리는 홑따옴표가 없다", () => {
    expect(SEED_PROMPTS.filter((p) => p.includes("'"))).toEqual([]);
  });

  it("특정 가족의 이름이 박혀 있지 않다 — 공용 seed 다", () => {
    // 자녀는 {자녀} 자리표시자로, 배우자·부모는 관계로 부른다.
    const named = SEED_PROMPTS.filter((p) => /형진|규미|재성/.test(p));
    expect(named).toEqual([]);
  });

  it("사람 지칭이 읽는 분 시점이다 — 어머니·아버지를 쓰지 않는다", () => {
    // "어머니" 는 자녀가 읽는 분을 부르는 말이라 본인의 어머니 뜻으로 쓰면 겹친다.
    // "아버지" 도 배우자와 본인의 아버지 둘 다로 읽혔다. 남편·엄마·아빠로 고정.
    const mixed = SEED_PROMPTS.filter((p) => /어머니|아버지/.test(p));
    expect(mixed).toEqual(["시어머니한테 배운 음식이 있어요?"]); // 시어머니는 겹치지 않는다
  });

  it("{자녀} 뒤 조사는 정해진 쌍만 쓴다", () => {
    const bad: string[] = [];
    for (const p of SEED_PROMPTS) {
      // {자녀} 바로 뒤가 조사처럼 보이는데 쌍이 아니면 잡는다.
      // 한테·에게처럼 받침에 따라 변하지 않는 조사는 그냥 쓴다.
      for (const m of p.matchAll(/\{자녀\}(\S*)/g)) {
        const rest = m[1];
        if (!rest) continue;
        if ((PARTICLE_PAIRS as readonly string[]).some((pair) => rest.startsWith(pair))) continue;
        // 변하지 않는 조사 / 띄어쓰기 전 붙은 말
        if (/^(한테|에게|처럼|보다|만|도|의|랑)/.test(rest)) continue;
        bad.push(p);
      }
    }
    expect(bad).toEqual([]);
  });

  it("호칭을 넣으면 자리표시자가 남지 않는다", () => {
    for (const label of ["형진이", "아들", "큰딸", "막내"]) {
      for (const p of SEED_PROMPTS) {
        expect(fillChildLabel(p, label), `${label} / ${p}`).not.toContain("{자녀}");
      }
    }
  });

  it("조사를 받침에 맞게 고른다", () => {
    const sample = "{자녀}이/가 좋아하는 음식이 뭘까요?";
    expect(fillChildLabel(sample, "형진이")).toBe("형진이가 좋아하는 음식이 뭘까요?");
    expect(fillChildLabel(sample, "아들")).toBe("아들이 좋아하는 음식이 뭘까요?");
  });
});

describe("family_questions 보정 패치", () => {
  it("패치가 넣는 질문은 seed 에도 있다 — seed 재실행 때 중복으로 안 들어가야 한다", () => {
    const seed = new Set(SEED_PROMPTS);
    expect(PATCH_PROMPTS.filter((p) => !seed.has(p))).toEqual([]);
  });

  it("패치가 바꾸는 결과 문구도 seed 에 있다", () => {
    const sql = readFileSync(PATCH, "utf8");
    const seed = new Set(SEED_PROMPTS);
    const after = [...sql.matchAll(/^ {3}set prompt = '(.*)'$/gm)].map((m) => m[1]);
    expect(after.length).toBeGreaterThan(20);
    expect(after.filter((p) => !seed.has(p))).toEqual([]);
  });

  it("패치가 바꾸기 전 문구는 seed 에 없다 — 이미 다 교체됐어야 한다", () => {
    const sql = readFileSync(PATCH, "utf8");
    const seed = new Set(SEED_PROMPTS);
    const before = [...sql.matchAll(/^ where prompt = '(.*)';$/gm)].map((m) => m[1]);
    expect(before.length).toBeGreaterThan(20);
    // '요즘 제일 자주 생각나는 사람' 은 active 를 바꾸는 것이므로 seed 에 남아 있다.
    expect(before.filter((p) => seed.has(p))).toEqual([
      "요즘 제일 자주 생각나는 사람이 누구예요?",
    ]);
  });
});
