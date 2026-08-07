"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { stringToColor } from "@/utils/colors";
import { useResultsViewModel } from "@/features/results/viewModels/useResultsViewModel";
import { EventsClientPageProps } from "@/features/results/models/resultsTypes";

export default function EventsClientPage({ initialResults, initialCategories, mysteryMode: initialMysteryMode }: EventsClientPageProps) {
  const {
    searchQuery,
    setSearchQuery,
    showRefresh,
    grouped,
  } = useResultsViewModel({
    initialResults,
    initialCategories,
    initialMysteryMode
  });

  return (
    <div className="bg-black text-white min-h-screen pb-24 font-sans relative overflow-hidden">
      {/* Top gradient wash */}
      <div
        className="absolute left-0 right-0 top-0 h-72 pointer-events-none z-0"
        style={{ background: "linear-gradient(to bottom, rgba(22,163,74,0.20) 0%, transparent 100%)" }}
      />

      {/* Top Header */}
      <div className="relative z-10 px-4 pt-6 pb-4 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <h1 className="text-3xl font-black text-white tracking-tight">Results</h1>
      </div>

      <AnimatePresence>
        {showRefresh && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-white text-black shadow-xl rounded-full px-5 py-2 hover:bg-gray-100 active:scale-95 transition-all pointer-events-auto text-sm font-bold tracking-wide"
            >
              <span>Refresh Results</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 mt-4">
        {/* Search Bar */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search events, teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-[15px] focus:outline-none focus:ring-1 focus:ring-white/20 transition-shadow backdrop-blur-sm border border-white/5"
          />
        </div>

        {/* Results List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {Object.entries(grouped).map(([eventName, data]) => {
              const goldWinner = data.winners['gold'];
              const goldColor = goldWinner && goldWinner.department_id
                ? stringToColor(goldWinner.department_abbreviation || goldWinner.department_name || "")
                : 'rgba(150,150,150,0.05)';

              return (
                <motion.div
                  key={eventName}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative bg-white/10 backdrop-blur-sm rounded-[18px] p-4 flex flex-col gap-3 overflow-hidden border border-white/5"
                >
                  {/* Subtle team-colored gradient */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
                    style={{
                      background: goldWinner && goldWinner.department_id
                        ? `radial-gradient(circle at top right, ${goldColor} 0%, transparent 60%)`
                        : 'transparent'
                    }}
                  />

                  {/* Event Header */}
                  <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{data.icon || '🏅'}</span>
                      <h3 className="font-bold text-[15px] text-white uppercase tracking-tight">{eventName}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {data.gender && data.gender !== 'N/A' && (
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{data.gender}</span>
                      )}
                      {data.category && (
                        <>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{data.category}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Medals */}
                  <div className="relative z-10 flex flex-col gap-3 mt-1">
                    {(["gold", "silver", "bronze"] as const).map((medal) => {
                      const winner = data.winners[medal];
                      const medalColor = medal === 'gold' ? 'text-yellow-500' : medal === 'silver' ? 'text-gray-300' : 'text-orange-500';
                      const rank = medal === 'gold' ? '1' : medal === 'silver' ? '2' : '3';

                      return (
                        <div key={medal} className="flex items-center justify-between">
                          <div className={`w-4 font-black text-center ${medalColor} text-[13px] mr-2`}>{rank}</div>

                          {winner && winner.department_id ? (
                            <div className="flex items-center flex-1 justify-between">
                              <span className="font-bold text-[15px] text-white tracking-tight truncate pl-1">
                                {winner.department_name}
                              </span>
                              {winner.image_url ? (
                                <Image src={winner.image_url} alt={winner.department_name || ''} width={24} height={24} className="w-6 h-6 object-contain" />
                              ) : (
                                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-400">
                                  {winner.department_abbreviation?.slice(0, 3)}
                                </div>
                              )}
                            </div>
                          ) : winner && !winner.department_id ? (
                            <span className="flex-1 text-[13px] font-bold italic text-gray-500">No Team</span>
                          ) : (
                            <span className="flex-1 text-[13px] font-bold italic text-gray-600">Awaiting Result...</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}

            {Object.keys(grouped).length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Trophy className="w-12 h-12 text-gray-700 mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-bold text-gray-500 uppercase tracking-tight">No Results Found</h3>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Toaster />
    </div>
  );
}