import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { calculateTotalPoints } from "@/utils/scoring";
import { LeaderboardRow, LeaderboardRPCData } from "../models/leaderboardTypes";
import { getTournamentRealtimeFilter, readMysteryMode } from "@/utils/tournamentRealtime";

interface UseLeaderboardViewModelProps {
  initialLeaderboard: LeaderboardRow[];
  initialMysteryMode: boolean;
  tournamentId?: string;
}

export const useLeaderboardViewModel = ({
  initialLeaderboard,
  initialMysteryMode,
  tournamentId,
}: UseLeaderboardViewModelProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>(initialLeaderboard);
  const [mysteryMode, setMysteryMode] = useState<boolean>(initialMysteryMode);
  
  const supabase = createClient();

  useEffect(() => {
    setLeaderboard(initialLeaderboard);
  }, [initialLeaderboard]);

  const fetchLeaderboard = useCallback(async () => {
    const [statsResponse, deptResponse] = await Promise.all([
      tournamentId
        ? supabase.rpc("get_leaderboard_by_tournament", { p_tournament_id: tournamentId })
        : supabase.rpc("get_leaderboard"),
      supabase
        .from('tournament_departments')
        .select('department_id, abbreviation, image_url, mascot_url')
        .eq('tournament_id', tournamentId)
    ]);

    const { data: stats, error: statsError } = statsResponse;
    const { data: departments, error: deptError } = deptResponse;

    if (statsError || !stats) {
      console.error("Error fetching leaderboard stats:", statsError);
      return;
    }

    if (deptError) {
      console.error("Error fetching abbreviations:", deptError);
    }

    const deptMetaMap = new Map((departments as any[])?.map(d => [d.department_id, { abbr: d.abbreviation, image: d.image_url, mascot: d.mascot_url }]) || []);

    if (!Array.isArray(stats)) return;

    const calculated = stats
      .filter((row: LeaderboardRPCData) => row.name !== "No Team")
      .map((row: LeaderboardRPCData) => ({
        ...row,
        abbreviation: deptMetaMap.get(row.id)?.abbr || null,
        image_url: deptMetaMap.get(row.id)?.image || row.image_url,
        mascot_url: deptMetaMap.get(row.id)?.mascot || null,
        total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
      }));
    setLeaderboard(calculated);
  }, [supabase, tournamentId]);

  useEffect(() => {
    const resultsChannel = supabase
      .channel("results-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results", filter: `tournament_id=eq.${tournamentId}` }, fetchLeaderboard)
      .subscribe();

    const departmentsChannel = supabase
      .channel("departments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_departments", filter: `tournament_id=eq.${tournamentId}` }, fetchLeaderboard)
      .subscribe();

    // 🔮 Subscribe to Mystery Mode changes in realtime
    const settingsChannel = supabase
      .channel("settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments", filter: getTournamentRealtimeFilter(tournamentId || "") },
        (payload: any) => {
          if (payload.new) {
            const nextMysteryMode = readMysteryMode(payload.new);
            setMysteryMode(nextMysteryMode);
            if (!nextMysteryMode) {
              void fetchLeaderboard();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(departmentsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [fetchLeaderboard, supabase, tournamentId]);

  const hasScores = leaderboard.some(dept => dept.total_points > 0);

  return {
    leaderboard,
    mysteryMode,
    hasScores,
  };
};
