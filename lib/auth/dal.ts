import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/database.types";

/** Supabase 세션 검증 후 auth user 반환. 렌더당 메모이즈. */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email ?? null, authUser: user };
});

/**
 * profiles 행을 보장한다. 보통은 handle_new_user 트리거가 만들지만,
 * 방어적으로 없으면 user_metadata 로 생성한다.
 */
export const ensureProfile = cache(async (): Promise<Profile> => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .maybeSingle();

  if (existing) return existing as Profile;

  const meta = session.authUser.user_metadata ?? {};
  const role: Role = meta.role === "child" ? "child" : "mom";
  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: session.userId, name: meta.name ?? null, role })
    .select("*")
    .single();

  return created as Profile;
});

/** 역할 검증. 어긋나면 역할별 홈으로 리다이렉트. */
export async function requireRole(role: Role): Promise<Profile> {
  const profile = await ensureProfile();
  if (profile.role !== role) {
    redirect(profile.role === "child" ? "/connect" : "/home");
  }
  return profile;
}
