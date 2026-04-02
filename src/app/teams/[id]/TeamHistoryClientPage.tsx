"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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
}

export default function TeamHistoryClientPage({ team, results, stats, allCategories, schedules = [] }: TeamHistoryClientPageProps) {
  const [filter, setFilter] = useState<'all' | 'gold' | 'silver' | 'bronze' | 'upcoming'>('all');

  const getDynamicStatus = (schedule: any): 'upcoming' | 'ongoing' | 'finished' => {
    if (!schedule.date || !schedule.start_time || !schedule.end_time) return 'upcoming';
    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const end = new Date(`${schedule.date}T${schedule.end_time}`);
    if (isNaN(start.getTime()) || now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'finished';
  };

  const displayItems = useMemo(() => {
    const items: any[] = [];
    
    // Process Schedules (Upcoming / Live)
    if (filter === 'all' || filter === 'upcoming') {
      const activeSchedules = schedules
        .filter(s => {
          const status = getDynamicStatus(s);
          return status !== 'finished';
        })
        .map(s => ({
          ...s,
          itemType: 'schedule',
          computedStatus: getDynamicStatus(s)
        }));
      items.push(...activeSchedules);
    }

    // Process Results (Medals)
    if (filter !== 'upcoming') {
      const filteredResults = results
        .filter((r) => filter === 'all' || r.medal_type === filter)
        .map(r => ({ ...r, itemType: 'result' }));
        
      filteredResults.sort((a, b) => {
        const val = { gold: 3, silver: 2, bronze: 1 };
        return val[b.medal_type as keyof typeof val] - val[a.medal_type as keyof typeof val];
      });
      
      items.push(...filteredResults);
    }

    return items;
  }, [results, schedules, filter]);

  // Helper to generate initials from team name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(w => !['of', 'and', 'the'].includes(w.toLowerCase()))
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return allCategories?.find(c => c.id === categoryId)?.name || categoryId;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-12">
      {/* Header section with back button as a rounded card */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-3xl p-5 md:p-8 border border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-monument-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Leaderboard
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 w-full">
            {/* Left Box: Logo and Text */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 flex-1">
              <div className="relative w-32 h-32 md:w-48 md:h-48 shrink-0">
                {team.image_url ? (
                  <Image 
                    src={team.image_url} 
                    alt={team.name} 
                    fill
                    className="object-cover rounded-full border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-200 dark:border-gray-700 text-4xl md:text-5xl font-bold text-slate-500 dark:text-slate-400">
                    {getInitials(team.name)}
                  </div>
                )}
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">{team.name}</h1>
                {team.abbreviation && (
                  <h2 className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium">{team.abbreviation}</h2>
                )}
              </div>
            </div>

            {/* Right Box: Points & Medals */}
            <div className="flex flex-col items-center md:items-stretch w-full md:w-auto shrink-0 mt-4 md:mt-0 max-w-sm">
              <div className="bg-slate-600 dark:bg-[#1e1b4b]/60 border-2 border-slate-500 dark:border-indigo-900/50 rounded-3xl px-6 md:px-10 py-5 flex flex-col items-center mb-4 w-full text-center shadow-md">
                <span className="text-xs font-semibold text-indigo-200 dark:text-indigo-300 mb-1 uppercase tracking-widest">Total Points</span>
                <span className="text-6xl font-black text-monument-primary drop-shadow-sm">{stats.total_points}</span>
              </div>
              

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h3 className="text-2xl font-bold flex items-center gap-2 dark:text-gray-100">
            🏆 Competition History & Upcoming
          </h3>
          
          <div className="grid grid-cols-3 sm:flex flex-wrap bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl w-full sm:w-auto gap-0.5 sm:gap-1">
            {(['all', 'gold', 'silver', 'bronze', 'upcoming'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex-1 text-center whitespace-nowrap ${
                  filter === f 
                    ? 'bg-white text-gray-900 shadow-md transform scale-[1.02] dark:bg-gray-700 dark:text-white' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50 dark:text-gray-400 dark:hover:text-gray-200'
                } ${f === 'upcoming' ? 'col-span-2 sm:col-span-1' : ''} ${f === 'bronze' ? 'col-span-1' : ''}`}
              >
                {f === 'all' ? 'All' : f === 'gold' ? '🥇 Gold' : f === 'silver' ? '🥈 Silver' : f === 'bronze' ? '🥉 Bronze' : '⏳ Upcoming'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.length > 0 ? (
            displayItems.map((item: any, i) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`relative overflow-hidden p-5 rounded-2xl border ${
                  item.itemType === 'schedule' 
                    ? item.computedStatus === 'ongoing'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
                      : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50'
                    : item.medal_type === 'gold' 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50' 
                      : item.medal_type === 'silver' 
                        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50'
                } shadow-sm flex flex-col items-center justify-center text-center pb-6`}
              >
                <div className="absolute top-3 right-3 text-sm font-medium px-2.5 py-1 rounded-full bg-white/50 dark:bg-black/20 shadow-sm whitespace-nowrap">
                  {item.itemType === 'schedule' ? (
                    item.computedStatus === 'ongoing' ? (
                      <span className="text-green-600 dark:text-green-400 drop-shadow-sm flex items-center gap-1"><span className="animate-pulse">🔴</span> Live Now</span>
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 drop-shadow-sm">⏳ Upcoming</span>
                    )
                  ) : (
                    <>
                      {item.medal_type === 'gold' && <span className="text-yellow-600 dark:text-yellow-400 drop-shadow-sm">🥇 Gold</span>}
                      {item.medal_type === 'silver' && <span className="text-gray-600 dark:text-gray-300 drop-shadow-sm">🥈 Silver</span>}
                      {item.medal_type === 'bronze' && <span className="text-orange-600 dark:text-orange-400 drop-shadow-sm">🥉 Bronze</span>}
                    </>
                  )}
                </div>
                
                <span className="text-6xl mb-3 mt-4">{item.events?.icon || '🏅'}</span>
                
                <h4 className="font-bold text-lg dark:text-gray-100 max-w-full truncate px-4">{item.events?.name}</h4>
                
                {item.itemType === 'schedule' && item.start_time && (
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 mb-2">
                    {item.date && new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} • {item.start_time.substring(0, 5)}
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  {item.events?.category && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/30 text-gray-600 dark:text-gray-300">
                       {getCategoryName(item.events.category)}
                    </span>
                  )}
                  {item.events?.division && item.events.division !== 'N/A' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/30 text-gray-600 dark:text-gray-300">
                       {item.events.division}
                    </span>
                  )}
                  {item.events?.gender && item.events.gender !== 'N/A' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/30 text-gray-600 dark:text-gray-300">
                       {item.events.gender}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="text-6xl mb-4 opacity-50">{filter === 'upcoming' ? '⏳' : '🏆'}</div>
              <h4 className="text-xl font-medium text-gray-600 dark:text-gray-400">
                {filter === 'upcoming' 
                  ? "No upcoming schedules found for this team." 
                  : `No ${filter !== 'all' ? filter : ''} medals found for this team.`}
              </h4>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
