"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import Podium from "@/components/Podium";
import { calculateTotalPoints } from "@/utils/scoring";

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

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel("results-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLeaderboard() {
    const { data, error } = await supabase.rpc("get_leaderboard");
    if (!error && data) {
      // Calculate total_points using the scoring logic
      const calculated = data.map((row: LeaderboardRow) => ({
        ...row,
        total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
      }));
      setLeaderboard(calculated);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col items-center p-6">
      {/* Minimalist Podium */}
      <div className="relative w-full mt-8">
        <div className="absolute left-1/2 -translate-x-1/2">
          <Podium leaderboard={leaderboard.slice(0, 3)} />
        </div>
      </div>

      {/* Minimalist Full Leaderboard */}
      <div className="w-full max-w-3xl space-y-2 mt-8">
        <AnimatePresence>
          {leaderboard.slice(3).map((dept, index) => (
            <motion.div
              key={dept.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="flex justify-between items-center p-4 rounded-lg bg-white"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {dept.image_url ? (
                    <img 
                      src={dept.image_url} 
                      alt={dept.name}
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">🏫</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-medium">
                    #{index + 4} {dept.name}
                  </span>
                  <div className="flex gap-2 mt-1 text-sm">
                    <span className="text-gray-600">🥇 {dept.golds}</span>
                    <span className="text-gray-600">🥈 {dept.silvers}</span>
                    <span className="text-gray-600">🥉 {dept.bronzes}</span>
                  </div>
                </div>
              </div>
              <span className="text-xl font-semibold">
                {dept.total_points}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
