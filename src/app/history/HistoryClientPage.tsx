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
          <div className="rounded-[24px] border border-white/[0.04] bg-white/[0.02] py-16 text-center backdrop-blur-3xl">
            <Trophy className="w-8 h-8 text-white/20 mx-auto mb-4" />
            <div className="text-white/40 font-medium text-[15px] tracking-wide">No previous games found.</div>
          </div>
        ) : (
          pastTournaments.map(t => {
            const dateStr = t.start_date ? new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "";
            const isViewing = t.slug === activeSlug;
            
            return (
              <Link 
                key={t.id} 
                href={`/?tournament=${t.slug}`}
                className={`group relative flex items-center justify-between p-5 rounded-[24px] border transition-all duration-500 hover:bg-white/[0.04] active:scale-[0.98] overflow-hidden ${isViewing ? 'border-white/[0.08] bg-white/[0.04]' : 'border-white/[0.03] bg-white/[0.01] hover:border-white/[0.06]'}`}
              >
                {/* Subtle active glow */}
                {isViewing && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-white/[0.04] to-transparent pointer-events-none" />
                )}

                <div className="flex items-center gap-5 relative z-10">
                  <div className="flex items-center justify-center w-10">
                    <Trophy className={`w-6 h-6 transition-all duration-500 ${isViewing ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'text-white/20 group-hover:text-white/60 group-hover:scale-110'}`} />
                  </div>
                  <div>
                    <h3 className={`text-[17px] tracking-tight transition-colors duration-300 ${isViewing ? 'text-white font-medium' : 'text-white/60 font-normal group-hover:text-white/90'}`}>{t.name}</h3>
                    {dateStr && (
                      <div className="text-[11px] text-white/30 font-medium tracking-[0.15em] uppercase mt-1">
                        {dateStr}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  {isViewing && (
                    <div className="flex items-center gap-2 pr-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" />
                      <span className="text-[10px] font-medium text-emerald-400/80 tracking-[0.2em] uppercase">Viewing</span>
                    </div>
                  )}
                  <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${isViewing ? 'text-white/40 translate-x-1' : 'text-white/10 group-hover:text-white/40 group-hover:translate-x-1'}`} />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
