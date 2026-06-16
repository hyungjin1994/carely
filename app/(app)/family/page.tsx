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

  const [{ data: code }, { data: links }, timeline] = await Promise.all([
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
      .select("id, manager_id, created_at")
      .eq("senior_id", profile.id)
      .eq("status", "active")
      .order("created_at"),
    getTimeline(),
  ]);
  const link = (links ?? [])[0] ?? null;

  // 연결된 관리자(가족) 목록 + 연결 날짜
  let managers: { name: string; at: string }[] = [];
  const mgrIds = (links ?? []).map((l) => l.manager_id);
  if (mgrIds.length) {
    const { data: profs } = await supabase.from("profiles").select("id, name").in("id", mgrIds);
    const nameOf = new Map((profs ?? []).map((p) => [p.id, p.name ?? "관리자"]));
    managers = (links ?? []).map((l) => ({ name: nameOf.get(l.manager_id) ?? "관리자", at: l.created_at }));
  }

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

      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "24px 0 12px" }}>연결된 가족</div>
      {managers.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(14px*var(--fs))", padding: "16px 0", lineHeight: 1.5 }}>
          아직 연결된 가족이 없어요.
          <br />위 코드를 가족에게 알려주세요.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {managers.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 16, padding: "12px 14px" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "#EAF2FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="person-fill" size={22} color="#0066FF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{m.name}</div>
                <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>{formatKstHeader(new Date(m.at), "month-day")} 연결됨</div>
              </div>
              <span style={{ fontSize: "calc(12px*var(--fs))", fontWeight: 800, color: "#0066FF", background: "#EAF2FE", padding: "5px 10px", borderRadius: 9 }}>관리자</span>
            </div>
          ))}
        </div>
      )}

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
