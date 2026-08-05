"use client";

import React, { Fragment } from "react";
import Image from "next/image";
import { CardContent } from "@/components/ui/Card";
import { FaTrophy } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/lib/utils";
import { CalendarDays, Trophy, Clock, PlayCircle, LayoutGrid } from "lucide-react";
import { stringToColor } from "@/utils/colors";
import { useScheduleViewModel } from "@/features/schedule/viewModels/useScheduleViewModel";
import { ScheduleClientPageProps } from "@/features/schedule/models/scheduleTypes";
import { Department } from "@/shared/models/tournamentTypes";

export default function ScheduleClientPage({ 
    initialSchedules, 
    initialEvents, 
    initialVenues, 
    initialCategories,
    initialDepartments,
    mysteryMode: initialMysteryMode
}: ScheduleClientPageProps) {
  const {
    filteredSchedules,
    searchQuery,
    setSearchQuery,
    statusTab,
    setStatusTab,
    showRefresh,
    refreshPage,
    isSearchFocused,
    setIsSearchFocused,
    getDynamicStatus,
    getDepartmentInfo,
    getCategoryName,
  } = useScheduleViewModel({
    initialSchedules,
    initialDepartments,
    initialCategories,
    initialMysteryMode
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString + 'T00:00:00');
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center gap-3">
        <CalendarDays className="w-8 h-8 md:w-10 md:h-10 text-monument-primary shrink-0" strokeWidth={3} />
        <h1 className="text-3xl md:text-4xl font-black text-monument-primary uppercase tracking-tight leading-none pt-1">Schedule</h1>
      </div>

      <AnimatePresence>
        {showRefresh && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-28 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <button
              onClick={() => window.location.reload()}
              className="flex w-full md:w-auto items-center gap-3 bg-white dark:bg-gray-800 shadow-xl rounded-2xl pl-4 pr-5 py-3 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 active:scale-[0.98] transition-all text-left outline-none cursor-pointer group pointer-events-auto"
            >
              <div className="flex bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 w-10 h-10 rounded-full items-center justify-center text-xl shrink-0 group-hover:rotate-12 transition-transform">
                ⭐
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                  New schedule updates available!
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Click here to refresh the match schedules
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-row items-center justify-between mb-6 w-full relative">
        <div className={`relative transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink w-full ${isSearchFocused ? 'max-w-full flex-1 z-20 md:max-w-sm md:flex-none' : 'max-w-[60%] sm:max-w-sm'}`}>
          <svg className={`absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 font-black transition-colors duration-300 ${isSearchFocused ? 'text-monument-primary' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input 
            type="text" 
            placeholder="Search events, venues, or categories..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`pl-10 md:pl-12 py-2.5 md:py-3 w-full bg-white dark:bg-gray-800 border-2 rounded-xl text-sm focus:outline-none focus:ring-0 transition-all font-medium text-gray-700 dark:text-gray-200 ${isSearchFocused ? 'border-monument-primary shadow-xl shadow-monument-primary/10' : 'border-gray-100 dark:border-gray-700 shadow-sm'}`}
          />
        </div>
        <div 
          className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center bg-gray-50 rounded-xl dark:bg-gray-900 shadow-inner overflow-hidden whitespace-nowrap transform-gpu shrink-0 ${isSearchFocused ? 'max-w-0 opacity-0 p-0 ml-0 gap-0 border-0 pointer-events-none md:max-w-xl md:opacity-100 md:p-1 md:ml-4 md:gap-1 md:pointer-events-auto' : 'max-w-md md:max-w-xl opacity-100 p-1 ml-2 md:ml-4 gap-1'}`}
        >
          {(['all', 'ongoing', 'upcoming', 'finished'] as const).map(tab => {
            const isActive = statusTab === tab;
            let Icon = LayoutGrid;
            let label = "All";
            let colorClass = "text-gray-400";
            if (tab === 'ongoing') { Icon = PlayCircle; label = "Ongoing"; colorClass = "text-emerald-500"; }
            if (tab === 'upcoming') { Icon = Clock; label = "Upcoming"; colorClass = "text-amber-500"; }
            if (tab === 'finished') { Icon = Trophy; label = "Finished"; colorClass = "text-rose-500"; }
            
            return (
              <button 
                key={tab}
                onClick={() => setStatusTab(tab)} 
                className={`px-3 md:px-4 py-2 md:py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5 md:gap-2 ${isActive ? `bg-white shadow-md dark:bg-gray-700 ${colorClass}` : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={label}
              >
                <Icon className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" strokeWidth={isActive ? 3 : 2} />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
          <motion.div key="card-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((s) => {
                const { label, color, icon, status } = getDynamicStatus(s);
                const isLive = status === 'live';
                
                // Calculate gradient based on teams
                const team1Info = s.departments[0] ? getDepartmentInfo(s.departments[0]) : null;
                const team2Info = s.departments[1] ? getDepartmentInfo(s.departments[1]) : null;
                const color1 = team1Info ? stringToColor(team1Info.abbreviation || team1Info.name) : 'rgba(150,150,150,0.1)';
                const color2 = team2Info ? stringToColor(team2Info.abbreviation || team2Info.name) : 'rgba(150,150,150,0.1)';

                return (
                  <div key={s.id} className="relative bg-apple-light-card dark:bg-apple-dark-card rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
                    
                    {/* Background Wash Gradient */}
                    <div 
                      className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none mix-blend-multiply dark:mix-blend-screen"
                      style={{
                        background: s.departments.length === 2 
                          ? `linear-gradient(135deg, ${color1} 0%, transparent 40%, transparent 60%, ${color2} 100%)`
                          : s.departments.length === 1 
                            ? `radial-gradient(circle at top left, ${color1} 0%, transparent 70%)`
                            : 'transparent'
                      }}
                    />

                    <div className="relative z-10 flex-1 p-5 space-y-4 flex flex-col">
                      {/* Top Header: Category and Status */}
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-1.5">
                           <span className="text-xl drop-shadow-sm">{s.events?.icon || '🏅'}</span>
                           <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                              {s.events?.name}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           {isLive ? (
                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-100 dark:border-red-900/30">
                               <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                               <span className="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Live</span>
                             </div>
                           ) : status === 'finished' ? (
                             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Final</span>
                           ) : (
                             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                               {s.start_time.startsWith("00:00") && s.end_time?.startsWith("23:59") ? "All Day" : formatTime(s.start_time)}
                             </span>
                           )}
                        </div>
                      </div>

                      {/* Main Matchup Content */}
                      <div className="flex-1 flex flex-col justify-center py-2 gap-4">
                          {s.departments.length === 0 ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold">?</div>
                                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">TBA</span>
                            </div>
                          ) : s.departments.map((dep, i) => {
                            const dInfo = getDepartmentInfo(dep);
                            const isWinner = s.winner_id === dInfo.id && s.winner_id !== null;
                            const score = i === 0 ? s.score_a : s.score_b;
                            
                            return (
                              <div key={i} className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center relative">
                                    {dInfo.image_url ? (
                                      <Image 
                                        src={dInfo.image_url} 
                                        alt={dInfo.name} 
                                        width={40} 
                                        height={40} 
                                        className="object-contain w-full h-full drop-shadow-sm" 
                                      />
                                    ) : (
                                      <div className={`w-full h-full rounded-full flex items-center justify-center text-[10px] font-black border-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700`}>
                                        {dInfo.abbreviation || (dInfo.name?.slice(0, 2).toUpperCase() || "??")}
                                      </div>
                                    )}
                                    {isWinner && (
                                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm text-[8px]">
                                          ⭐
                                       </div>
                                    )}
                                  </div>
                                  <span className={`text-base tracking-tight uppercase max-w-[160px] truncate ${isWinner ? 'text-gray-900 dark:text-white font-black' : 'text-gray-700 dark:text-gray-300 font-bold'}`}>
                                    {dInfo.nickname || dInfo.abbreviation || dInfo.name}
                                  </span>
                                </div>
                                
                                {(status === 'live' || status === 'finished') && (score !== null && score !== undefined) && (
                                  <span className={`text-2xl font-black tabular-nums tracking-tighter ${isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {score}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {/* Bottom Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                         <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 truncate max-w-[60%]">
                            {s.venues?.name || "TBA"}
                         </span>
                         <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                            {formatDate(s.date)}
                         </span>
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                <span className="text-6xl mb-4 opacity-30">🗓️</span>
                <h3 className="text-xl font-black text-gray-400 uppercase tracking-tight">
                  {statusTab === 'all' 
                    ? (searchQuery ? "No matching schedules" : "No schedules yet")
                    : (searchQuery 
                      ? `No matching ${statusTab} events` 
                      : `No ${statusTab} events yet`
                    )
                  }
                </h3>
              </div>
            )}
          </motion.div>
      </AnimatePresence>
    </div>
  );
};
