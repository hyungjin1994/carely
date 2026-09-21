"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSenior } from "@/lib/auth/dal";

/** 답변 길이 상한. 말이 길어질 수 있으니 넉넉하게. */
const MAX_LEN = 2000;

/**
 * 어머니가 오늘의 질문에 답한다.
 *
 * text 가 비어 있으면 "건너뜀"으로 기록한다 — 지우지 않고 행을 남기는 이유는
 * 그것도 출제 이력이기 때문이다(물었지만 답하지 않은 질문을 구분해야 한다).
 *
 * 포인트를 주지 않는다. 포인트가 붙으면 정오 판정이 따라오고, 맞히기 게임이 되어
 * 버린다. 이 기능의 목적은 질문을 읽고 떠올리시게 하는 것까지다.
 */
export async function answerRecall(input: {
  questionId: string;
  text: string;
}): Promise<{ error?: string }> {
  const profile = await requireSenior();
  const supabase = await createClient();

  const text = input.text.trim().slice(0, MAX_LEN);

  // 질문이 정말 이 어머니의 것인지 확인한다 (RLS 가 막아주지만 메시지를 위해).
  const { data: question } = await supabase
    .from("family_questions")
    .select("id")
    .eq("id", input.questionId)
    .eq("senior_id", profile.id)
    .maybeSingle();
  if (!question) return { error: "질문을 찾지 못했어요" };

  const { error } = await supabase.from("family_answers").insert({
    question_id: input.questionId,
    senior_id: profile.id,
    text: text.length > 0 ? text : null,
  });
  if (error) return { error: "답변을 보내지 못했어요" };

  revalidatePath("/recall");
  revalidatePath("/home");
  return {};
}
