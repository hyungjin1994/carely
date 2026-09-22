/**
 * `.claude/skills/` 링크를 다시 만든다.
 *
 *   node scripts/restore-skills.mjs
 *
 * ── 왜 이 스크립트가 필요한가 ──
 * `.agents/skills/` 에는 스킬 29개가 들어 있지만, Claude Code 가 자동으로 읽는 건
 * `.claude/skills/` 아래다. 이 프로젝트는 그중 필요한 10개만 링크해 둔다
 * (redis·remotion·react-native 등 나머지는 Carely 와 무관해서 노출하지 않는다).
 *
 * 그 링크 자체는 커밋하지 않는다. Windows 는 보통 `core.symlinks=false` 라
 * 심볼릭 링크가 **절대경로 한 줄이 든 텍스트 파일**로 커밋되고, 다른 기계에서
 * clone 하면 경로가 안 맞아 아무 것도 안 읽힌다. 그래서 목록만 `.claude/skills.json`
 * 에 남기고 링크는 여기서 다시 만든다.
 *
 * 심볼릭 링크 생성은 Windows 에서 권한이 필요할 수 있다. 실패하면 복사로 떨어진다 —
 * 스킬은 읽기 전용이라 복사본이어도 동작에 차이가 없다.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const listPath = join(root, ".claude", "skills.json");
const srcDir = join(root, ".agents", "skills");
const dstDir = join(root, ".claude", "skills");

if (!existsSync(listPath)) {
  console.error(`목록이 없다: ${listPath}`);
  process.exit(1);
}

const names = JSON.parse(readFileSync(listPath, "utf8"));
mkdirSync(dstDir, { recursive: true });

let linked = 0;
let copied = 0;
const missing = [];

for (const name of names) {
  const src = join(srcDir, name);
  const dst = join(dstDir, name);

  if (!existsSync(src)) {
    missing.push(name);
    continue;
  }
  // 이미 있으면 지우고 다시 만든다 — 끊긴 링크가 남아 있을 수 있다.
  try {
    if (lstatSync(dst)) rmSync(dst, { recursive: true, force: true });
  } catch {
    // 없으면 그만
  }

  try {
    symlinkSync(src, dst, "dir");
    linked++;
  } catch {
    cpSync(src, dst, { recursive: true });
    copied++;
  }
}

console.log(`링크 ${linked} · 복사 ${copied}${missing.length ? ` · 누락 ${missing.length}` : ""}`);
if (missing.length) {
  console.error(`\n.agents/skills 에 없다: ${missing.join(", ")}`);
  console.error("스킬을 다시 받은 뒤(skills-lock.json 참고) 이 스크립트를 다시 돌린다.");
  process.exit(1);
}
