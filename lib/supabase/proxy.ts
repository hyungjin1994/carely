import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isManager as roleIsManager, normalizeRole } from "@/lib/roles";

/**
 * 매 요청마다 auth 쿠키를 갱신하고 역할 기반으로 라우트를 게이팅한다.
 * Next.js 16 은 `middleware` → `proxy` 로 이름이 바뀌었다. 런타임은 Node.js.
 *
 * 역할(role)은 회원가입 트리거가 app_metadata 에 심어 JWT 로 전달된다.
 *  - parent | grandparent → 어르신 앱 (/home, /games, ...)
 *  - manager              → 관리자 화면 (/connect)
 * 옛값 mom→어르신, child→관리자 는 normalizeRole 로 하위호환 처리(JWT 갱신 전 대응).
 */
const AUTH_ROUTES = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = isAuthRoute || pathname === "/";

  // 비로그인 → 로그인으로 (공개 경로 제외)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const rawRole =
      (user.app_metadata?.role as string | undefined) ??
      (user.user_metadata?.role as string | undefined);
    const isManager = roleIsManager(normalizeRole(rawRole));
    const home = isManager ? "/connect" : "/home";

    // 로그인 상태에서 auth 경로 접근 → 역할별 홈으로
    if (isAuthRoute || pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      url.searchParams.delete("next");
      return NextResponse.redirect(url);
    }

    // 관리자가 어르신 전용 경로 접근 → /connect
    if (isManager && !pathname.startsWith("/connect")) {
      const url = request.nextUrl.clone();
      url.pathname = "/connect";
      return NextResponse.redirect(url);
    }

    // 어르신이 /connect 접근 → /home
    if (!isManager && pathname.startsWith("/connect")) {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
