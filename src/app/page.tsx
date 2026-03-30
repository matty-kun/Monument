import { createReadOnlyClient } from "@/utils/supabase/server";
import { calculateTotalPoints } from "@/utils/scoring";
import LeaderboardClientPage from "./LeaderboardClientPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podium & Leaderboard | CITE FEST",
  description: "See the real-time team standings, medal counts, and total points for the CITE FEST test. Who will take the podium?",
  openGraph: {
    title: "Podium & Leaderboard | CITE FEST",
    description: "Real-time team standings for the CITE FEST test.",
  },
};

export const dynamic = "force-dynamic";

interface LeaderboardRow {
  id: string;
  name: string;
  abbreviation: string | null;
  image_url?: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

type LeaderboardRpcResponse = Omit<LeaderboardRow, 'total_points'>;

export default async function ScoreboardPage() {
  const supabase = await createReadOnlyClient();

  const fetchLeaderboard = async (): Promise<LeaderboardRow[]> => {
    // 1. Fetch the stats from the RPC
    const { data: stats, error: statsError } = await supabase.rpc('get_leaderboard').returns<LeaderboardRpcResponse[]>();
    if (statsError || !stats) {
      console.error("Error fetching leaderboard stats:", statsError);
      return [];
    }
    
    // 2. Fetch all departments to get abbreviations (courses)
    const { data: departments, error: deptError } = await supabase.from('departments').select('id, abbreviation');
    if (deptError) {
      console.error("Error fetching department abbreviations:", deptError);
    }
    
    const abbrMap = new Map((departments as any[])?.map(d => [d.id, d.abbreviation]) || []);

    if (!Array.isArray(stats)) return [];

    const calculated = stats.map((row: LeaderboardRpcResponse) => ({
      ...row,
      abbreviation: abbrMap.get(row.id) || null,
      total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
    }));
    return calculated;
  };
  
  const leaderboard = await fetchLeaderboard();

  return (
    <LeaderboardClientPage initialLeaderboard={leaderboard} />
  );
}