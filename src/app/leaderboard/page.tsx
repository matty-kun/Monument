"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import Podium from "@/components/Podium";
import Image from "next/image";
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
      <div className="w-full max-w-4xl mt-12 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-white border-b-2 border-gray-200">
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Medals</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence>
                {leaderboard.slice(3).map((dept, index) => (
                  <motion.tr
                    key={dept.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-gray-700">#{index + 4}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {dept.image_url ? (
                            <Image 
                              src={dept.image_url} 
                              alt={dept.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded-full shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-2xl">🏫</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-base font-semibold text-gray-900">{dept.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-3">
                        <span className="text-base">🥇 {dept.golds}</span>
                        <span className="text-base">🥈 {dept.silvers}</span>
                        <span className="text-base">🥉 {dept.bronzes}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-xl font-bold text-indigo-600">
                        {dept.total_points}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
