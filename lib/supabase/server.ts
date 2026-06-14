import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** 로그인한 사용자 권한으로 동작하는 SSR 클라이언트. RLS가 모든 쿼리에 강제된다. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 에서 호출됨 — proxy 가 세션을 갱신한다
          }
        },
      },
    },
  );
}
