import { ensureProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getTimeline } from "@/lib/queries";
import { formatKstHeader } from "@/lib/time";
import { SubHeader } from "@/components/common/sub-header";
import { Icon } from "@/components/common/icon";
import { Timeline } from "@/components/family/timeline";
import { PhotoUpload } from "./photo-upload";
import { ConnectCodeCard } from "./connect-code-card";
import { FamilyCompose } from "./family-compose";

export default async function FamilyPage() {
  const profile = await ensureProfile();
  const supabase = await createClient();

  const [{ data: code }, { data: link }, timeline] = await Promise.all([
    supabase
      .from("connect_codes")
      .select("code, expires_at")
      .eq("senior_id", profile.id)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("family_links")
      .select("id")
      .eq("senior_id", profile.id)
      .eq("status", "active")
      .maybeSingle(),
    getTimeline(),
  ]);

  let feed: { id: string; text: string; from_id: string; created_at: string }[] = [];
  if (link) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, text, from_id, created_at")
      .eq("family_id", link.id)
      .order("created_at", { ascending: false })
      .limit(20);
    feed = msgs ?? [];
  }

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader title="가족" href="/home" />

      <PhotoUpload />

      <ConnectCodeCard initialCode={code?.code ?? null} />

      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "24px 0 12px" }}>가족 앨범</div>
      <Timeline posts={timeline} />

      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "24px 0 12px" }}>가족 소식</div>
      {link && <FamilyCompose familyId={link.id} />}
      {feed.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px", background: "var(--c-card)", border: "1px dashed #9EC5FF", borderRadius: 18 }}>
          <Icon name="persons" size={22} color="#0066FF" />
          <span style={{ fontSize: "calc(14px*var(--fs))", color: "var(--c-sub)", fontWeight: 600 }}>관리자와 연결하면 소식을 주고받을 수 있어요</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feed.map((f) => {
            const mine = f.from_id === profile.id;
            return (
              <div key={f.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "82%", background: mine ? "#0066FF" : "var(--c-card)", color: mine ? "#fff" : "var(--c-text)", border: mine ? "none" : "1px solid var(--c-line)", borderRadius: 18, padding: "12px 16px" }}>
                  {!mine && <div style={{ fontSize: "calc(12px*var(--fs))", fontWeight: 800, color: "#0066FF", marginBottom: 3 }}>관리자</div>}
                  <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 500, lineHeight: 1.45 }}>{f.text}</div>
                  <div style={{ fontSize: "calc(11px*var(--fs))", opacity: 0.7, marginTop: 4, textAlign: "right" }}>{formatKstHeader(new Date(f.created_at), "month-day")}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
