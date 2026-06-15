import { ensureProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getSignedPhotoUrl } from "@/lib/storage";
import { getSeniorSummary, getLatestMeasurements } from "@/lib/queries";
import type { Role } from "@/lib/database.types";
import { ConnectEntry } from "./connect-entry";
import { ManagerDashboard, type SeniorView } from "./child-dashboard";

export default async function ConnectPage() {
  const profile = await ensureProfile();
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("family_links")
    .select("id, senior_id")
    .eq("manager_id", profile.id)
    .eq("status", "active");

  if (!links || links.length === 0) {
    return <ConnectEntry />;
  }

  const seniors: SeniorView[] = await Promise.all(
    links.map(async (l) => {
      const sid = l.senior_id;
      const [{ data: prof }, summary, measurements, { data: pending }, { data: photo }, { data: msgs }] =
        await Promise.all([
          supabase.from("profiles").select("name, role").eq("id", sid).maybeSingle(),
          getSeniorSummary(sid),
          getLatestMeasurements(sid),
          supabase
            .from("exchange_requests")
            .select("id, amount, created_at")
            .eq("user_id", sid)
            .eq("status", "pending")
            .order("created_at", { ascending: false }),
          supabase
            .from("photos")
            .select("storage_path, caption, created_at")
            .eq("owner_id", sid)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("messages")
            .select("id, text, from_id, created_at")
            .eq("family_id", l.id)
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

      const photoUrl = await getSignedPhotoUrl(photo?.storage_path ?? null);
      return {
        linkId: l.id,
        seniorId: sid,
        name: prof?.name ?? "어르신",
        role: (prof?.role ?? "parent") as Role,
        summary,
        measurements,
        pending: (pending ?? []).map((p) => ({ id: p.id, amount: p.amount })),
        photoUrl,
        photoCaption: photo?.caption ?? null,
        feed: (msgs ?? []).map((m) => ({ id: m.id, text: m.text, mine: m.from_id === profile.id })),
      };
    }),
  );

  return <ManagerDashboard seniors={seniors} />;
}
