import { createReadOnlyClient } from "@/utils/supabase/server";
import { calculateTotalPoints } from "@/utils/scoring";
import LeaderboardClientPage from "./LeaderboardClientPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podium & Leaderboard | SIDLAK",
  description: "See the real-time department standings, medal counts, and total points for the SIDLAK intramurals. Who will take the podium?",
  openGraph: {
    title: "Podium & Leaderboard | SIDLAK",
    description: "Real-time department standings for the SIDLAK intramurals.",
  },
};

export const revalidate = 60; // Revalidate data every 60 seconds

interface LeaderboardRow {
  id: string;
  name: string;
  image_url?: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

export default async function ScoreboardPage() {
  const supabase = await createReadOnlyClient();

  const fetchLeaderboard = async (): Promise<LeaderboardRow[]> => {
    const { data, error } = await supabase.rpc('get_leaderboard');
    if (error || !data) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
    
    const calculated = (data as any[]).map((row: any) => ({
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