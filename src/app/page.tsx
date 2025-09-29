"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion
import Podium from "@/components/Podium"; // Import Podium component

interface LeaderboardRow {
  id: string;
  name: string;
  image_url?: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

export default function HomePage() { // Renamed to HomePage
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("results-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLeaderboard() {
    // Assuming get_leaderboard RPC now returns golds, silvers, bronzes
    const { data, error } = await supabase.rpc("get_leaderboard"); 
    if (error) console.error(error);
    else setLeaderboard(data);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col items-center p-6">
      <h1 className="text-3xl md:text-6xl font-bold mb-8 text-yellow-400 text-center">
        🏆 SIDLAK Live Scoreboard
      </h1>

      {/* Render Podium at the top */}
      <Podium leaderboard={leaderboard.slice(0, 3)} />

      <div className="w-full max-w-5xl space-y-4 mt-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Full Leaderboard</h2>
        <AnimatePresence>
          {leaderboard.slice(3).map((dept, index) => (
            <motion.div
              key={dept.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className={`flex justify-between items-center p-4 md:p-6 rounded-2xl shadow-lg 
                ${index === 0 ? "bg-yellow-500 text-black" : "bg-gray-800"}`}
            >
              {/* Left Side: Image, Rank & Department */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* Department Image */}
                <div className="flex-shrink-0">
                  {dept.image_url ? (
                    <img
                      src={dept.image_url}
                      alt={dept.name}
                      className="w-12 h-12 md:w-20 md:h-20 object-cover rounded-full border-2 md:border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 md:w-20 md:h-20 bg-gray-600 rounded-full border-2 md:border-4 border-white flex items-center justify-center">
                      <span className="text-xl md:text-2xl">🏫</span>
                    </div>
                  )}
                </div>

                {/* Department Info */}
                <div className="flex flex-col">
                  <span className="text-lg md:text-4xl font-bold">
                    #{index + 4} {dept.name} {/* Adjust rank for full leaderboard */}
                  </span>
                  <div className="flex gap-2 md:gap-4 mt-1 md:mt-2 text-base md:text-2xl">
                    <span className="text-yellow-400">🥇 {dept.golds}</span>
                    <span className="text-gray-300">🥈 {dept.silvers}</span>
                    <span className="text-orange-400">🥉 {dept.bronzes}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Points */}
              <span className="text-2xl md:text-5xl font-extrabold">
                {dept.total_points}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}