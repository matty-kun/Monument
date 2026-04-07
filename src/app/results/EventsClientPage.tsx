"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { Trophy } from "lucide-react";

// Types
interface ProcessedResult {
  event_name: string;
  category: string | null;
  division: string | null;
  gender: string | null;
  event_icon: string | null;
  department_id: string | null;
  department_name: string | null;
  department_abbreviation: string | null;
  department_image_url?: string;
  medal_type: "gold" | "silver" | "bronze";
  created_at?: string;
}

interface WinnerInfo {
  department_id: string | null;
  department_name: string | null;
  department_abbreviation: string | null;
  image_url?: string;
}

interface GroupedResult {
  icon: string | null;
  category: string | null;
  division: string | null;
  gender: string | null;
  winners: Partial<Record<"gold" | "silver" | "bronze", WinnerInfo>>;
}

interface EventsClientPageProps {
  initialResults: ProcessedResult[];
  initialCategories: { id: string; name: string; icon?: string }[];
  mysteryMode?: boolean;
}

export default function EventsClientPage({ initialResults, initialCategories, mysteryMode: initialMysteryMode }: EventsClientPageProps) {
  const [mysteryMode, setMysteryMode] = useState(initialMysteryMode || false);
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

  const [results] = useState<ProcessedResult[]>(initialResults);
  const [filteredResults, setFilteredResults] = useState<ProcessedResult[]>(initialResults);
  const [allCategories] = useState(initialCategories);
  const [allDepartments, setAllDepartments] = useState<{ name: string; image_url: string | null; abbreviation?: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showRefresh, setShowRefresh] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('public-events-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        () => {
          setShowRefresh(true);
        }
      )
      .subscribe();

    // 🔔 Subscribe to Mystery Mode changes in realtime
    const mysterySub = supabase
      .channel('app_settings_events')
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

  const getCategoryName = useCallback((categoryId: string | null) => {
    if (!categoryId) return null;
    return allCategories.find(c => c.id === categoryId)?.name || categoryId;
  }, [allCategories]);

  useEffect(() => {
    let processed = [...results];

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      processed = processed.filter(r =>
        r.event_name.toLowerCase().includes(lowercasedQuery) ||
        (r.department_name || '').toLowerCase().includes(lowercasedQuery) ||
        (r.department_abbreviation || '').toLowerCase().includes(lowercasedQuery) ||
        (getCategoryName(r.category) || '').toLowerCase().includes(lowercasedQuery)
      );
    }

    if (allDepartments.length === 0 && processed.length > 0) {
      const departmentMap = new Map<string, { name: string; image_url: string | null; abbreviation: string }>();
      results.forEach(r => {
        if (r.department_name && !departmentMap.has(r.department_name)) {
          departmentMap.set(r.department_name, {
            name: r.department_name,
            image_url: r.department_image_url || null,
            abbreviation: r.department_abbreviation || "",
          });
        }
      });
      setAllDepartments(Array.from(departmentMap.values()));
    }

    setFilteredResults(processed);
  }, [results, searchQuery, allDepartments.length, getCategoryName]);

  const grouped = useMemo(() => {
    return filteredResults.reduce((acc, result) => {
      const eventCategoryName = getCategoryName(result.category);
      if (!acc[result.event_name]) {
        acc[result.event_name] = {
          icon: result.event_icon,
          category: eventCategoryName,
          division: result.division,
          gender: result.gender,
          winners: {},
        };
      }
      if (result.medal_type) {
        acc[result.event_name].winners[result.medal_type] = {
          department_id: result.department_id,
          department_name: result.department_name,
          department_abbreviation: result.department_abbreviation,
          image_url: result.department_image_url,
        };
      }
      return acc;
    }, {} as Record<string, GroupedResult>);
  }, [filteredResults, getCategoryName]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="w-10 h-10 text-monument-primary shrink-0" strokeWidth={3} />
        <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight leading-none pt-1">Event Results</h1>
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
                  New result updates available!
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Click here to refresh the winner list
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and View Controls */}
      <div className="flex flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 font-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search by event, team, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12 py-3 w-full bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm"
          />
        </div>
      </div>

      <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Object.entries(grouped).map(([eventName, data]) => {
              return (
                <div key={eventName} className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                  
                  <div className="flex items-start gap-4 p-5 pb-3">
                    <span className="text-4xl mt-1 drop-shadow-sm">{data.icon || '🏅'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 uppercase tracking-tight truncate">{eventName}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                        {data.category && (
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300 text-[9px] font-black uppercase tracking-widest leading-none">
                            {data.category}
                          </span>
                        )}
                        {data.division && data.division !== 'N/A' && (
                          <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full dark:bg-purple-900/30 dark:text-purple-300 text-[9px] font-black uppercase tracking-widest leading-none">
                            {data.division}
                          </span>
                        )}
                        {data.gender && data.gender !== 'N/A' && (
                          <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full dark:bg-pink-900/30 dark:text-pink-300 text-[9px] font-black uppercase tracking-widest leading-none">
                            {data.gender}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="space-y-3">
                      {(["gold", "silver", "bronze"] as const).map((medal) => {
                        const winner = data.winners[medal];
                        const medalIcon = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉';
                        const medalLabel = medal === 'gold' ? 'Gold' : medal === 'silver' ? 'Silver' : 'Bronze';
                        const medalColor = medal === 'gold' ? 'border-yellow-400' : medal === 'silver' ? 'border-gray-300' : 'border-orange-400';
                        
                        return (
                          <div key={medal} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{medalIcon}</span>
                              <div className="flex items-center">
                                 <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight leading-tight">{medalLabel}</span>
                              </div>
                            </div>
                            {winner && winner.department_id ? (
                              <div className="flex items-center gap-2" title={winner.department_name || ''}>
                                 <span className="font-black text-[10px] text-gray-900 dark:text-gray-200 text-right uppercase tracking-tight truncate max-w-[120px]">{winner.department_name}</span>
                                {winner.image_url ? (
                                  <Image src={winner.image_url} alt={winner.department_name || ''} width={32} height={32} className={`w-8 h-8 object-contain drop-shadow-sm group-hover:scale-110 transition-transform`} />
                                ) : (
                                  <div className={`w-8 h-8 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-[9px] font-black text-gray-400 border-2 ${medalColor}`}>
                                    {winner.department_abbreviation?.slice(0,3)}
                                  </div>
                                )}
                              </div>
                            ) : winner && !winner.department_id ? (
                              <span className="text-[10px] font-bold italic text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span>✖️</span> No Team
                              </span>
                            ) : (
                              <span className="text-[10px] font-black italic text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                                 <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" />
                                 Awaiting...
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            {Object.keys(grouped).length === 0 && (
              <div className="col-span-full text-center py-24 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">No Events Recorded</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Check back soon for the core competition events!</p>
              </div>
            )}
          </motion.div>
      <Toaster />
    </div>
  );
}