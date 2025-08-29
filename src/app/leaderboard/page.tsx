"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

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
    if (!error && data) setLeaderboard(data);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-4xl md:text-6xl font-bold mb-8 text-yellow-400">
        🏆 SIDLAK Live Scoreboard
      </h1>

      <div className="w-full max-w-5xl space-y-4">
        <AnimatePresence>
          {leaderboard.map((dept, index) => (
            <motion.div
              key={dept.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className={`flex justify-between items-center p-6 rounded-2xl shadow-lg 
                ${index === 0 ? "bg-yellow-500 text-black" : "bg-gray-800"}`}
            >
              {/* Left Side: Image, Rank & Department */}
              <div className="flex items-center gap-4">
                {/* Department Image */}
                <div className="flex-shrink-0">
                  {dept.image_url ? (
                    <img 
                      src={dept.image_url} 
                      alt={dept.name}
                      className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-full border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-600 rounded-full border-4 border-white flex items-center justify-center">
                      <span className="text-2xl">🏫</span>
                    </div>
                  )}
                </div>

                {/* Department Info */}
                <div className="flex flex-col">
                  <span className="text-2xl md:text-4xl font-bold">
                    #{index + 1} {dept.name}
                  </span>
                  <div className="flex gap-4 mt-2 text-lg md:text-2xl">
                    <span className="text-yellow-400">🥇 {dept.golds}</span>
                    <span className="text-gray-300">🥈 {dept.silvers}</span>
                    <span className="text-orange-400">🥉 {dept.bronzes}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Points */}
              <span className="text-3xl md:text-5xl font-extrabold">
                {dept.total_points}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}