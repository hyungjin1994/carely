import { ensureProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getSignedPhotoUrls } from "@/lib/storage";
import { formatKstHeader } from "@/lib/time";
import { SubHeader } from "@/components/common/sub-header";
import { Icon } from "@/components/common/icon";
import { PhotoUpload } from "./photo-upload";
import { ConnectCodeCard } from "./connect-code-card";

export default async function FamilyPage() {
  const profile = await ensureProfile();
  const supabase = await createClient();

  const [{ data: code }, { data: photos }, { data: link }] = await Promise.all([
    supabase
      .from("connect_codes")
      .select("code, expires_at")
      .eq("mom_id", profile.id)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("photos")
      .select("id, storage_path, caption, created_at")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("family_links")
      .select("id")
      .eq("mom_id", profile.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const photoList = photos ?? [];
  const urls = await getSignedPhotoUrls(photoList.map((p) => p.storage_path));

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

      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "24px 0 12px" }}>내가 올린 사진</div>
      {photoList.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(15px*var(--fs))", padding: "20px 0" }}>아직 올린 사진이 없어요</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {photoList.map((p) => (
            <div key={p.id} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--c-line)" }}>
              <div style={{ height: 110, background: urls[p.storage_path] ? `center/cover no-repeat url(${urls[p.storage_path]})` : "linear-gradient(135deg,#FFB8F3,#E846CD)" }} />
              <div style={{ padding: "10px 12px", background: "var(--c-card)" }}>
                <div style={{ fontSize: "calc(13px*var(--fs))", fontWeight: 700, color: "var(--c-text)", lineHeight: 1.3 }}>{p.caption}</div>
                <div style={{ fontSize: "calc(11px*var(--fs))", color: "var(--c-faint)", marginTop: 3 }}>{formatKstHeader(new Date(p.created_at), "month-day")}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "24px 0 12px" }}>가족이 보낸 소식</div>
      {feed.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px", background: "var(--c-card)", border: "1px dashed #9EC5FF", borderRadius: 18 }}>
          <Icon name="persons" size={22} color="#0066FF" />
          <span style={{ fontSize: "calc(14px*var(--fs))", color: "var(--c-sub)", fontWeight: 600 }}>자녀와 연결하면 소식을 주고받을 수 있어요</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feed.map((f) => {
            const mine = f.from_id === profile.id;
            return (
              <div key={f.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "82%", background: mine ? "#0066FF" : "var(--c-card)", color: mine ? "#fff" : "var(--c-text)", border: mine ? "none" : "1px solid var(--c-line)", borderRadius: 18, padding: "12px 16px" }}>
                  {!mine && <div style={{ fontSize: "calc(12px*var(--fs))", fontWeight: 800, color: "#0066FF", marginBottom: 3 }}>자녀</div>}
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
