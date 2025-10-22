"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Podium from "@/components/Podium";
import Image from "next/image";
import { calculateTotalPoints } from "@/utils/scoring";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";

interface LeaderboardRow {
  id: string;
  name: string;
  image_url?: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

export default function ScoreboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); // Add this line

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_leaderboard");
    if (!error && data) {
      // Calculate total_points using the scoring logic
      const calculated = data.map((row: LeaderboardRow) => ({
        ...row,
        total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
      }));
      setLeaderboard(calculated);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel("results-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        fetchLeaderboard
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard, supabase]);

  // Check if there are any scores to determine if ranking should be shown
  const hasScores = leaderboard.some(dept => dept.total_points > 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <BouncingBallsLoader />
      </div>
    );
  }

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
                    {/* Rank number in the background */}
                    <div className="absolute -top-10 -left-0 text-[150px] font-black text-gray-100 dark:text-gray-700/50 z-0 select-none">
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
                            className="w-12 h-12 object-cover rounded-full shadow-md border-2 border-white dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-2xl text-gray-400">🏫</span>
                          </div>
                        )}
                        <span className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight" title={dept.name}>
                          {dept.name}
                        </span>
                      </div>

                      {/* Medals and Points */}
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex gap-4 text-lg">
                          <span>🥇 {dept.golds}</span>
                          <span>🥈 {dept.silvers}</span>
                          <span>🥉 {dept.bronzes}</span>
                        </div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-lg font-bold px-3 py-1 rounded-full">
                          {dept.total_points}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center text-center p-4">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">No Results Yet</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            The leaderboard is empty. Check back soon for the latest standings!
          </p>
        </div>
      )}
    </div>
  );
}