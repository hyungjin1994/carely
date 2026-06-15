import { createClient } from "@/lib/supabase/server";
import { MeasureView, type MeasureRow } from "./measure-view";

export default async function MeasurePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("measurements")
    .select("id, kind, v1, v2, v3, memo, measured_at")
    .order("measured_at", { ascending: false })
    .limit(30);

  return <MeasureView recent={(data ?? []) as MeasureRow[]} />;
}
