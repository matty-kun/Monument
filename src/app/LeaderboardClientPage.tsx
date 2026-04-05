"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Podium from "@/components/Podium";
import TeamHoverCard from "@/components/TeamHoverCard";
import Image from "next/image";
import { calculateTotalPoints } from "@/utils/scoring";
import { Trophy } from "lucide-react";

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

interface LeaderboardRPCData {
  id: string;
  name: string;
  abbreviation: string | null;
  image_url?: string;
  golds: number;
  silvers: number;
  bronzes: number;
}

interface LeaderboardClientPageProps {
    initialLeaderboard: LeaderboardRow[];
}

export default function LeaderboardClientPage({ initialLeaderboard }: LeaderboardClientPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>(initialLeaderboard);
  const supabase = createClient();

  const fetchLeaderboard = useCallback(async () => {
    // 1. Fetch stats
    const { data: stats, error: statsError } = await supabase.rpc("get_leaderboard");
    if (statsError || !stats) {
      console.error("Error fetching leaderboard stats:", statsError);
      return;
    }

    // 2. Fetch departments for abbreviations
    const { data: departments, error: deptError } = await supabase.from('departments').select('id, abbreviation');
    if (deptError) {
      console.error("Error fetching abbreviations:", deptError);
    }

    const abbrMap = new Map((departments as any[])?.map(d => [d.id, d.abbreviation]) || []);

    if (!Array.isArray(stats)) return;

    const calculated = stats
      .filter((row: LeaderboardRPCData) => row.name !== "No Team")
      .map((row: LeaderboardRPCData) => ({
      ...row,
      abbreviation: abbrMap.get(row.id) || null,
      total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
    }));
    setLeaderboard(calculated);
  }, [supabase]);

  useEffect(() => {
    // ✅ Handle Results changes
    const resultsChannel = supabase
      .channel("results-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        fetchLeaderboard
      )
      .subscribe();

    // ✅ Handle Department changes (Logo/Name/Abbreviation updates)
    const departmentsChannel = supabase
      .channel("departments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "departments" },
        fetchLeaderboard
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(departmentsChannel);
    };
  }, [fetchLeaderboard, supabase]);

  const hasScores = leaderboard.some(dept => dept.total_points > 0);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-black dark:text-gray-200">
      {hasScores ? (
        <>
          {/* Podium */}
          <div className="flex flex-col justify-start items-center px-4 md:px-6">
            <div className="w-full flex justify-center">
              <Podium leaderboard={leaderboard.slice(0, 3)} />
            </div>
          </div>

          {/* Leaderboard Cards (Rank 4+) */}
          <div className="w-full max-w-5xl mx-auto px-4 py-8">
            <AnimatePresence>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
              >
                {leaderboard.slice(3).map((dept, index) => (
                  <motion.div
                    key={dept.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-5 flex flex-col justify-between"
                  >
                    <TeamHoverCard teamId={dept.id}>
                      <div className="w-full text-left group-hover:scale-[1.02] transition-transform duration-300">
                        {/* Rank number in the background */}
                        <div className="absolute -top-10 -left-0 text-[150px] font-black text-gray-100 dark:text-gray-700/50 z-0 select-none pointer-events-none">
                          {index + 4}
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                          {/* Department Info */}
                          <div className="flex items-center gap-4 mb-4">
                            {dept.image_url ? (
                                <Image 
                                  src={dept.image_url} 
                                  alt={dept.name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 object-contain drop-shadow-sm"
                                />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-2xl text-gray-400">🏫</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-black group-hover:text-monument-primary transition-colors dark:text-gray-100 leading-tight" title={dept.name}>
                                {dept.name}
                              </span>
                              {dept.abbreviation && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                  {dept.abbreviation}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Medals and Points */}
                          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">

                            <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-lg font-bold px-3 py-1 rounded-full group-hover:bg-monument-primary group-hover:text-white transition-colors">
                              {dept.total_points}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TeamHoverCard>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center text-center p-4">
          <Trophy className="w-20 h-20 text-yellow-500 mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-black text-monument-primary mb-2">Welcome to CITE FEST 2026</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Stay tuned for the results!
          </p>
        </div>
      )}
    </div>
  );
}