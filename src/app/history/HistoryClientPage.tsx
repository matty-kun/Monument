"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";

export default function HistoryClientPage({ tournaments }: { tournaments: any[] }) {
  const pastTournaments = tournaments;
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('lastViewedTournament');
    if (stored) {
      setActiveSlug(stored);
    } else {
      const activeT = tournaments.find(t => t.is_active);
      if (activeT) setActiveSlug(activeT.slug);
    }
  }, [tournaments]);

  return (
    <div className="bg-black text-white min-h-screen pb-24 font-sans relative overflow-hidden">
      {/* Top gradient wash */}
      <div
        className="absolute left-0 right-0 top-0 h-64 pointer-events-none z-0"
        style={{ background: "linear-gradient(to bottom, rgba(10,132,255,0.15) 0%, transparent 100%)" }}
      />

      {/* Top Header */}
      <div className="relative z-10 px-4 pt-10 pb-4">
        <h1 className="text-[32px] font-black text-white tracking-tight flex items-center gap-3">
          History
        </h1>
        <p className="text-gray-400 text-[15px] mt-2 font-medium">Browse results and standings from previous games.</p>
      </div>

      <div className="px-4 mt-6 space-y-4 relative z-10">
        {pastTournaments.length === 0 ? (
          <div className="rounded-[20px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(28,28,30,0.8),rgba(28,28,30,0.65))] py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
            <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <div className="text-gray-500 font-medium text-[15px]">No previous games found.</div>
          </div>
        ) : (
          pastTournaments.map(t => {
            const dateStr = t.start_date ? new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Past Event";
            const isViewing = t.slug === activeSlug;
            
            return (
              <Link 
                key={t.id} 
                href={`/?tournament=${t.slug}`}
                className={`group flex flex-col justify-center rounded-[20px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition-[border-color,transform,filter] hover:brightness-105 active:scale-[0.985] hover:border-white/25 ${isViewing ? 'border-[#0A84FF]/40 bg-[#0A84FF]/10' : 'border-white/[0.08] bg-[linear-gradient(145deg,rgba(28,28,30,0.8),rgba(28,28,30,0.65))]'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-md transition-colors ${isViewing ? 'border-[#0A84FF]/30 bg-[#0A84FF]/20' : 'border-white/[0.12] bg-white/[0.06] group-hover:border-[#0A84FF]/25 group-hover:bg-[#0A84FF]/10'}`}>
                      <Trophy className={`w-6 h-6 transition-colors ${isViewing ? 'text-[#0A84FF]' : 'text-gray-500 group-hover:text-[#0A84FF]'}`} />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-black text-white tracking-wide">{t.name}</h3>
                      <div className="text-[13px] text-[#0A84FF]/90 font-bold tracking-wider uppercase mt-1">
                        {dateStr}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isViewing && (
                      <div className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-[#0A84FF]/20 text-[#0A84FF] rounded-md border border-[#0A84FF]/30">
                        Viewing
                      </div>
                    )}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] backdrop-blur-md transition-colors group-hover:bg-white/[0.14]">
                      <ChevronRight className={`w-5 h-5 transition-colors ${isViewing ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
