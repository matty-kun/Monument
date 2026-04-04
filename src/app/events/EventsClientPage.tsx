"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaTable, FaThLarge } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";

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
}

export default function EventsClientPage({ initialResults, initialCategories }: EventsClientPageProps) {
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
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
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

    return () => {
      supabase.removeChannel(channel);
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

  const clearAll = () => {
    setSearchQuery("");
  };

  const medalOptions = [
    { id: 'all', name: 'All Medals' },
    { id: 'gold', name: '🥇 Gold' },
    { id: 'silver', name: '🥈 Silver' },
    { id: 'bronze', name: '🥉 Bronze' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-monument-primary mb-2">🏟️ Event Results</h1>
        <p className="text-gray-600 dark:text-gray-400">Competition results and winners by event</p>
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
              className="flex w-full md:w-auto items-center gap-3 bg-white dark:bg-gray-800 shadow-xl leading-tight rounded-xl pl-4 pr-5 py-3 border border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-700 active:scale-[0.98] transition-all text-left outline-none cursor-pointer group pointer-events-auto"
            >
              <div className="flex bg-yellow-100 text-yellow-600 dark:text-yellow-400 dark:bg-yellow-900/40 w-10 h-10 rounded-full items-center justify-center text-xl shrink-0 group-hover:rotate-12 transition-transform">
                ⭐
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                  New result updates available!
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                  Click here to refresh the page
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and View Controls */}
      <div className="flex flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search by event, department, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-700 self-center">
          <button onClick={() => setViewMode('card')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'card' ? 'bg-white text-monument-primary shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600/50'}`}>
            <FaThLarge />
            Cards
          </button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-monument-primary shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600/50'}`}>
            <FaTable />
            Table
          </button>
        </div>
      </div>



      <AnimatePresence mode="wait">
        {viewMode === 'card' ? (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Object.entries(grouped).map(([eventName, data]) => {
              return (
                <div key={eventName} className="card animate-fadeIn p-4 flex flex-col">
                  <div className="flex items-start gap-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-3xl mt-1">{data.icon || '🏅'}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{eventName}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-2">
                        {data.category && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                            {getCategoryName(data.category)}
                          </span>
                        )}
                        {data.division && data.division !== 'N/A' && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900/50 dark:text-purple-300">
                            {data.division}
                          </span>
                        )}
                        {data.gender && data.gender !== 'N/A' && (
                          <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full dark:bg-pink-900/50 dark:text-pink-300">
                            {data.gender}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4">
                    {(["gold", "silver", "bronze"] as const).map((medal) => {
                      const winner = data.winners[medal];
                      const medalIcon = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉';
                      const medalColor = medal === 'gold' ? 'border-yellow-400' : medal === 'silver' ? 'border-gray-400' : 'border-orange-400';
                      return (
                        <div key={medal} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{medalIcon}</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{medal}</span>
                          </div>
                          {winner && winner.department_id ? (
                            <div className="flex items-center gap-2" title={winner.department_name || ''}>
                               <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 text-right truncate max-w-[150px]">{winner.department_name}</span>
                              {winner.image_url ? (
                                <Image src={winner.image_url} alt={getInitials(winner.department_name || '')} width={32} height={32} className={`w-8 h-8 object-cover rounded-full border-2 ${medalColor}`} />
                              ) : (
                                <div className={`w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300 border-2 ${medalColor}`}>
                                  {getInitials(winner.department_name || '')}
                                </div>
                              )}
                            </div>
                          ) : winner && !winner.department_id ? (
                            <span className="text-sm font-bold italic text-gray-400 dark:text-gray-500">
                              No Team
                            </span>
                          ) : (
                            <span className="text-[10px] font-black italic text-violet-400 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                               <div className="w-1 h-1 bg-violet-400 rounded-full animate-pulse" />
                               Awaiting...
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {Object.keys(grouped).length === 0 && (
              <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-6xl mb-4">🏟️</div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">{searchQuery ? "No Results Match Your Search" : (results.length === 0 ? "No Event Results Yet" : "No Events Found")}</h3>
<p className="text-sm text-gray-500 dark:text-gray-400">{searchQuery ? "Try a different search term." : (results.length === 0 ? "Check back soon for the latest winners!" : "Events will be listed once results are available.")}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="table-container"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 dark:text-gray-300 rounded-lg shadow-md overflow-hidden">
                <thead className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">🥇 Gold</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">🥈 Silver</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">🥉 Bronze</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(grouped).map(([eventName, data]) => (
                    <tr key={eventName} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{data.icon || '🏅'}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{eventName}</span>
                          <div className="flex flex-wrap items-center gap-1 text-xs ml-2">
                            {data.category && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                                {getCategoryName(data.category)}
                              </span>
                            )}
                            {data.division && data.division !== 'N/A' && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900/50 dark:text-purple-300">
                                {data.division}
                              </span>
                            )}
                            {data.gender && data.gender !== 'N/A' && (
                              <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full dark:bg-pink-900/50 dark:text-pink-300">
                                {data.gender}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {(["gold", "silver", "bronze"] as const).map((medal) => {
                        const winner = data.winners[medal];
                        const medalColor = medal === 'gold' ? 'border-yellow-400' : medal === 'silver' ? 'border-gray-400' : 'border-orange-400';
                        const isNoParticipant = winner?.department_name === "No Team";

                        return (
                          <td key={medal} className="px-4 py-3 whitespace-nowrap text-center">
                            {winner && winner.department_id && !isNoParticipant ? (
                              <div className="flex items-center justify-center gap-2" title={winner.department_name || ''}>
                                {winner.image_url ? (
                                  <Image src={winner.image_url} alt={getInitials(winner.department_name || '')} width={40} height={40} className={`w-10 h-10 object-cover rounded-full border-2 ${medalColor} shadow-sm`} />
                                ) : (
                                  <div className={`w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm dark:text-gray-300 border-2 ${medalColor}`}>
                                    {getInitials(winner.department_name || '')}
                                  </div>
                                )}
                                <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                  {winner.department_name}
                                </span>
                              </div>
                            ) : winner && (winner.department_name === "No Team" || !winner.department_id) ? (
                               <span className="text-sm font-bold italic text-gray-400 dark:text-gray-500">No Team</span>
                            ) : (
                              <span className="text-[10px] font-black italic text-violet-400 dark:text-violet-400 uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-80">
                                 <div className="w-1 h-1 bg-violet-400 rounded-full animate-pulse" />
                                 Awaiting...
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {Object.keys(grouped).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-2">🏟️</div>
                          <p>{searchQuery ? "No results match your search." : (results.length === 0 ? "No event results yet. Check back soon!" : "No events match the current filters. Try adjusting your filter criteria.")}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </div>
  );
}