import "server-only";

import { createClient } from "@/lib/supabase/server";

/** 비공개 photos 버킷의 서명 URL (1시간). */
export async function getSignedPhotoUrl(
  path: string | null,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("photos")
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function getSignedPhotoUrls(
  paths: string[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("photos")
    .createSignedUrls(paths, expiresIn);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}
