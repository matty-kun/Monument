"use client";

import { motion } from "framer-motion";

interface LeaderboardRow {
  id: string;
  name: string;
  image_url?: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

interface PodiumProps {
  leaderboard: LeaderboardRow[];
}

export default function Podium({ leaderboard }: PodiumProps) {
  // Ensure we always have at least empty objects for podium positions
  const topThree = [
    leaderboard[1] || null, // 2nd place
    leaderboard[0] || null, // 1st place
    leaderboard[2] || null, // 3rd place
  ];

  return (
    <div className="flex justify-center items-end space-x-2 md:space-x-4">
      {topThree.map((dept, index) => {
        if (!dept) return null; // Don't render if no data for this position

        const rank = index === 0 ? 2 : index === 1 ? 1 : 3; // 2nd, 1st, 3rd
        const medalEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
        const bgColor = rank === 1 ? "bg-gray-300" : "bg-gray-200"; // Lighter, more minimalistic colors
        const height = rank === 1 ? "h-32 md:h-48" : rank === 2 ? "h-24 md:h-32" : "h-20 md:h-24";

        return (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="text-2xl md:text-3xl">
              {medalEmoji}
            </div>
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-300 mb-2 md:mb-4">
              {dept.image_url ? (
                <img src={dept.image_url} alt={dept.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-3xl md:text-4xl">🏫</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-base md:text-lg font-semibold">{dept.name}</div>
              <div className="text-sm md:text-base">{dept.total_points} pts</div>
            </div>
            <div
              className={`w-28 md:w-56 rounded-t-lg text-center text-black font-bold p-2 md:p-4 ${bgColor} ${height}`}
            >
              <div className="text-4xl md:text-5xl">{rank}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}