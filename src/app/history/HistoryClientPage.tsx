"use client";

import Link from "next/link";
import { History, ChevronRight, Trophy } from "lucide-react";

export default function HistoryClientPage({ tournaments }: { tournaments: any[] }) {
  // Show all tournaments in the archive
  const pastTournaments = tournaments;

  return (
    <div className="bg-[#F5F5F7] dark:bg-black text-gray-900 dark:text-white min-h-screen pb-24 font-sans relative overflow-hidden">
      {/* Top gradient wash */}
      <div
        className="absolute left-0 right-0 top-0 h-64 pointer-events-none z-0"
        style={{ background: "linear-gradient(to bottom, rgba(10,132,255,0.15) 0%, transparent 100%)" }}
      />

      {/* Top Header */}
      <div className="relative z-10 px-4 pt-10 pb-4">
        <h1 className="text-[32px] font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-[#0A84FF]" />
          History
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-[15px] mt-2 font-medium">Browse results and standings from previous games.</p>
      </div>

      <div className="px-4 mt-6 space-y-4 relative z-10">
        {pastTournaments.length === 0 ? (
          <div className="rounded-[20px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(255,255,255,0.46))] py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/20 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.045))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_40px_rgba(0,0,0,0.25)]">
            <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <div className="text-gray-400 dark:text-gray-500 font-medium text-[15px]">No previous games found.</div>
          </div>
        ) : (
          pastTournaments.map(t => {
            const dateStr = t.start_date ? new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Past Event";
            
            return (
              <Link 
                key={t.id} 
                href={`/?tournament=${t.slug}`}
                className="group flex items-center justify-between rounded-[20px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(255,255,255,0.46))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-[border-color,transform,filter] hover:brightness-105 active:scale-[0.985] dark:border-white/20 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.045))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_40px_rgba(0,0,0,0.25)] dark:hover:border-white/25"
              >
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/70 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-md transition-colors group-hover:border-[#0A84FF]/25 group-hover:bg-[#0A84FF]/10 dark:border-white/[0.12] dark:bg-white/[0.06]">
                    <Trophy className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-[#0A84FF] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-black text-gray-900 dark:text-white tracking-wide">{t.name}</h3>
                    <div className="text-[13px] text-[#0A84FF]/90 font-bold tracking-wider uppercase mt-1">
                      {dateStr}
                    </div>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/40 backdrop-blur-md transition-colors group-hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.08] dark:group-hover:bg-white/[0.14]">
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
