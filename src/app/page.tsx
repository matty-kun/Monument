import { createReadOnlyClient } from "@/utils/supabase/server";
import { calculateTotalPoints } from "@/utils/scoring";
import LeaderboardClientPage from "./LeaderboardClientPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podium & Leaderboard | MONUMENT",
  description: "See the real-time department standings, medal counts, and total points for the SIDLAK intramurals. Who will take the podium?",
  openGraph: {
    title: "Podium & Leaderboard | MONUMENT",
    description: "Real-time department standings for the SIDLAK intramurals.",
  },
};

export const revalidate = 60; // Revalidate data every 60 seconds

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
    // Specify the type for the RPC response
    const { data, error } = await supabase.rpc('get_leaderboard').returns<LeaderboardRpcResponse[]>();
    if (error || !data) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
    
    // Type guard to ensure data is an array before using .map()
    if (!Array.isArray(data)) {
      console.error("Expected an array from get_leaderboard RPC, but got:", data);
      return [];
    }

    const calculated = data.map((row) => ({
      ...row,
      total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
    }));
    return calculated;
  };
  
  const leaderboard = await fetchLeaderboard();

  return (
    <LeaderboardClientPage initialLeaderboard={leaderboard} />
  );
}