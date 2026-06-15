"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginSchema, SignupSchema } from "@/lib/auth/schemas";
import { idToEmail } from "@/lib/auth/ids";

export type AuthState = { error?: string };

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: idToEmail(parsed.data.loginId),
    password: parsed.data.password,
  });
  if (error) {
    return { error: "아이디 또는 비밀번호를 확인해 주세요" };
  }

  redirect("/home");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    loginId: formData.get("loginId"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role") ?? "parent",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요" };
  }

  const { name, loginId, password, role } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: idToEmail(loginId),
    password,
    options: { data: { name, role } },
  });
  if (error) {
    const dup = /registered|already|exists/i.test(error.message);
    return { error: dup ? "이미 사용 중인 아이디예요" : "가입에 실패했어요. 다시 시도해 주세요" };
  }

  // 이메일 확인이 꺼져 있으면 즉시 세션 발급 → 역할별 홈으로.
  if (data.session) {
    redirect(role === "manager" ? "/connect" : "/home");
  }
  // 이메일 확인이 켜진 경우 로그인 화면으로 안내.
  redirect("/login?check=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
