import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { childLabelParts, getRecallFeed, listAlbumPhotos } from "@/lib/recall/queries";
import { SubHeader } from "@/components/common/sub-header";
import { ChildLabel } from "./child-label";
import { RecallFeed, type FeedRow } from "./recall-feed";

// 인증·사용자별 데이터 + 권한 검사 — 항상 동적.
export const dynamic = "force-dynamic";

export default async function SeniorRecallPage({
  params,
}: {
  params: Promise<{ seniorId: string }>;
}) {
  const { seniorId } = await params;
  const profile = await ensureProfile();
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("family_links")
    .select("id")
    .eq("manager_id", profile.id)
    .eq("senior_id", seniorId)
    .eq("status", "active")
    .maybeSingle();
  if (!link) redirect("/connect");

  const [{ data: senior }, feed, { count }, childLabel, photos] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", seniorId).maybeSingle(),
    getRecallFeed(seniorId),
    supabase
      .from("family_questions")
      .select("id", { count: "exact", head: true })
      .eq("senior_id", seniorId)
      .eq("active", true),
    childLabelParts(seniorId),
    // 사진 질문을 낼 때 고를 목록 — 어머니 앨범 + 내가 올린 것.
    listAlbumPhotos([seniorId, profile.id]),
  ]);

  const seniorName = senior?.name ?? "어르신";
  const rows: FeedRow[] = feed.map((f) => ({
    answerId: f.answer.id,
    prompt: f.prompt,
    text: f.answer.text,
    answeredAt: f.answer.answered_at,
    replyText: f.answer.reply_text,
    photoUrl: f.photoUrl,
  }));

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader title={`${seniorName} 이야기`} href="/connect" />
      <div style={{ marginBottom: 14 }}>
        <ChildLabel
          seniorId={seniorId}
          seniorName={seniorName}
          current={childLabel.stored}
          fallback={childLabel.fallback}
        />
      </div>
      <RecallFeed
        seniorId={seniorId}
        seniorName={seniorName}
        rows={rows}
        questionCount={count ?? 0}
        photos={photos}
      />
    </div>
  );
}
