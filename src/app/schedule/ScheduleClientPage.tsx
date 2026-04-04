"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Fragment,
} from "react";
import Image from "next/image";
import { CardContent } from "@/components/ui/Card";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTable, FaThLarge, FaTrophy } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  abbreviation?: string | null;
  image_url?: string;
  nickname?: string;
}

interface Event {
  id: string;
  name: string;
  abbreviation?: string;
  icon: string | null;
  category: string | { name: string } | null;
  division: string | null;
  gender: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Venue {
  id?: string;
  name: string;
}

interface Schedule {
  id: string;
  event_id: string;
  venue_id: string;
  events: Event | null;
  venues: Venue | null;
  departments: (Department | string)[];
  start_time: string;
  end_time: string;
  date: string;
  end_date?: string | null;
  status: "scheduled" | "live" | "finished";
  winner_id?: string | null;
  score_a?: number | null;
  score_b?: number | null;
}

type ScheduleStatus = "live" | "scheduled" | "finished";

interface ScheduleClientPageProps {
    initialSchedules: Schedule[];
    initialEvents: Event[];
    initialVenues: Venue[];
    initialCategories: Category[];
    initialDepartments: Department[];
}

export default function ScheduleClientPage({ 
    initialSchedules, 
    initialEvents, 
    initialVenues, 
    initialCategories,
    initialDepartments
}: ScheduleClientPageProps) {
  const [schedules] = useState<Schedule[]>(initialSchedules);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>(initialSchedules);
  const [allEvents] = useState<Event[]>(initialEvents);
  const [allVenues] = useState<Venue[]>(initialVenues);
  const [allDepartments] = useState<Department[]>(initialDepartments);
  const [allCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card'); 

  const getDynamicStatus = useCallback((schedule: Schedule): { status: ScheduleStatus; label: string; color: string; icon: string } => {
    if (schedule.status === "finished") {
      return { status: "finished", label: "Finished", color: "bg-rose-500", icon: "🏁" };
    }
    if (!schedule.date || !schedule.start_time || !schedule.end_time) {
      return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    }
    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const end = new Date(`${schedule.end_date || schedule.date}T${schedule.end_time}`);
    if (isNaN(start.getTime())) return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    if (now < start) return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    if (now >= start && now <= end) return { status: "live", label: "Live Now", color: "bg-emerald-500 animate-pulse", icon: "🔴" };
    return { status: "finished", label: "Finished", color: "bg-rose-500", icon: "🏁" };
  }, []);

  const getCategoryName = useCallback((categoryId: string | { name: string } | null | undefined) => {
    if (!categoryId) return null;
    if (typeof categoryId === 'object' && categoryId !== null && 'name' in categoryId) return categoryId.name;
    return allCategories.find(c => c.id === categoryId)?.name || null;
  }, [allCategories]);

  useEffect(() => {
    let filtered: Schedule[] = [...schedules];
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const eventName = s.events?.name?.toLowerCase() || '';
        const departmentNames = s.departments.map(d => (typeof d === 'string' ? d.toLowerCase() : d.name.toLowerCase()));
        const categoryName = s.events?.category ? (typeof s.events.category === 'object' ? s.events.category.name.toLowerCase() : getCategoryName(s.events.category)?.toLowerCase() || '') : '';
        return eventName.includes(lowercasedQuery) || departmentNames.some(dn => dn.includes(lowercasedQuery)) || categoryName.includes(lowercasedQuery);
      });
    }
    setFilteredSchedules(filtered);
  }, [schedules, searchQuery, getCategoryName]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString + 'T00:00:00');
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const getDepartmentInfo = (d: Department | string): Department => {
    if (typeof d === 'string') {
      const matched = allDepartments.find(dept => dept.name === d || dept.abbreviation === d);
      return (matched as Department) || { id: '', name: d, abbreviation: d, image_url: null };
    }
    return d as Department;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-monument-primary uppercase tracking-tight mb-2">🗓️ Schedule</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium italic">View upcoming, live, and recorded victories across the tournament</p>
      </div>

      <div className="flex flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 font-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input type="text" placeholder="Search events, teams, or categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-12 py-3 w-full bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm" />
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl dark:bg-gray-900 shadow-inner self-center shrink-0">
          <button onClick={() => setViewMode('card')} className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${viewMode === 'card' ? 'bg-white text-monument-primary shadow-md dark:bg-gray-700 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}><FaThLarge /> Cards</button>
          <button onClick={() => setViewMode('table')} className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-monument-primary shadow-md dark:bg-gray-700 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}><FaTable /> Table</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'card' ? (
          <motion.div key="card-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((s) => {
                const { label, color, icon, status } = getDynamicStatus(s);
                return (
                  <div key={s.id} className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
                    <div className={`${color} px-6 py-2.5 flex justify-between items-center text-white`}>
                      <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">{icon} {label}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{s.end_date && s.end_date !== s.date ? `${formatDate(s.date)} — ${formatDate(s.end_date)}` : formatDate(s.date)}</span>
                    </div>
                    <CardContent className="p-6 space-y-4 flex-1 text-center flex flex-col">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl drop-shadow-sm">{s.events?.icon || '🏅'}</span>
                          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight leading-tight">{s.events?.name || "N/A"}</h3>
                        </div>
                        {(() => {
                          const catName = s.events?.category ? (typeof s.events.category === 'object' ? s.events.category.name : getCategoryName(s.events.category)) : null;
                          const div = s.events?.division && s.events.division !== 'N/A' ? s.events.division : null;
                          const gen = s.events?.gender && s.events.gender !== 'N/A' ? s.events.gender : null;
                          return (catName || div || gen) ? (
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-0.5 min-h-[18px]">
                              {catName && <span className="bg-blue-50/50 text-blue-600 px-2 py-0.5 rounded-full dark:bg-blue-900/10 dark:text-blue-300 text-[8px] font-black uppercase tracking-widest leading-none">{catName}</span>}
                              {div && <span className="bg-purple-50/50 text-purple-600 px-2 py-0.5 rounded-full dark:bg-purple-900/10 dark:text-purple-300 text-[8px] font-black uppercase tracking-widest leading-none">{div}</span>}
                              {gen && <span className="bg-rose-50/50 text-rose-600 px-2 py-0.5 rounded-full dark:bg-rose-900/10 dark:text-rose-300 text-[8px] font-black uppercase tracking-widest leading-none">{gen}</span>}
                            </div>
                          ) : null;
                        })()}
                      </div>

                      <div className="bg-gray-50/30 dark:bg-gray-900/20 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/50 flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-around gap-2 relative">
                          {s.departments.map((dep, i) => {
                            const dInfo = getDepartmentInfo(dep);
                            const isWinner = s.winner_id === dInfo.id && s.winner_id !== null;
                            const isH2H = s.departments.length === 2;
                            
                            return (
                              <Fragment key={i}>
                                <div className="flex flex-col items-center gap-2.5 relative">
                                  {isWinner && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-3 -right-1 z-10 w-6 h-6 flex items-center justify-center text-sm drop-shadow-md">
                                        <FaTrophy className="text-yellow-400" />
                                    </motion.div>
                                  )}
                                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-black border-4 shadow-xl transition-all ${isWinner ? 'bg-yellow-400 text-yellow-900 border-yellow-500 scale-110 shadow-yellow-500/20' : 'bg-white dark:bg-gray-700 text-gray-400 border-white dark:border-gray-800'}`}>
                                    {dInfo.image_url ? <Image src={dInfo.image_url} alt={dInfo.name} width={56} height={56} className="rounded-full object-cover w-full h-full" /> : (dInfo.abbreviation || dInfo.name.slice(0, 2).toUpperCase())}
                                  </div>
                                  <div className="flex flex-col mt-0.5">
                                     {isWinner && isH2H && (
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[7px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Winner</motion.span>
                                     )}
                                     <span className={`text-[9px] font-bold uppercase tracking-tight mt-0.5 leading-tight max-w-[80px] break-words line-clamp-2 transition-colors ${isWinner ? 'text-gray-900 dark:text-white font-black' : 'text-gray-500/80'}`}>{dInfo.nickname || dInfo.name}</span>
                                  </div>
                                </div>
                                {i < s.departments.length - 1 && <span className="text-[10px] font-black text-gray-200 dark:text-gray-700 italic opacity-20 self-center">vs</span>}
                              </Fragment>
                            );
                          })}
                        </div>
                        
                        {status === "finished" && s.departments.length === 2 && (Number(s.score_a) > 0 || Number(s.score_b) > 0) && (
                          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 font-black text-2xl italic text-gray-900 dark:text-gray-100">
                             <span className={s.winner_id === (typeof s.departments[0] === 'object' ? s.departments[0].id : null) ? 'text-emerald-500' : 'opacity-40'}>{s.score_a || 0}</span>
                             <span className="text-gray-200">—</span>
                             <span className={s.winner_id === (typeof s.departments[1] === 'object' ? s.departments[1].id : null) ? 'text-emerald-500' : 'opacity-40'}>{s.score_b || 0}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Schedule</span>
                          <p className="text-[10px] font-black text-gray-800 dark:text-gray-100 uppercase">{s.start_time.startsWith("00:00") && s.end_time.startsWith("23:59") ? "All Day" : `${formatTime(s.start_time)} — ${formatTime(s.end_time)}`}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Venue</span>
                          <p className="text-[10px] font-black text-monument-primary uppercase italic truncate w-full px-2">{s.venues?.name || "TBA"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                <span className="text-6xl mb-4 opacity-30">🗓️</span>
                <h3 className="text-xl font-black text-gray-400 uppercase tracking-tight">No matching schedules</h3>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="table-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="overflow-hidden rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full bg-white dark:bg-gray-800">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Competition</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue</th>
                    <th className="px-8 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Matchup</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredSchedules.map((s) => {
                    const { label, color } = getDynamicStatus(s);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <span className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform">{s.events?.icon || '🏅'}</span>
                              <div className="flex flex-col">
                                 <span className="font-black text-sm text-gray-900 dark:text-gray-100 uppercase tracking-tight">{s.events?.name}</span>
                                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.events?.category ? (typeof s.events.category === 'object' ? s.events.category.name : getCategoryName(s.events.category)) || '' : ''}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-800 dark:text-gray-100">{s.end_date && s.end_date !== s.date ? `${formatDate(s.date)} — ${formatDate(s.end_date)}` : formatDate(s.date)}</span>
                              <span className="text-[10px] font-bold text-monument-primary uppercase italic mt-1">{s.start_time.startsWith("00:00") && s.end_time.startsWith("23:59") ? "All Day" : `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-xs font-black text-gray-500 uppercase italic tracking-tight">{s.venues?.name || 'TBA'}</td>
                        <td className="px-8 py-5">
                           <div className="flex items-center justify-center gap-6">
                              {s.departments.map((dep, i) => {
                                 const dInfo = getDepartmentInfo(dep);
                                 const isWinner = s.winner_id === dInfo.id && s.winner_id !== null;
                                 return (
                                    <Fragment key={i}>
                                       <div className="flex items-center gap-2 relative">
                                          {isWinner && <span className="absolute -top-3 -right-1 text-[10px]">🏆</span>}
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all ${isWinner ? 'bg-yellow-400 text-yellow-900 border-yellow-500 scale-110 shadow-md' : 'bg-gray-50 text-gray-400 border-white dark:border-gray-700/50'}`}>
                                             {dInfo.image_url ? <img src={dInfo.image_url} className="w-full h-full rounded-full object-cover" /> : (dInfo.abbreviation || dInfo.name.slice(0, 2).toUpperCase())}
                                          </div>
                                          <span className={`text-[10px] font-black uppercase ${isWinner ? 'text-yellow-600 font-black' : 'text-gray-400'}`}>{dInfo.nickname || dInfo.abbreviation || dInfo.name}</span>
                                       </div>
                                       {i < s.departments.length - 1 && <span className="text-[10px] opacity-20 italic font-black">vs</span>}
                                    </Fragment>
                                 );
                              })}
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`${color} px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-md`}>{label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
