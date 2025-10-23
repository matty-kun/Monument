"use client";

import { useEffect, useState, useMemo, useCallback, Fragment } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import { motion, AnimatePresence } from "framer-motion";
import SingleSelectDropdown from "@/components/SingleSelectDropdown";
import { FaTable, FaThLarge } from "react-icons/fa"; // Icons for toggle

// Types
interface Result {
  id: string;
  department_id: string;
  medal_type: "gold" | "silver" | "bronze";
  events: {
    name: string;
    category: string | null;
    division: string | null;
    gender: string | null;
    icon: string | null;
  } | null;
  departments: {
    name: string;
    abbreviation: string;
    image_url: string | null;
  } | null;
}

interface ProcessedResult {
  event_name: string;
  category: string | null;
  division: string | null;
  gender: string | null;
  event_icon: string | null;
  department_id: string;
  department_name: string;
  department_abbreviation: string;
  department_image_url?: string;
  medal_type: "gold" | "silver" | "bronze";
}

interface WinnerInfo {
  department_id: string;
  department_name: string;
  department_abbreviation: string;
  image_url?: string;
}

interface GroupedResult {
  icon: string | null;
  category: string | null;
  division: string | null;
  gender: string | null;
  winners: Partial<Record<"gold" | "silver" | "bronze", WinnerInfo>>;
}

const getCategoryIcon = (categoryName: string | null): string => {
  if (!categoryName) return '🏅';
  const lowerCaseName = categoryName.toLowerCase();
  if (lowerCaseName.includes('ball')) return '🏀';
  if (lowerCaseName.includes('board')) return '♟️';
  if (lowerCaseName.includes('track') || lowerCaseName.includes('field')) return '🏃';
  if (lowerCaseName.includes('vocal')) return '🎤';
  if (lowerCaseName.includes('dance')) return '💃';
  if (lowerCaseName.includes('esports')) return '🎮';
  if (lowerCaseName.includes('literary')) return '✍️';
  return '🏆'; // Default icon
};

export default function EventResultsPage() {
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ProcessedResult[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [allDepartments, setAllDepartments] = useState<{ name: string; image_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [medalFilter, setMedalFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card'); // New state for view mode

  const supabase = createClient();

  const fetchEventResults = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("results").select(`
        id,
        department_id,
        medal_type,
        events ( name, category, icon, division, gender ),
        departments ( name, abbreviation, image_url )
      `);

    if (error) {
      console.error("Error fetching event results:", error);
    } else if (data) {
      const typedData = data as unknown as Result[];
      
      const processed: ProcessedResult[] = typedData.map((r) => ({
        event_name: r.events?.name || "Unknown Event",
        category: r.events?.category || null,
        division: r.events?.division || null,
        gender: r.events?.gender || null,
        event_icon: r.events?.icon || null,
        department_id: r.department_id,
        department_name: r.departments?.name || "Unknown Dept",
        department_abbreviation: r.departments?.abbreviation || "",
        department_image_url: r.departments?.image_url || undefined,
        medal_type: r.medal_type,
      }));
      setResults(processed);
      // Fetch all categories to map UUIDs to names
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name");

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
      } else {
        setAllCategories(categoriesData?.map(c => ({ ...c, icon: getCategoryIcon(c.name) })) || []);
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchEventResults();
    const channel = supabase
      .channel("events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => {
        fetchEventResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEventResults, supabase]);

  const getCategoryName = useCallback((categoryId: string | null) => {
    if (!categoryId) return null;
    return allCategories.find(c => c.id === categoryId)?.name || categoryId;
  }, [allCategories]);

  useEffect(() => {
    let processed = [...results];
    if (categoryFilter !== "all") {
      processed = processed.filter(r => r.category === categoryFilter);
    }
    if (medalFilter !== "all") {
      processed = processed.filter(r => r.medal_type === medalFilter);
    }
    if (departmentFilter !== "all") {
      processed = processed.filter(r => r.department_name === departmentFilter);
    }
    if (allDepartments.length === 0 && processed.length > 0) {
      const departmentMap = new Map<string, { name: string; image_url: string | null; abbreviation: string }>();
      results.forEach(r => {
        if (r.department_name && !departmentMap.has(r.department_name)) {
          departmentMap.set(r.department_name, {
            name: r.department_name,
            image_url: r.department_image_url || null,
            abbreviation: r.department_abbreviation,
          });
        }
      });
      setAllDepartments(Array.from(departmentMap.values()));
    }
    setFilteredResults(processed);
  }, [results, categoryFilter, medalFilter, departmentFilter]);

  const grouped = useMemo(() => {
    return filteredResults.reduce((acc, result) => {
      if (!acc[result.event_name]) {
        acc[result.event_name] = {
          icon: result.event_icon,
          category: result.category,
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
  }, [filteredResults]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setMedalFilter("all");
    setDepartmentFilter("all");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <BouncingBallsLoader />
      </div>
    );
  }

  const medalOptions = [
    { id: 'all', name: 'All Medals' },
    { id: 'gold', name: '🥇 Gold' },
    { id: 'silver', name: '🥈 Silver' },
    { id: 'bronze', name: '🥉 Bronze' },
  ];

  return (
    <>
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">🏟️ Event Results</h1>
        <p className="text-gray-600 dark:text-gray-400">Competition results and winners by event</p>
      </div>

      {/* View Toggle Switch */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-700">
          <button onClick={() => setViewMode('card')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'card' ? 'bg-white text-monument-green shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600/50'}`}>
            <FaThLarge />
            Cards
          </button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-monument-green shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600/50'}`}>
            <FaTable />
            Table
          </button>
        </div>
      </div>

      {/* ---------- FILTERS ---------- */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center justify-center text-xl leading-none">🔍</div>
            <h3 className="font-semibold text-base md:text-lg leading-none">Filters</h3>
            <button
              onClick={clearFilters}
              className="ml-2 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
            >
              Clear
            </button>
          </div>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="text-xs md:text-sm border px-2 md:px-3 py-1 md:py-2 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {isFiltersOpen ? "Hide ▲" : "Show ▼"}
          </button>
        </div>

        {isFiltersOpen && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Category</label>
                <SingleSelectDropdown
                  options={[
                    { id: 'all', name: 'All Categories' },
                    ...allCategories.map(c => ({ id: c.name, name: c.name, icon: c.icon }))
                  ]}
                  selectedValue={categoryFilter}
                  onChange={(value) => setCategoryFilter(value)}
                  placeholder="Select Category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Medal Type</label>
                <SingleSelectDropdown
                  options={medalOptions}
                  selectedValue={medalFilter}
                  onChange={(value) => setMedalFilter(value)}
                  placeholder="Select Medal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Department</label>
                <SingleSelectDropdown
                  options={[
                    { id: 'all', name: 'All Departments' },
                    ...allDepartments.map(dept => ({ 
                      id: dept.name, 
                      name: dept.name, 
                      image_url: dept.image_url || undefined 
                    })),
                  ]}
                  selectedValue={departmentFilter}
                  onChange={(value) => setDepartmentFilter(value)}
                  placeholder="Select Department"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 mb-4 dark:text-gray-400 px-1">
        📊 Showing {Object.keys(grouped).length} events with {filteredResults.length} results
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
                          {winner ? (
                            <div className="flex items-center gap-2" title={winner.department_name}>
                              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 text-right truncate max-w-[100px]">{winner.department_abbreviation || winner.department_name}</span>
                              {winner.image_url ? (
                                <Image src={winner.image_url} alt={winner.department_name} width={32} height={32} className={`w-8 h-8 object-cover rounded-full border-2 ${medalColor}`} />
                              ) : (
                                <div className={`w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300 border-2 ${medalColor}`}>
                                  {winner.department_abbreviation || winner.department_name.substring(0, 2)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">Awaiting Result</span>
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
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">{results.length === 0 ? "No Event Results Yet" : "No Events Match Filters"}</h3>
                <p className="text-gray-500 dark:text-gray-400">{results.length === 0 ? "Check back soon for the latest winners!" : "Try adjusting your filter criteria."}</p>
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
                        return (
                          <td key={medal} className="px-4 py-3 whitespace-nowrap text-center">
                            {winner ? (
                              <div className="flex items-center justify-center gap-2" title={winner.department_name}>
                                {winner.image_url ? (
                                  <Image src={winner.image_url} alt={winner.department_name} width={40} height={40} className={`w-10 h-10 object-cover rounded-full border-2 ${medalColor} shadow-sm`} />
                                ) : (
                                  <div className={`w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm dark:text-gray-300 border-2 ${medalColor}`}>
                                    {winner.department_abbreviation || winner.department_name.substring(0, 3).toUpperCase()}
                                  </div>
                                )}
                                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                  {winner.department_abbreviation}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
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
                          <p>{results.length === 0 ? "No event results yet. Check back soon!" : "No events match the current filters. Try adjusting your filter criteria."}</p>
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
    </>
  );
}