import { ensureProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getSignedPhotoUrl } from "@/lib/storage";
import { ConnectEntry } from "./connect-entry";
import { ChildDashboard } from "./child-dashboard";

export default async function ConnectPage() {
  const profile = await ensureProfile();
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("family_links")
    .select("id, mom_id")
    .eq("child_id", profile.id)
    .eq("status", "active")
    .maybeSingle();

  if (!link) {
    return <ConnectEntry />;
  }

  const [{ data: mom }, { data: pending }, { data: photo }, { data: msgs }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", link.mom_id).maybeSingle(),
    supabase
      .from("exchange_requests")
      .select("id, amount, created_at")
      .eq("user_id", link.mom_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("photos")
      .select("storage_path, caption, created_at")
      .eq("owner_id", link.mom_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, text, from_id, created_at")
      .eq("family_id", link.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const photoUrl = await getSignedPhotoUrl(photo?.storage_path ?? null);

  return (
    <ChildDashboard
      momName={mom?.name ?? "어머니"}
      myId={profile.id}
      pending={(pending ?? []).map((p) => ({
        id: p.id,
        amount: p.amount,
        when: p.created_at,
      }))}
      photoUrl={photoUrl}
      photoCaption={photo?.caption ?? null}
      feed={(msgs ?? []).map((m) => ({ id: m.id, text: m.text, mine: m.from_id === profile.id }))}
    />
  );
}
