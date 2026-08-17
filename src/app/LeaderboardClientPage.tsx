"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { useLeaderboardViewModel } from "@/features/leaderboard/viewModels/useLeaderboardViewModel";
import { LeaderboardClientPageProps } from "@/features/leaderboard/models/leaderboardTypes";
import ApplePodium from "@/components/Podium";

export default function LeaderboardClientPage({ initialLeaderboard, initialMysteryMode, tournamentId, tournamentName }: LeaderboardClientPageProps) {
  const { leaderboard, mysteryMode, hasScores } = useLeaderboardViewModel({
    initialLeaderboard,
    initialMysteryMode,
    tournamentId
  });

  return (
    <div className="bg-[#F5F5F7] dark:bg-black text-gray-900 dark:text-white min-h-[100dvh] pb-28 font-sans relative overflow-x-hidden flex flex-col">
      {/* Sporty Diagonal Lines Texture */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-40 dark:opacity-10 mix-blend-multiply dark:mix-blend-normal"
        style={{ 
          backgroundImage: `repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 16px)`,
          maskImage: "radial-gradient(circle at center, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 80%)"
        }}
      />
      
      {/* Top gradient wash */}
      <div
        className="absolute left-0 right-0 top-0 h-72 pointer-events-none z-0"
        style={{ background: "linear-gradient(to bottom, rgba(22,163,74,0.22) 0%, transparent 100%)" }}
      />

      <AnimatePresence mode="wait">
        {mysteryMode ? (
          /* ── Mystery Mode ── */
          <motion.div
            key="mystery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 px-4 flex-1 flex flex-col justify-center"
          >
            <div className="flex flex-col items-center text-center pb-8 gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-white/10 px-5 py-2 rounded-full border border-gray-200 dark:border-white/10">
                <Sparkles size={12} />
                Grand Reveal Pending
                <Sparkles size={12} />
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white text-center tracking-tight leading-tight">
                Who will take <br />
                <span className="text-gray-400 dark:text-gray-500">the Crown?</span>
              </div>
            </div>
            {/* Mystery podium blurred out */}
            <div className="opacity-30 blur-sm pointer-events-none">
              <ApplePodium leaderboard={leaderboard} mysteryMode />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex-1 flex flex-col pt-12 pb-8"
          >
            {hasScores ? (
              <>
                {/* Header at top */}
                <div className="px-4 mb-4 text-center shrink-0">
                  <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{tournamentName}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest">Theme of the Event</div>
                </div>

                <div className={`w-full flex flex-col ${leaderboard.length <= 3 ? 'flex-1 justify-center' : 'pt-4'}`}>
                  {/* Podium + table */}
                  <ApplePodium leaderboard={leaderboard} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                <Trophy className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-6" strokeWidth={1} />
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tournamentName}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest mb-4">Theme of the Event</div>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium max-w-xs">
                  Standings will appear here once the first event concludes and medals are awarded.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}