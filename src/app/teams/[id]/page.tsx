import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import TeamHistoryClientPage from "./TeamHistoryClientPage";
import { calculateTotalPoints } from "@/utils/scoring";
import type { Metadata } from "next";

import { getMysteryMode } from "@/utils/settings/actions";

export const metadata: Metadata = {
  title: "Team History | CITE FEST",
  description: "View the complete competition history and medal standings of this team.",
};

export const dynamic = "force-dynamic";

export default async function TeamHistoryPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const mysteryMode = await getMysteryMode();
  const supabase = await createClient();
  const resolvedParams = await Promise.resolve(params);
  const teamId = resolvedParams.id;

  // Fetch the department info
  const { data: team, error: teamError } = await supabase
    .from("departments")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    return notFound();
  }

  // Fetch all results for this team
  const { data: results, error: resultsError } = await supabase
    .from("results")
    .select(`
      id,
      medal_type,
      events (
        name,
        category,
        icon,
        division,
        gender
      )
    `)
    .eq("department_id", teamId);

  // Parse leaderboard stats for the overview
  const { data: leaderStats } = await supabase.rpc("get_leaderboard");
  const myStat = leaderStats?.find((s: any) => s.id === teamId) || { golds: 0, silvers: 0, bronzes: 0 };
  const totalPoints = calculateTotalPoints(myStat.golds || 0, myStat.silvers || 0, myStat.bronzes || 0);

  // Fetch categories to resolve category UUIDs map
  const { data: allCategories } = await supabase.from('categories').select('*');

  // Fetch schedules for this team
  const { data: schedules } = await supabase
    .from("schedules")
    .select(`
      id,
      event_id,
      start_time,
      end_time,
      date,
      status,
      departments,
      events (
        name,
        category,
        icon,
        division,
        gender
      )
    `)
    .contains("departments", [team.name]);

  return (
    <TeamHistoryClientPage 
      team={team} 
      results={results || []}
      schedules={schedules || []}
      stats={{ ...myStat, total_points: totalPoints }}
      allCategories={allCategories || []}
      mysteryMode={mysteryMode}
    />
  );
}
