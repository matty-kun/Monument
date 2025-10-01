"use client";
import Image from 'next/image';

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

  // Podium layout: grid for clarity, vertical alignment, and spacing
  return (
    <div className="grid grid-cols-3 gap-6 justify-items-center items-end w-full max-w-5xl mx-auto py-8">
      {/* 2nd place - left */}
      {topThree[0] && (
        <motion.div
          key={topThree[0].id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="flex flex-col items-center"
        >
          <div className="text-3xl md:text-4xl mb-3">🥈</div>
          <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-500 mb-3 md:mb-5">
            {topThree[0].image_url ? (
              <Image src={topThree[0].image_url} alt={topThree[0].name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                <span className="text-4xl md:text-5xl">🏫</span>
              </div>
            )}
          </div>
          <div className="text-center mb-3">
            <div className="text-lg md:text-xl font-semibold">{topThree[0].name}</div>
            <div className="text-sm md:text-base flex justify-center items-center gap-2">
              <span>🥇 {topThree[0].golds}</span>
              <span>🥈 {topThree[0].silvers}</span>
              <span>🥉 {topThree[0].bronzes}</span>
            </div>
            <div className="text-base md:text-lg font-bold mt-1">{calculateTotalPoints(topThree[0].golds, topThree[0].silvers, topThree[0].bronzes)} pts</div>
          </div>
          <div className="w-24 md:w-40 rounded-t-lg text-center text-black font-bold p-3 md:p-5 bg-gradient-to-br from-gray-300 via-gray-500 to-gray-700 shadow-xl h-24 md:h-32">
            <div className="text-4xl md:text-5xl">2</div>
          </div>
        </motion.div>
      )}
      {/* 1st place - center */}
      {topThree[1] && (
        <motion.div
          key={topThree[1].id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="text-3xl md:text-4xl mb-3">🥇</div>
          <div className="relative w-32 h-32 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-yellow-500 mb-3 md:mb-5">
            {topThree[1].image_url ? (
              <Image src={topThree[1].image_url} alt={topThree[1].name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-yellow-500 flex items-center justify-center">
                <span className="text-4xl md:text-5xl">🏫</span>
              </div>
            )}
          </div>
          <div className="text-center mb-3">
            <div className="text-lg md:text-xl font-semibold">{topThree[1].name}</div>
            <div className="text-sm md:text-base flex justify-center items-center gap-2">
              <span>🥇 {topThree[1].golds}</span>
              <span>🥈 {topThree[1].silvers}</span>
              <span>🥉 {topThree[1].bronzes}</span>
            </div>
            <div className="text-base md:text-lg font-bold mt-1">{calculateTotalPoints(topThree[1].golds, topThree[1].silvers, topThree[1].bronzes)} pts</div>
          </div>
          <div className="w-32 md:w-52 rounded-t-lg text-center text-black font-bold p-3 md:p-5 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-xl h-40 md:h-64">
            <div className="text-5xl md:text-6xl">1</div>
          </div>
        </motion.div>
      )}
      {/* 3rd place - right */}
      {topThree[2] && (
        <motion.div
          key={topThree[2].id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="text-3xl md:text-4xl mb-3">🥉</div>
          <div className="relative w-20 h-20 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-orange-500 mb-3 md:mb-5">
            {topThree[2].image_url ? (
              <Image src={topThree[2].image_url} alt={topThree[2].name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-orange-500 flex items-center justify-center">
                <span className="text-4xl md:text-5xl">🏫</span>
              </div>
            )}
          </div>
          <div className="text-center mb-3">
            <div className="text-lg md:text-xl font-semibold">{topThree[2].name}</div>
            <div className="text-sm md:text-base flex justify-center items-center gap-2">
              <span>🥇 {topThree[2].golds}</span>
              <span>🥈 {topThree[2].silvers}</span>
              <span>🥉 {topThree[2].bronzes}</span>
            </div>
            <div className="text-base md:text-lg font-bold mt-1">{calculateTotalPoints(topThree[2].golds, topThree[2].silvers, topThree[2].bronzes)} pts</div>
          </div>
          <div className="w-20 md:w-36 rounded-t-lg text-center text-black font-bold p-3 md:p-5 bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 shadow-xl h-20 md:h-28">
            <div className="text-4xl md:text-5xl">3</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
import { calculateTotalPoints } from "@/utils/scoring";