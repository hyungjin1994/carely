import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getTimeline } from "@/lib/queries";
import { SubHeader } from "@/components/common/sub-header";
import { Timeline } from "@/components/family/timeline";
import { PhotoUpload } from "@/app/(app)/family/photo-upload";

export default async function SeniorAlbumPage({
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

  const { data: senior } = await supabase.from("profiles").select("name").eq("id", seniorId).maybeSingle();
  const timeline = await getTimeline([seniorId, profile.id]);

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader title={`${senior?.name ?? "어르신"} 앨범`} href="/connect" />
      <PhotoUpload reward={false} />
      <div style={{ height: 18 }} />
      <Timeline posts={timeline} />
    </div>
  );
}
