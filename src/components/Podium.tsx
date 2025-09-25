
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
  if (!leaderboard || leaderboard.length < 3) return null;
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
  const podiumData = podiumOrder.map(i => leaderboard[i]).filter(Boolean);

  return (
    <div className="flex justify-center items-end space-x-4">
      {podiumData.map((dept, index) => (
        <motion.div
          key={dept.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="text-4xl font-bold">
            {podiumOrder[index] === 0 && "🥇"}
            {podiumOrder[index] === 1 && "🥈"}
            {podiumOrder[index] === 2 && "🥉"}
          </div>
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
            {dept.image_url ? (
              <img src={dept.image_url} alt={dept.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                <span className="text-4xl">🏫</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{dept.name}</div>
            <div className="text-lg">{dept.total_points} pts</div>
          </div>
          <div
            className={`w-40 md:w-56 rounded-t-lg text-center text-black font-bold p-4 ${
              podiumOrder[index] === 0 ? "bg-yellow-400 h-48" : ""
            } ${
              podiumOrder[index] === 1 ? "bg-gray-300 h-32" : ""
            } ${
              podiumOrder[index] === 2 ? "bg-orange-400 h-24" : ""
            }`}
          >
            <div className="text-5xl">{podiumOrder[index] + 1}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
