"use client";
import Image from 'next/image';
import { motion } from "framer-motion";
import { calculateTotalPoints } from "@/utils/scoring";
import TeamHoverCard from "./TeamHoverCard";

interface LeaderboardRow {
  id: string;
  name: string;
  // Add abbreviation from the database if available
  abbreviation: string | null; 
  image_url?: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

interface PodiumProps {
  // Allow for null entries in case of missing data
  leaderboard: (LeaderboardRow | null)[];
}

const getAbbreviation = (name: string, dbAbbreviation: string | null) => {
  // 1. Prioritize the abbreviation from the database
  if (dbAbbreviation) return dbAbbreviation;
  // 2. Add a special exception for College of Education
  if (name === "College of Education") return "CED";
  // 3. Fallback to generating from the name
  return name
    .split(' ')
    .filter(w => !['of', 'and', 'the'].includes(w.toLowerCase()))
    .map(w => w[0])
    .join('')
    .toUpperCase();
};

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
      <div className={`relative ${position === "1st" ? "w-32 h-32 md:w-52 md:h-52" : position === "2nd" ? "w-24 h-24 md:w-40 md:h-40" : "w-20 h-20 md:w-36 md:h-36"} mb-4 md:mb-6 flex items-center justify-center`}>
        <span className="text-4xl md:text-6xl opacity-20">🏆</span>
      </div>
      <div className="text-center mb-4">
        <div className="text-lg md:text-xl font-semibold text-gray-400 dark:text-gray-500">Awaiting Champion</div>
        <div className="text-sm md:text-base text-gray-400 dark:text-gray-500">
          —
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
          <TeamHoverCard teamId={topThree[0].id}>
            <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
              <div className="relative w-24 h-24 md:w-40 md:h-40 mb-4 md:mb-6 flex items-center justify-center">
                {topThree[0].image_url ? (
                  <Image src={topThree[0].image_url} alt={topThree[0].name} fill className="object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center grayscale opacity-50">
                    <span className="text-4xl md:text-5xl font-black text-gray-500">
                      {getAbbreviation(topThree[0].name, topThree[0].abbreviation)}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center mb-4">
                <div className="text-xl md:text-2xl font-bold text-black dark:text-gray-100 leading-tight group-hover:text-monument-primary transition-colors duration-300">
                  {topThree[0].name}
                </div>
                {topThree[0].abbreviation && (
                  <div className="text-[10px] md:text-xs text-black dark:text-gray-400 mb-2 font-medium italic">
                    {topThree[0].abbreviation}
                  </div>
                )}

                <div className="text-base md:text-lg font-bold mt-1 text-black dark:text-gray-200">{calculateTotalPoints(topThree[0].golds, topThree[0].silvers, topThree[0].bronzes)} pts</div>
              </div>
            </div>
          </TeamHoverCard>
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
          <TeamHoverCard teamId={topThree[1].id}>
            <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
              <div className="relative w-32 h-32 md:w-52 md:h-52 mb-4 md:mb-6 flex items-center justify-center">
                {topThree[1].image_url ? (
                  <Image src={topThree[1].image_url} alt={topThree[1].name} fill className="object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center grayscale opacity-50">
                    <span className="text-4xl md:text-5xl font-black text-gray-400">
                      {getAbbreviation(topThree[1].name, topThree[1].abbreviation)}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center mb-4">
                <div className="text-xl md:text-2xl font-bold text-black dark:text-gray-100 leading-tight group-hover:text-monument-primary transition-colors duration-300">
                  {topThree[1].name}
                </div>
                {topThree[1].abbreviation && (
                  <div className="text-[10px] md:text-xs text-black dark:text-gray-400 mb-2 font-medium italic">
                    {topThree[1].abbreviation}
                  </div>
                )}

                <div className="text-base md:text-lg font-bold mt-1 text-black dark:text-gray-200">{calculateTotalPoints(topThree[1].golds, topThree[1].silvers, topThree[1].bronzes)} pts</div>
              </div>
            </div>
          </TeamHoverCard>
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
          <TeamHoverCard teamId={topThree[2].id}>
            <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
              <div className="relative w-20 h-20 md:w-36 md:h-36 mb-4 md:mb-6 flex items-center justify-center">
                {topThree[2].image_url ? (
                  <Image src={topThree[2].image_url} alt={topThree[2].name} fill className="object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center grayscale opacity-50">
                    <span className="text-4xl md:text-5xl font-black text-gray-600">
                      {getAbbreviation(topThree[2].name, topThree[2].abbreviation)}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center mb-4">
                <div className="text-xl md:text-2xl font-bold text-black dark:text-gray-100 leading-tight group-hover:text-monument-primary transition-colors duration-300">
                  {topThree[2].name}
                </div>
                {topThree[2].abbreviation && (
                  <div className="text-[10px] md:text-xs text-black dark:text-gray-400 mb-2 font-medium italic">
                    {topThree[2].abbreviation}
                  </div>
                )}

                <div className="text-base md:text-lg font-bold mt-1 text-black dark:text-gray-200">{calculateTotalPoints(topThree[2].golds, topThree[2].silvers, topThree[2].bronzes)} pts</div>
              </div>
            </div>
          </TeamHoverCard>
          <div className="w-20 md:w-36 rounded-t-lg bg-gradient-to-br from-orange-400 via-orange-600 to-orange-800 shadow-xl h-20 md:h-28 flex items-center justify-center text-3xl md:text-5xl font-bold text-white">3</div>
        </motion.div>
      ) : (
        <EmptyPodiumSlot position="3rd" medal="🥉" />
      )}
    </div>
  );
}