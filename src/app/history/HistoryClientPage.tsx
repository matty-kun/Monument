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
          <div className="text-center py-16 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-sm rounded-[24px]">
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
                className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-sm rounded-[24px] p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#2c2c2e] active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-white/10 group-hover:bg-[#0A84FF]/10 group-hover:border-[#0A84FF]/20 transition-colors shadow-sm">
                    <Trophy className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-[#0A84FF] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-black text-gray-900 dark:text-white tracking-wide">{t.name}</h3>
                    <div className="text-[13px] text-[#0A84FF]/90 font-bold tracking-wider uppercase mt-1">
                      {dateStr}
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-white/20 transition-colors">
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
