import { createReadOnlyClient } from "@/utils/supabase/server";
import HistoryClientPage from "./HistoryClientPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History | MONUMENT",
  description: "View results and standings from previous games and tournaments.",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createReadOnlyClient();
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug, start_date, is_active')
    .order('start_date', { ascending: false });

  return <HistoryClientPage tournaments={tournaments || []} />;
}
