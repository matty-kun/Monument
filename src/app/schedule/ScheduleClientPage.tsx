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
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrophy } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/lib/utils";
import { CalendarDays, Trophy, Clock, PlayCircle, LayoutGrid } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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
  end_time: string | null;
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
    mysteryMode?: boolean;
}

export default function ScheduleClientPage({ 
    initialSchedules, 
    initialEvents, 
    initialVenues, 
    initialCategories,
    initialDepartments,
    mysteryMode: initialMysteryMode
}: ScheduleClientPageProps) {
  const [mysteryMode, setMysteryMode] = useState(initialMysteryMode || false);
  const [schedules] = useState<Schedule[]>(initialSchedules);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>(initialSchedules);
  const [allEvents] = useState<Event[]>(initialEvents);
  const [allVenues] = useState<Venue[]>(initialVenues);
  const [allDepartments] = useState<Department[]>(initialDepartments);
  const [allCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<'all' | 'ongoing' | 'upcoming' | 'finished'>('all');
  const [showRefresh, setShowRefresh] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('public-schedules-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules' },
        () => {
          setShowRefresh(true);
        }
      )
      .subscribe();

    // 🔔 Subscribe to Mystery Mode changes in realtime
    const mysterySub = supabase
      .channel('app_settings_schedule')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: "key=eq.mystery_mode" },
        (payload) => {
          if (payload.new && (payload.new as any).key === 'mystery_mode') {
            setMysteryMode((payload.new as any).value === 'true');
          } else if (payload.eventType === 'DELETE') {
            setMysteryMode(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(mysterySub);
    };
  }, [supabase]);

  const getDynamicStatus = useCallback((schedule: Schedule): { status: ScheduleStatus; label: string; color: string; icon: string } => {
    if (schedule.status === "finished") {
      return { status: "finished", label: "Finished", color: "bg-rose-500", icon: "🏁" };
    }
    if (!schedule.date || !schedule.start_time) {
      return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    }
    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const endStr = schedule.end_time ? `${schedule.end_date || schedule.date}T${schedule.end_time}` : null;
    const end = endStr ? new Date(endStr) : null;
    if (isNaN(start.getTime())) return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    if (now < start) return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    if (now >= start && (!end || now <= end)) return { status: "live", label: "Live Now", color: "bg-emerald-500 animate-pulse", icon: "🔴" };
    return { status: "finished", label: "Finished", color: "bg-rose-500", icon: "🏁" };
  }, []);

  const getCategoryName = useCallback((categoryId: string | { name: string } | null | undefined) => {
    if (!categoryId) return null;
    if (typeof categoryId === 'object' && categoryId !== null && 'name' in categoryId) return categoryId.name;
    return allCategories.find(c => c.id === categoryId)?.name || null;
  }, [allCategories]);

  useEffect(() => {
    let filtered: Schedule[] = [...schedules];

    if (statusTab !== 'all') {
      filtered = filtered.filter(s => {
        const status = getDynamicStatus(s).status;
        if (statusTab === 'ongoing') return status === 'live';
        if (statusTab === 'upcoming') return status === 'scheduled';
        return status === 'finished';
      });
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const eventName = s.events?.name?.toLowerCase() || '';
        const departmentNames = s.departments.map(d => (typeof d === 'string' ? d.toLowerCase() : d.name.toLowerCase()));
        const categoryName = s.events?.category ? (typeof s.events.category === 'object' ? s.events.category.name.toLowerCase() : getCategoryName(s.events.category)?.toLowerCase() || '') : '';
        const venueName = s.venues?.name?.toLowerCase() || '';
        return eventName.includes(lowercasedQuery) || departmentNames.some(dn => dn.includes(lowercasedQuery)) || categoryName.includes(lowercasedQuery) || venueName.includes(lowercasedQuery);
      });
    }

    filtered.sort((a, b) => {
      const statA = getDynamicStatus(a).status;
      const statB = getDynamicStatus(b).status;

      const prioA = statA === 'live' ? 0 : statA === 'scheduled' ? 1 : 2;
      const prioB = statB === 'live' ? 0 : statB === 'scheduled' ? 1 : 2;

      if (prioA !== prioB) return prioA - prioB;

      const timeA = new Date(`${a.date}T${a.start_time}`).getTime();
      const timeB = new Date(`${b.date}T${b.start_time}`).getTime();
      const valA = isNaN(timeA) ? Infinity : timeA;
      const valB = isNaN(timeB) ? Infinity : timeB;

      if (valA !== valB) {
        if (prioA === 2) {
          // Both finished, sort by most recently finished (descending)
          return valB - valA;
        }
        // Both live or upcoming, sort by closest first (ascending)
        return valA - valB;
      }
      
      const nameA = a.events?.name?.toLowerCase() || '';
      const nameB = b.events?.name?.toLowerCase() || '';
      if (nameA !== nameB) return nameA.localeCompare(nameB);

      const venueA = a.venues?.name?.toLowerCase() || '';
      const venueB = b.venues?.name?.toLowerCase() || '';
      return venueA.localeCompare(venueB);
    });

    setFilteredSchedules(filtered);
  }, [schedules, searchQuery, statusTab, getCategoryName, getDynamicStatus]);

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
                          {s.departments.length === 0 ? (
                            <div className="flex flex-col items-center py-2 opacity-50">
                               <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 shadow-inner">
                                  ?
                               </div>
                               <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em]">TBA</span>
                            </div>
                          ) : s.departments.map((dep, i) => {
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
                                  <div className={`w-14 h-14 flex items-center justify-center transition-all ${isWinner ? 'scale-110' : ''}`}>
                                    {dInfo.image_url ? (
                                      <Image 
                                        src={dInfo.image_url} 
                                        alt={dInfo.name} 
                                        width={56} 
                                        height={56} 
                                        className="object-contain w-full h-full drop-shadow-md" 
                                      />
                                    ) : (
                                      <div className={`w-full h-full rounded-full flex items-center justify-center text-[11px] font-black border-4 shadow-xl ${isWinner ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-500/20' : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 border-white dark:border-gray-500'}`}>
                                        {dInfo.abbreviation || (dInfo.name?.slice(0, 2).toUpperCase() || "??")}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col mt-0.5">
                                     {isWinner && (
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[7px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Winner</motion.span>
                                     )}
                                     <span className={`text-[9px] uppercase tracking-tight mt-0.5 leading-tight max-w-[80px] break-words line-clamp-2 transition-colors ${isWinner ? 'text-gray-900 dark:text-white font-black' : 'text-gray-600 dark:text-gray-300 font-bold'}`}>{dInfo.nickname || dInfo.name}</span>
                                  </div>
                                </div>
                                {i < s.departments.length - 1 && <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 italic opacity-60 self-center">vs</span>}
                              </Fragment>
                            );
                          })}
                        </div>
                        
                        {status === "finished" && s.departments.length === 2 && (Number(s.score_a) > 0 || Number(s.score_b) > 0) && (
                          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 font-black text-2xl italic text-gray-900 dark:text-gray-100">
                             <span className={s.winner_id === (typeof s.departments[0] === 'object' ? (s.departments[0] as Department).id : null) ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>{s.score_a || 0}</span>
                             <span className="text-gray-300 dark:text-gray-600">—</span>
                             <span className={s.winner_id === (typeof s.departments[1] === 'object' ? (s.departments[1] as Department).id : null) ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>{s.score_b || 0}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Schedule</span>
                          <p className="text-[10px] font-black text-gray-800 dark:text-gray-100 uppercase">{s.start_time.startsWith("00:00") && s.end_time?.startsWith("23:59") ? "All Day" : `${formatTime(s.start_time)}${s.end_time ? ` — ${formatTime(s.end_time)}` : ''}`}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Venue</span>
                          <p className="text-[10px] font-black text-monument-primary dark:text-violet-400 uppercase italic truncate w-full px-2">{s.venues?.name || "TBA"}</p>
                        </div>
                      </div>
                    </CardContent>
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
