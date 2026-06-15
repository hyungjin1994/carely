import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/database.types";
import { normalizeRole } from "@/lib/roles";

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
  const role: Role = normalizeRole(meta.role);
  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: session.userId, name: meta.name ?? null, role })
    .select("*")
    .single();

  return created as Profile;
});

/** 어르신(부모님·조부모님) 전용. 관리자면 관리자 홈으로. */
export async function requireSenior(): Promise<Profile> {
  const profile = await ensureProfile();
  if (profile.role === "manager") {
    redirect("/connect");
  }
  return profile;
}

/** 관리자 전용. 어르신이면 어르신 홈으로. */
export async function requireManager(): Promise<Profile> {
  const profile = await ensureProfile();
  if (profile.role !== "manager") {
    redirect("/home");
  }
  return profile;
}
