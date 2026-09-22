"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth/dal";

const MAX_REPLY = 1000;
const MAX_PROMPT = 300;
/** 호칭은 짧다. 길게 넣으면 질문 문구가 읽히지 않는다. */
const MAX_CHILD_LABEL = 20;

/** 연결이 살아 있는지 확인. 없으면 아무 것도 못 하게 막는다(RLS 와 이중). */
async function assertLinked(seniorId: string) {
  const profile = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase
    .from("family_links")
    .select("id")
    .eq("manager_id", profile.id)
    .eq("senior_id", seniorId)
    .eq("status", "active")
    .maybeSingle();
  return data ? { profile, supabase } : null;
}

/**
 * 어머니 답변에 답장한다.
 *
 * 채점이 아니라 답장이다 — 맞았다/틀렸다를 고르는 UI 를 두지 않았다.
 * 어머니가 당신 고향이나 자식 이름을 잘못 기억하셨을 때 오답 표시를 띄우는 것은
 * 해롭고, 애초에 이 기능은 맞히기가 목적이 아니다.
 */
export async function replyRecall(input: {
  seniorId: string;
  answerId: string;
  text: string;
}): Promise<{ error?: string }> {
  const ctx = await assertLinked(input.seniorId);
  if (!ctx) return { error: "연결된 가족이 아니에요" };

  const text = input.text.trim().slice(0, MAX_REPLY);
  if (!text) return { error: "답장 내용을 적어주세요" };

  const { error } = await ctx.supabase
    .from("family_answers")
    .update({
      reply_text: text,
      replied_by: ctx.profile.id,
      replied_at: new Date().toISOString(),
    })
    .eq("id", input.answerId)
    .eq("senior_id", input.seniorId);
  if (error) return { error: "답장을 보내지 못했어요" };

  revalidatePath(`/connect/${input.seniorId}/recall`);
  revalidatePath("/connect");
  return {};
}

/** 질문을 새로 낸다. 83개 seed 는 3개월치이고, 그 뒤로는 직접 채워야 한다. */
export async function addRecallQuestion(input: {
  seniorId: string;
  prompt: string;
  month: number | null;
}): Promise<{ error?: string }> {
  const ctx = await assertLinked(input.seniorId);
  if (!ctx) return { error: "연결된 가족이 아니에요" };

  const prompt = input.prompt.trim().slice(0, MAX_PROMPT);
  if (!prompt) return { error: "질문을 적어주세요" };

  const { error } = await ctx.supabase.from("family_questions").insert({
    senior_id: input.seniorId,
    author_id: ctx.profile.id,
    prompt,
    month: input.month,
  });
  if (error) {
    // unique(senior_id, prompt) 위반 — 같은 질문을 이미 낸 경우.
    return { error: error.code === "23505" ? "이미 낸 질문이에요" : "질문을 추가하지 못했어요" };
  }

  revalidatePath(`/connect/${input.seniorId}/recall`);
  return {};
}

/** 질문을 목록에서 내린다. 지우지 않는 이유는 답변 기록이 살아 있어야 하기 때문. */
export async function toggleRecallQuestion(input: {
  seniorId: string;
  questionId: string;
  active: boolean;
}): Promise<{ error?: string }> {
  const ctx = await assertLinked(input.seniorId);
  if (!ctx) return { error: "연결된 가족이 아니에요" };

  const { error } = await ctx.supabase
    .from("family_questions")
    .update({ active: input.active })
    .eq("id", input.questionId)
    .eq("senior_id", input.seniorId);
  if (error) return { error: "바꾸지 못했어요" };

  revalidatePath(`/connect/${input.seniorId}/recall`);
  return {};
}

/**
 * 어머니 화면에 보일 자녀 호칭을 정한다.
 *
 * 질문 문구에는 `{자녀}` 자리표시자가 들어가 있고(0023 · lib/korean.ts), 출제할 때
 * 이 값으로 바뀐다. 문구가 아니라 호칭만 바꾸는 것이므로 이미 쌓인 답변 기록은
 * 그대로 있고, 예전 질문도 새 호칭으로 다시 읽힌다.
 *
 * 읽히는 그대로 적게 한다 — "형진이" · "아들" · "큰딸". 조사는 앱이 고른다.
 * 비우면 관리자 이름을 쓰고, 그것도 없으면 "아이" 로 채운다.
 */
export async function setChildLabel(input: {
  seniorId: string;
  label: string;
}): Promise<{ error?: string }> {
  const ctx = await assertLinked(input.seniorId);
  if (!ctx) return { error: "연결된 가족이 아니에요" };

  const label = input.label.trim().slice(0, MAX_CHILD_LABEL);
  const { error } = await ctx.supabase
    .from("family_links")
    .update({ child_label: label || null })
    .eq("manager_id", ctx.profile.id)
    .eq("senior_id", input.seniorId);
  if (error) return { error: "호칭을 바꾸지 못했어요" };

  revalidatePath(`/connect/${input.seniorId}/recall`);
  revalidatePath("/"); // 어머니 홈의 오늘 질문
  return {};
}
