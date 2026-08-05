"use client";

import { motion, AnimatePresence } from "framer-motion";
import Podium from "@/components/Podium";
import TeamHoverCard from "@/components/TeamHoverCard";
import Image from "next/image";
import { Trophy, Sparkles } from "lucide-react";
import { useLeaderboardViewModel } from "@/features/leaderboard/viewModels/useLeaderboardViewModel";
import { LeaderboardClientPageProps } from "@/features/leaderboard/models/leaderboardTypes";

export default function LeaderboardClientPage({ initialLeaderboard, initialMysteryMode, tournamentId, tournamentName }: LeaderboardClientPageProps) {
  const { leaderboard, mysteryMode, hasScores } = useLeaderboardViewModel({
    initialLeaderboard,
    initialMysteryMode,
    tournamentId
  });

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-black dark:text-gray-200">
      <AnimatePresence mode="wait">
        {mysteryMode ? (
          // 🔮 Mystery Mode: real teams shown, equal-height podium, all scores masked
          <motion.div
            key="mystery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Banner */}
            <div className="flex flex-col items-center text-center pt-0 pb-2 gap-3">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.25em] text-monument-primary/80 bg-monument-primary/10 px-4 py-1.5 rounded-full border border-monument-primary/20">
                <Sparkles size={10} />
                Grand Reveal at the Culmination
                <Sparkles size={10} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white text-center">
                Who will take{" "}
                <br className="sm:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-monument-primary to-violet-500">
                  the Crown?
                </span>
              </h2>
            </div>

            {/* Equal-height mystery podium — top 3 */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 md:gap-12 justify-items-center items-end w-full max-w-5xl mx-auto pt-12 pb-12 px-4">
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((dept, colIdx) => {
                  if (!dept) return null;
                  const delay = [0.2, 0, 0.4][colIdx];
                  return (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay }}
                      className="flex flex-col items-center"
                    >
                      <TeamHoverCard teamId={dept.id}>
                        <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
                          {/* Logo */}
                          <div className="relative w-24 h-24 md:w-40 md:h-40 mb-4 md:mb-6 flex items-center justify-center">
                            {dept.image_url ? (
                              <Image
                                src={dept.image_url}
                                alt={dept.name}
                                fill
                                sizes="(max-width: 768px) 96px, 160px"
                                priority
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-4xl md:text-6xl font-black text-gray-300 dark:text-gray-600">
                                  🏫
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Name + masked points */}
                          <div className="text-center mb-4">
                            <div className="text-base md:text-xl font-bold text-black dark:text-gray-100 leading-tight group-hover:text-monument-primary transition-colors duration-300">
                              {dept.name.split(' ').map((word, i, arr) => (
                                <span key={i}>{word}{i < arr.length - 1 && <br />}</span>
                              ))}
                            </div>
                            {dept.abbreviation && (
                              <div className="text-[10px] md:text-xs text-gray-400 mb-2 font-medium italic">
                                {dept.abbreviation}
                              </div>
                            )}
                            {/* Masked points badge */}
                            <div className="inline-flex items-center mt-1 px-3 py-1 rounded-full bg-monument-primary/10 border border-monument-primary/20 whitespace-nowrap">
                              <span className="text-sm font-black text-monument-primary tracking-widest">??? pts</span>
                            </div>
                          </div>
                        </div>
                      </TeamHoverCard>

                      {/* Equal-height block with a uniform mystery gradient */}
                      <div className="w-24 md:w-40 rounded-t-lg h-32 md:h-48 bg-gradient-to-br from-violet-500 via-monument-primary to-indigo-700 shadow-xl shadow-monument-primary/30 flex items-center justify-center">
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: colIdx * 0.3 }}
                          className="text-4xl md:text-6xl font-black text-white/40 select-none"
                        >
                          ?
                        </motion.span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rank 4+ cards — visible but points masked */}
            {leaderboard.length > 3 && (
              <div className="w-full max-w-5xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leaderboard.slice(3).map((dept, index) => (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-5 flex flex-col justify-between"
                    >
                      {/* Ghost rank number */}
                      <div className="absolute -top-10 -left-0 text-[150px] font-black text-gray-100 dark:text-gray-700/50 z-0 select-none pointer-events-none">
                        ?
                      </div>
                      <TeamHoverCard teamId={dept.id}>
                        <div className="relative z-10 flex flex-col h-full w-full text-left">
                          <div className="flex items-center gap-4 mb-4">
                            {dept.image_url ? (
                              <Image
                                src={dept.image_url}
                                alt={dept.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 object-contain drop-shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-2xl text-gray-400">🏫</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-black dark:text-gray-100 leading-tight" title={dept.name}>
                                {dept.name}
                              </span>
                              {dept.abbreviation && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                  {dept.abbreviation}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-monument-primary/10 border border-monument-primary/20 whitespace-nowrap">
                              <span className="text-sm font-black text-monument-primary tracking-widest">??? pts</span>
                            </div>
                          </div>
                        </div>
                      </TeamHoverCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // ✅ Normal leaderboard view
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {hasScores ? (
              <>
                {/* Podium */}
                <div className="flex flex-col justify-start items-center px-4 md:px-6">
                  <div className="w-full flex justify-center">
                    <Podium leaderboard={leaderboard.slice(0, 3)} />
                  </div>
                </div>

                {/* Leaderboard Cards (Rank 4+) */}
                <div className="w-full max-w-4xl mx-auto px-4 py-8">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <AnimatePresence>
                      <motion.div 
                        className="flex flex-col"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                      >
                        {leaderboard.slice(3).map((dept, index) => (
                          <motion.div
                            key={dept.id}
                            layout
                            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className={`relative flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${index !== leaderboard.slice(3).length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}`}
                          >
                            <TeamHoverCard teamId={dept.id}>
                              <div className="w-full flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 flex justify-center">
                                    <span className="text-xl font-black text-gray-400 dark:text-gray-500">{index + 4}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    {dept.image_url ? (
                                      <Image 
                                        src={dept.image_url} 
                                        alt={dept.name}
                                        width={40}
                                        height={40}
                                        className="w-10 h-10 object-contain drop-shadow-sm"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                        <span className="text-sm font-black text-gray-400">{dept.abbreviation?.slice(0, 2) || "??"}</span>
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight group-hover:text-monument-primary transition-colors leading-tight" title={dept.name}>
                                        {dept.abbreviation || dept.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-bold uppercase tracking-widest hidden sm:inline">
                                        {dept.name}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white tabular-nums text-lg font-black px-4 py-1.5 rounded-full group-hover:bg-monument-primary group-hover:text-white transition-colors">
                                    {dept.total_points}
                                  </div>
                                </div>
                              </div>
                            </TeamHoverCard>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </>
            ) : (
              <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center text-center p-4">
                <Trophy className="w-20 h-20 text-yellow-500 mb-4 opacity-80" />
                <h2 className="text-3xl md:text-4xl font-black text-monument-primary mb-2">Welcome to {tournamentName}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Stay tuned for the results!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}