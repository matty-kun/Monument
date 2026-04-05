import { createReadOnlyClient } from "@/utils/supabase/server";
import { calculateTotalPoints } from "@/utils/scoring";
import LeaderboardClientPage from "./LeaderboardClientPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://citefest.vercel.app"),
  title: "Podium | CITE FEST",
  description: "See the real-time team standings, medal counts, and total points for the CITE FEST test. Who will take the podium?",
  openGraph: {
    title: "Podium | CITE FEST",
    description: "Real-time team standings for the CITE FEST test.",
  },
};

export const dynamic = "force-dynamic";

interface LeaderboardRow {
  id: string;
  name: string;
  abbreviation: string | null;
  image_url?: string;
  mascot_url?: string | null;
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
    
    // 2. Fetch all departments to get abbreviations and mascots
    const { data: departments, error: deptError } = await supabase.from('departments').select('id, abbreviation, mascot_url');
    if (deptError) {
      console.error("Error fetching department abbreviations:", deptError);
    }
    
    const deptMetaMap = new Map((departments as any[])?.map(d => [d.id, { abbr: d.abbreviation, mascot: d.mascot_url }]) || []);

    if (!Array.isArray(stats)) return [];

    const calculated = stats.map((row: LeaderboardRpcResponse) => ({
      ...row,
      abbreviation: deptMetaMap.get(row.id)?.abbr || null,
      mascot_url: deptMetaMap.get(row.id)?.mascot || null,
      total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
    }));
    return calculated;
  };
  
  const leaderboard = await fetchLeaderboard();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <LeaderboardClientPage initialLeaderboard={leaderboard} />
    </div>
  );
}