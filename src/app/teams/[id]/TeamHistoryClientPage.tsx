"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/lib/utils";
import { usePublicTeamsViewModel } from "@/features/teams/viewModels/usePublicTeamsViewModel";
import { teamNameToColor } from "@/utils/colors";
import { Trophy, CalendarClock } from "lucide-react";

interface TeamHistoryClientPageProps {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    image_url: string | null;
  };
  results: any[];
  stats: {
    golds: number;
    silvers: number;
    bronzes: number;
    total_points: number;
  };
  allCategories: any[];
  schedules?: any[];
  mysteryMode?: boolean;
}

export default function TeamHistoryClientPage({ team, results, stats, allCategories, schedules = [], mysteryMode }: TeamHistoryClientPageProps) {
  const {
    filter,
    setFilter,
    displayItems,
    getInitials,
    getCategoryName
  } = usePublicTeamsViewModel({ results, schedules, allCategories });

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString + 'T00:00:00');
    return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
  };
  const teamColor = teamNameToColor(team.name);

  return (
    <div className="bg-black text-white min-h-screen pb-24 font-sans relative overflow-hidden">
      {/* Top gradient wash — team-colored and softly fading */}
      <div
        className="absolute left-0 right-0 top-0 h-80 pointer-events-none z-0"
        style={{
          background: [
            `radial-gradient(circle at 50% 0%, ${teamColor}4a 0%, transparent 58%)`,
            `linear-gradient(to bottom, ${teamColor}26 0%, ${teamColor}14 36%, transparent 100%)`,
          ].join(", "),
        }}
      />

      {/* Navigation Header */}
      <div className="relative z-10 px-4 pt-6 pb-2 sticky top-0">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-white/70 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Podium
        </Link>
      </div>

      {/* Team Profile Header */}
      <div className="relative z-10 px-4 mt-6 mb-8 flex flex-col items-center text-center">
        <div className="relative w-28 h-28 mb-4 shrink-0">
          {team.image_url ? (
            <Image
              src={team.image_url}
              alt={team.name}
              fill
              sizes="128px"
              priority
              className="object-contain drop-shadow-2xl"
            />
          ) : (
            <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 border border-white/10">
              {getInitials(team.name)}
            </div>
          )}
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{team.name}</h1>
        {team.abbreviation && (
          <h2 className="text-[15px] text-gray-400 font-semibold mt-1 tracking-wide">{team.abbreviation}</h2>
        )}
      </div>

      {/* Stats Section */}
      <div className="relative z-10 px-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-[24px] p-5 border border-white/5 flex flex-col items-center">
          <div className="text-center mb-5 w-full border-b border-white/5 pb-5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Points</span>
            <span className="text-5xl font-black text-white tabular-nums tracking-tighter">
              {mysteryMode ? '???' : stats.total_points}
            </span>
          </div>

          <div className="flex justify-around w-full px-2">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-yellow-500 tabular-nums tracking-tighter mb-1">{stats.golds}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gold</span>
            </div>
            <div className="w-px bg-white/10 mx-2" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-gray-400 tabular-nums tracking-tighter mb-1">{stats.silvers}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Silver</span>
            </div>
            <div className="w-px bg-white/10 mx-2" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-orange-500 tabular-nums tracking-tighter mb-1">{stats.bronzes}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bronze</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="relative z-10 px-4 sticky top-[52px] bg-black/55 backdrop-blur-xl py-3">
        <div className="flex bg-white/10 p-1 rounded-xl overflow-x-auto no-scrollbar snap-x border border-white/5">
          {(['all', 'gold', 'silver', 'bronze'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 min-w-[70px] snap-center py-1.5 px-2 text-[12px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f === 'gold' ? 'Gold' : f === 'silver' ? 'Silver' : 'Bronze'}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="relative z-10 px-4 mt-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {displayItems.length > 0 ? (
            displayItems.map((item: any, i) => {
              const isSchedule = item.itemType === 'schedule';
              const isLive = isSchedule && item.computedStatus === 'ongoing';
              const isMedal = !isSchedule;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id || i}
                  className="bg-white/10 backdrop-blur-sm rounded-[18px] p-4 flex flex-col gap-3 relative overflow-hidden border border-white/5"
                >
                  {isMedal && item.medal_type === 'gold' && (
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400 to-transparent pointer-events-none mix-blend-screen" />
                  )}
                  {isMedal && item.medal_type === 'silver' && (
                    <div className="absolute inset-0 opacity-[0.055] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-300 to-transparent pointer-events-none mix-blend-screen" />
                  )}
                  {isMedal && item.medal_type === 'bronze' && (
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500 to-transparent pointer-events-none mix-blend-screen" />
                  )}

                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <h4 className="font-bold text-[15px] text-white tracking-tight">{item.events?.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.events?.gender && item.events.gender !== 'N/A' && (
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.events.gender}</span>
                          )}
                          {item.events?.category && (
                            <>
                              <span className="text-gray-700">·</span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{getCategoryName(item.events.category)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end justify-center">
                      {isSchedule ? (
                        isLive ? (
                          <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest animate-pulse">● Live</span>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Upcoming</span>
                        )
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {item.medal_type === 'gold' && <span className="text-yellow-500 text-[13px] font-black uppercase tracking-wider">Gold</span>}
                          {item.medal_type === 'silver' && <span className="text-gray-300 text-[13px] font-black uppercase tracking-wider">Silver</span>}
                          {item.medal_type === 'bronze' && <span className="text-orange-500 text-[13px] font-black uppercase tracking-wider">Bronze</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSchedule && item.start_time && (
                    <div className="pt-2 mt-1 border-t border-white/5 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                      <span>{formatDate(item.date)}</span>
                      <span>{formatTime(item.start_time)}</span>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="opacity-20 mb-3">
                <Trophy className="w-12 h-12" />
              </div>
              <p className="text-gray-500 font-medium text-sm">
                {`No ${filter !== 'all' ? filter : ''} medals found.`}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
