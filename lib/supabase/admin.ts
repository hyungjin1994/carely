import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * service-role 클라이언트 — RLS 를 우회한다.
 * 크론(여러 사용자 대상 알림 발송) 등 시스템 작업에만 사용.
 * 절대 클라이언트 번들에 임포트하지 말 것 (server-only 로 강제).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY / URL 이 설정되지 않았습니다");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
