import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 서버 액션 본문 한도 (기본 1MB) — 사진 업로드 대비 상향.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
