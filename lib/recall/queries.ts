import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatKstIsoDate } from "@/lib/time";
import { fillChildLabel } from "@/lib/korean";
import type { FamilyAnswer, FamilyQuestion } from "@/lib/database.types";

/** 오늘의 질문 한 개. 이미 답하셨으면 그 질문과 답을 함께 준다. */
export type TodayRecall = {
  question: FamilyQuestion;
  /** 오늘 답한 기록. null 이면 아직 답하지 않음. */
  todayAnswer: FamilyAnswer | null;
  /** 이 질문에 예전에 답한 기록 (오늘 것 제외, 최신순). 회상은 반복이 값이므로 보여준다. */
  past: FamilyAnswer[];
};

/**
 * 어머니 화면에 쓸 자녀 호칭.
 * family_links.child_label → 관리자 이름 → "아이" 순으로 떨어진다.
 * 이름을 그대로 쓰면 "형진 좋아하는" 처럼 어색하므로 관리자가 별칭 칸에
 * "형진이" 로 적을 수 있게 해 뒀다(0023).
 */
export async function childLabelFor(seniorId: string): Promise<string> {
  const { stored, fallback } = await childLabelParts(seniorId);
  return stored || fallback;
}

/**
 * 호칭의 저장값과 기본값을 따로 준다 — 관리자 설정 화면에서 "아직 안 정했음"을
 * 보여주려면 둘을 구분해야 한다. 출제에는 childLabelFor 를 쓴다.
 */
export async function childLabelParts(
  seniorId: string,
): Promise<{ stored: string | null; fallback: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("family_links")
    .select("child_label, manager_id")
    .eq("senior_id", seniorId)
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!data) return { stored: null, fallback: "아이" };

  const stored = data.child_label?.trim() || null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", data.manager_id)
    .maybeSingle();
  return { stored, fallback: prof?.name?.trim() || "아이" };
}

function kstDayRange() {
  const today = formatKstIsoDate();
  return {
    start: new Date(`${today}T00:00:00+09:00`).toISOString(),
    end: new Date(`${today}T23:59:59+09:00`).toISOString(),
  };
}

/**
 * 오늘의 질문을 고른다. 하루에 한 개다.
 *
 * 규칙 (무작위 없음 — 같은 날 새로고침해도 같은 질문이 나와야 한다):
 *   1. 오늘 이미 답한 게 있으면 그 질문을 그대로 보여준다.
 *   2. 없으면 active 질문 중에서
 *      · 이번 달 제철 질문(month = 이번 달) 우선 — 김장은 11월, 설날은 2월에
 *      · 그다음 아직 한 번도 답하지 않은 질문
 *      · 그다음 마지막으로 답한 게 가장 오래된 질문
 *
 * 같은 질문을 다시 물어도 된다. "제일 행복했던 순간"의 답이 작년과 올해 다른 것
 * 자체가 기록으로서 값이 있다.
 */
export async function getTodayRecall(seniorId: string): Promise<TodayRecall | null> {
  const supabase = await createClient();
  const label = await childLabelFor(seniorId);

  const { data: questions } = await supabase
    .from("family_questions")
    .select("*")
    .eq("senior_id", seniorId)
    .eq("active", true);

  if (!questions || questions.length === 0) return null;

  const { data: answers } = await supabase
    .from("family_answers")
    .select("*")
    .eq("senior_id", seniorId)
    .order("answered_at", { ascending: false });

  const all = (answers ?? []) as FamilyAnswer[];
  const { start, end } = kstDayRange();
  const todays = all.find((a) => a.answered_at >= start && a.answered_at <= end);

  const pick = (q: FamilyQuestion): TodayRecall => {
    const mine = all.filter((a) => a.question_id === q.id);
    const todayAnswer = mine.find((a) => a.answered_at >= start && a.answered_at <= end) ?? null;
    // {자녀} 자리표시자를 호칭으로 바꿔 내려보낸다. DB 에는 자리표시자가 남는다 —
    // 호칭을 바꾸면 기존 질문도 같이 바뀌어야 하기 때문이다.
    const question = { ...q, prompt: fillChildLabel(q.prompt, label) };
    return { question, todayAnswer, past: mine.filter((a) => a.id !== todayAnswer?.id) };
  };

  // 1. 오늘 이미 답했다면 그 질문.
  if (todays) {
    const q = questions.find((x) => x.id === todays.question_id);
    if (q) return pick(q as FamilyQuestion);
  }

  // 2. 아직 안 답했다면 고른다.
  const lastAnsweredAt = new Map<string, string>();
  for (const a of all) {
    // all 은 최신순이므로 처음 만난 것이 가장 최근이다.
    if (!lastAnsweredAt.has(a.question_id)) lastAnsweredAt.set(a.question_id, a.answered_at);
  }

  const today = formatKstIsoDate();
  const thisMonth = Number(today.slice(5, 7));
  const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00+09:00`).toISOString();

  const rank = (q: FamilyQuestion) => {
    const last = lastAnsweredAt.get(q.id);
    // 제철 우선은 "이번 달에 아직 안 답한 제철 질문"에만 준다.
    // 그냥 month 로만 보면 김장 질문이 11월 30일 내내 1순위가 되어 매일 같은
    // 질문이 나온다.
    const seasonalPending = q.month === thisMonth && !(last && last >= monthStart);
    return {
      seasonal: seasonalPending ? 0 : 1,
      answered: last ? 1 : 0,
      last: last ?? "",
    };
  };

  const sorted = [...(questions as FamilyQuestion[])].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra.seasonal !== rb.seasonal) return ra.seasonal - rb.seasonal;
    if (ra.answered !== rb.answered) return ra.answered - rb.answered;
    if (ra.last !== rb.last) return ra.last < rb.last ? -1 : 1;
    return a.id < b.id ? -1 : 1; // 완전 결정적으로
  });

  return pick(sorted[0]);
}

export type RecallFeedItem = {
  answer: FamilyAnswer;
  prompt: string;
};

/** 자녀용 — 어머니 답변을 최신순으로. 답장 안 한 것이 위로 오지 않고 시간순 그대로다. */
export async function getRecallFeed(seniorId: string, limit = 50): Promise<RecallFeedItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("family_answers")
    .select("*")
    .eq("senior_id", seniorId)
    .order("answered_at", { ascending: false })
    .limit(limit);

  const answers = (data ?? []) as FamilyAnswer[];
  if (answers.length === 0) return [];

  const { data: questions } = await supabase
    .from("family_questions")
    .select("id, prompt")
    .in("id", Array.from(new Set(answers.map((a) => a.question_id))));

  const label = await childLabelFor(seniorId);
  const promptById = new Map((questions ?? []).map((q) => [q.id, q.prompt]));
  return answers.map((answer) => ({
    answer,
    prompt: fillChildLabel(promptById.get(answer.question_id) ?? "(삭제된 질문)", label),
  }));
}

/**
 * 답장을 기다리는 답변 수 (자녀 대시보드 뱃지용).
 * 어머니가 답했는데 반응이 없는 상태가 이 기능의 가장 나쁜 실패라서 눈에 보이게 한다.
 * 건너뛴 기록(text 없음)은 답장할 게 없으므로 세지 않는다.
 */
export async function getUnrepliedCount(seniorId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("family_answers")
    .select("id", { count: "exact", head: true })
    .eq("senior_id", seniorId)
    .is("reply_text", null)
    .not("text", "is", null);
  return count ?? 0;
}
