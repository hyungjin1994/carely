import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // /api/* 는 각 라우트가 자체 인증(쿠키/Bearer) 처리하므로 proxy 제외 (크론 차단 방지)
    "/((?!api/|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/.*|icon.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
