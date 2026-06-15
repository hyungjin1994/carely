"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FamilyActionState = { ok?: boolean; error?: string; code?: string };

/** 사진 업로드 → Storage 저장 + photos 행 + 5포인트 적립. */
export async function uploadPhoto(formData: FormData): Promise<FamilyActionState> {
  const file = formData.get("file") as File | null;
  const caption = ((formData.get("caption") as string) || "새로 올린 사진").trim();
  if (!file || file.size === 0) return { error: "사진을 골라주세요" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("photos")
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (upErr) return { error: "업로드에 실패했어요" };

  const { error: rowErr } = await supabase
    .from("photos")
    .insert({ owner_id: user.id, storage_path: path, caption });
  if (rowErr) return { error: "저장에 실패했어요" };

  // +5P (하루 한도 적용)
  await supabase.rpc("award_points", { p_user: user.id, p_raw: 5, p_reason: "photo", p_game_id: "" });

  revalidatePath("/family");
  revalidatePath("/home");
  return { ok: true };
}

/** 어르신 → 관리자 메시지 전송. familyId = family_links.id. RLS 가 멤버십 검증. */
export async function sendFamilyMessage(familyId: string, text: string): Promise<FamilyActionState> {
  const clean = text.trim();
  if (!clean) return { error: "내용을 적어주세요" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { error } = await supabase
    .from("messages")
    .insert({ family_id: familyId, from_id: user.id, text: clean });
  if (error) return { error: "전송에 실패했어요" };

  revalidatePath("/family");
  return { ok: true };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 글자 제외

function randomCode(len = 4): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** 새 연결 코드 발급 (24시간 유효, 충돌 시 재시도). */
export async function rotateConnectCode(): Promise<FamilyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const { error } = await supabase
      .from("connect_codes")
      .insert({ code, senior_id: user.id, expires_at: expires });
    if (!error) {
      revalidatePath("/family");
      return { ok: true, code };
    }
  }
  return { error: "코드 생성에 실패했어요. 다시 시도해 주세요" };
}
