import { createClient } from "@/lib/supabase/server";
import { MedsView } from "./meds-view";

export default async function MedsPage() {
  const supabase = await createClient();
  const { data: meds } = await supabase
    .from("medications")
    .select("id, name, dose, times")
    .order("created_at");

  return <MedsView meds={meds ?? []} />;
}
