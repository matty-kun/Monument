import { createReadOnlyClient } from "@/utils/supabase/server";
import { calculateTotalPoints } from "@/utils/scoring";
import LeaderboardClientPage from "./LeaderboardClientPage";
import { getMysteryMode } from "@/utils/settings/actions";
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

export default async function ScoreboardPage({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
  const supabase = await createReadOnlyClient();
  const resolvedParams = await searchParams;
  const tSlug = resolvedParams?.tournament;

  // 1. Fetch tournament to resolve ID and name. If no slug, active tournament is used by default in RPC, but we want the name.
  let tournamentId: string | undefined;
  let tournamentName = "CITE FEST 2026";
  let mysteryMode = false;

  if (tSlug) {
    const { data: tData } = await supabase.from('tournaments').select('id, name, mystery_mode').eq('slug', tSlug).single();
    if (tData) {
      tournamentId = tData.id;
      tournamentName = tData.name;
      mysteryMode = tData.mystery_mode;
    }
  } else {
    const { data: activeT } = await supabase.from('tournaments').select('id, name, mystery_mode').eq('is_active', true).single();
    if (activeT) {
      tournamentId = activeT.id;
      tournamentName = activeT.name;
      mysteryMode = activeT.mystery_mode;
    }
  }

  if (!tournamentId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-monument-primary blur-[100px] opacity-20 rounded-full"></div>
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 tracking-[0.1em] uppercase relative z-10">
            MONUMENT
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm md:text-base max-w-lg leading-relaxed">
          The season has concluded. <br/>
          Check back later for upcoming intramurals, or explore the archives above.
        </p>
      </div>
    );
  }

  const fetchLeaderboard = async (): Promise<LeaderboardRow[]> => {
    // 1. Fetch the stats from the RPC (using specific ID if available)
    const { data: stats, error: statsError } = tournamentId 
      ? await supabase.rpc('get_leaderboard_by_tournament', { p_tournament_id: tournamentId }).returns<LeaderboardRpcResponse[]>()
      : await supabase.rpc('get_leaderboard').returns<LeaderboardRpcResponse[]>();

    if (statsError || !stats) {
      console.error("Error fetching leaderboard stats:", statsError);
      return [];
    }
    
    // 2. Fetch all tournament departments to get abbreviations, logos and mascots
    const { data: departments, error: deptError } = await supabase.from('tournament_departments')
      .select('department_id, abbreviation, image_url, mascot_url')
      .eq('tournament_id', tournamentId);
    if (deptError) {
      console.error("Error fetching department abbreviations:", deptError);
    }
    
    const deptMetaMap = new Map((departments as any[])?.map(d => [d.department_id, { abbr: d.abbreviation, image: d.image_url, mascot: d.mascot_url }]) || []);

    if (!Array.isArray(stats)) return [];

    const calculated = stats.map((row: LeaderboardRpcResponse) => ({
      ...row,
      abbreviation: deptMetaMap.get(row.id)?.abbr || null,
      image_url: deptMetaMap.get(row.id)?.image || row.image_url,
      mascot_url: deptMetaMap.get(row.id)?.mascot || null,
      total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
    }));
    return calculated;
  };
  
  const leaderboard = await fetchLeaderboard();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <LeaderboardClientPage 
        initialLeaderboard={leaderboard} 
        initialMysteryMode={mysteryMode} 
        tournamentId={tournamentId} 
        tournamentName={tournamentName}
      />
    </div>
  );
}