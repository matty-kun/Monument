"use client";
import Image from 'next/image';
import { motion } from "framer-motion";
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

  // Empty podium slot component
  const EmptyPodiumSlot = ({ position, medal }: { position: string; medal: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: position === "1st" ? 0 : position === "2nd" ? 0.2 : 0.4 }}
      className="flex flex-col items-center"
    >
      <div className="text-3xl md:text-4xl mb-4">{medal}</div>
      <div className={`relative ${position === "1st" ? "w-32 h-32 md:w-52 md:h-52" : position === "2nd" ? "w-24 h-24 md:w-40 md:h-40" : "w-20 h-20 md:w-36 md:h-36"} rounded-full overflow-hidden border-4 ${position === "1st" ? "border-yellow-500" : position === "2nd" ? "border-gray-500" : "border-orange-500"} mb-4 md:mb-6 bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        <span className="text-4xl md:text-6xl opacity-30">👥</span>
      </div>
      <div className="text-center mb-4">
        <div className="text-lg md:text-xl font-semibold text-gray-400 dark:text-gray-500">Awaiting Champion</div>
        <div className="text-sm md:text-base text-gray-400 dark:text-gray-500">
          <span>🥇 - 🥈 - 🥉 -</span>
        </div>
        <div className="text-base md:text-lg font-bold mt-1 text-gray-400 dark:text-gray-500">- pts</div>
      </div>
      <div className={`${position === "1st" ? "w-32 md:w-52" : position === "2nd" ? "w-24 md:w-40" : "w-20 md:w-36"} rounded-t-lg ${position === "1st" ? "bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800 h-40 md:h-64" : position === "2nd" ? "bg-gradient-to-br from-gray-400 via-gray-600 to-gray-800 h-24 md:h-32" : "bg-gradient-to-br from-orange-400 via-orange-600 to-orange-800 h-20 md:h-28"} shadow-xl flex items-center justify-center ${position === "1st" ? "text-6xl md:text-8xl" : position === "2nd" ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"} font-bold text-white`}>{position === "1st" ? "1" : position === "2nd" ? "2" : "3"}</div>
    </motion.div>
  );

  // Podium layout: grid for clarity, vertical alignment, and spacing
  return (
    <div className="grid grid-cols-3 gap-12 justify-items-center items-end w-full max-w-5xl mx-auto py-8">
      {/* 2nd place - left */}
      {topThree[0] ? (
        <motion.div
          key={topThree[0].id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="text-3xl md:text-4xl mb-4">🥈</div>
          <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-500 mb-4 md:mb-6">
            {topThree[0].image_url ? (
              <Image src={topThree[0].image_url} alt={topThree[0].name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                <span className="text-4xl md:text-5xl">🏫</span>
              </div>
            )}
          </div>
          <div className="text-center mb-4">
            <div className="text-2xl md:text-3xl font-bold dark:text-gray-100">
              {topThree[0].name.split(' ').filter(w => !['of', 'and', 'the'].includes(w.toLowerCase())).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">{topThree[0].name}</div>
            <div className="text-sm md:text-base flex justify-center items-center gap-2 dark:text-gray-300">
              <span>🥇 {topThree[0].golds}</span>
              <span>🥈 {topThree[0].silvers}</span>
              <span>🥉 {topThree[0].bronzes}</span>
            </div>
            <div className="text-base md:text-lg font-bold mt-1 dark:text-gray-200">{calculateTotalPoints(topThree[0].golds, topThree[0].silvers, topThree[0].bronzes)} pts</div>
          </div>
          <div className="w-24 md:w-40 rounded-t-lg bg-gradient-to-br from-gray-400 via-gray-600 to-gray-800 shadow-xl h-24 md:h-32 flex items-center justify-center text-4xl md:text-6xl font-bold text-white">2</div>
        </motion.div>
      ) : (
        <EmptyPodiumSlot position="2nd" medal="🥈" />
      )}

      {/* 1st place - center */}
      {topThree[1] ? (
        <motion.div
          key={topThree[1].id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="flex flex-col items-center"
        >
          <div className="text-3xl md:text-4xl mb-4">🥇</div>
          <div className="relative w-32 h-32 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-yellow-500 mb-4 md:mb-6">
            {topThree[1].image_url ? (
              <Image src={topThree[1].image_url} alt={topThree[1].name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-yellow-500 flex items-center justify-center">
                <span className="text-4xl md:text-5xl">🏫</span>
              </div>
            )}
          </div>
          <div className="text-center mb-4">
            <div className="text-2xl md:text-3xl font-bold dark:text-gray-100">
              {topThree[1].name.split(' ').filter(w => !['of', 'and', 'the'].includes(w.toLowerCase())).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">{topThree[1].name}</div>
            <div className="text-sm md:text-base flex justify-center items-center gap-2 dark:text-gray-300">
              <span>🥇 {topThree[1].golds}</span>
              <span>🥈 {topThree[1].silvers}</span>
              <span>🥉 {topThree[1].bronzes}</span>
            </div>
            <div className="text-base md:text-lg font-bold mt-1 dark:text-gray-200">{calculateTotalPoints(topThree[1].golds, topThree[1].silvers, topThree[1].bronzes)} pts</div>
          </div>
          <div className="w-32 md:w-52 rounded-t-lg bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800 shadow-xl h-40 md:h-64 flex items-center justify-center text-6xl md:text-8xl font-bold text-white">1</div>
        </motion.div>
      ) : (
        <EmptyPodiumSlot position="1st" medal="🥇" />
      )}

      {/* 3rd place - right */}
      {topThree[2] ? (
        <motion.div
          key={topThree[2].id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="text-3xl md:text-4xl mb-4">🥉</div>
          <div className="relative w-20 h-20 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-orange-500 mb-4 md:mb-6">
            {topThree[2].image_url ? (
              <Image src={topThree[2].image_url} alt={topThree[2].name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-orange-500 flex items-center justify-center">
                <span className="text-4xl md:text-5xl">🏫</span>
              </div>
            )}
          </div>
          <div className="text-center mb-4">
            <div className="text-2xl md:text-3xl font-bold dark:text-gray-100">
              {topThree[2].name.split(' ').filter(w => !['of', 'and', 'the'].includes(w.toLowerCase())).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">{topThree[2].name}</div>
            <div className="text-sm md:text-base flex justify-center items-center gap-2 dark:text-gray-300">
              <span>🥇 {topThree[2].golds}</span>
              <span>🥈 {topThree[2].silvers}</span>
              <span>🥉 {topThree[2].bronzes}</span>
            </div>
            <div className="text-base md:text-lg font-bold mt-1 dark:text-gray-200">{calculateTotalPoints(topThree[2].golds, topThree[2].silvers, topThree[2].bronzes)} pts</div>
          </div>
          <div className="w-20 md:w-36 rounded-t-lg bg-gradient-to-br from-orange-400 via-orange-600 to-orange-800 shadow-xl h-20 md:h-28 flex items-center justify-center text-3xl md:text-5xl font-bold text-white">3</div>
        </motion.div>
      ) : (
        <EmptyPodiumSlot position="3rd" medal="🥉" />
      )}
    </div>
  );
}