import { defineConfig } from "vitest/config";


export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
      // quiz-bank 은 server-only 로 잠겨 있다. Next 빌드에서는 그게 의도지만
      // 테스트에서는 그냥 빈 모듈로 대체한다 — 은행·출제 로직은 순수 함수라
      // 서버 없이도 검증할 수 있다.
      "server-only": `${import.meta.dirname}/tests/stubs/server-only.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
