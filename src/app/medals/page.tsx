"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { calculateTotalPoints } from "@/utils/scoring";

interface LeaderboardRow {
  id: string;
  name: string;
  image_url?: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

export default function MedalsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardRow[]>([]);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  
  // Filter states
  const [medalFilter, setMedalFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [pointsMinFilter, setPointsMinFilter] = useState<string>("");
  const [pointsMaxFilter, setPointsMaxFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("points");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const supabase = createClient();

  const fetchLeaderboard = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_leaderboard");
    if (!error && data) {
      const calculated = (data as Omit<LeaderboardRow, 'total_points'>[]).map((row) => ({
        ...row,
        total_points: calculateTotalPoints(row.golds, row.silvers, row.bronzes),
      }));
      setLeaderboard(calculated);
      setAllDepartments([...new Set(calculated.map((dept: LeaderboardRow) => dept.name))]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase
      .channel("results-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, fetchLeaderboard)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard, supabase]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...leaderboard];

    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter((dept) => dept.name === departmentFilter);
    }

    // Filter by medal type
    if (medalFilter !== "all") {
      const medalKey = `${medalFilter}s` as "golds" | "silvers" | "bronzes";
      filtered = filtered.filter((dept) => dept[medalKey] > 0);
    }

    // Filter by points range
    if (pointsMinFilter) {
      filtered = filtered.filter((dept) => dept.total_points >= parseFloat(pointsMinFilter));
    }
    if (pointsMaxFilter) {
      filtered = filtered.filter((dept) => dept.total_points <= parseFloat(pointsMaxFilter));
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "points") return b.total_points - a.total_points;
      if (sortBy === "gold") return b.golds - a.golds;
      if (sortBy === "silver") return b.silvers - a.silvers;
      if (sortBy === "bronze") return b.bronzes - a.bronzes;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    setFilteredLeaderboard(sorted);
  }, [leaderboard, medalFilter, departmentFilter, pointsMinFilter, pointsMaxFilter, sortBy]);

  const clearFilters = () => {
    setMedalFilter("all");
    setDepartmentFilter("all");
    setPointsMinFilter("");
    setPointsMaxFilter("");
    setSortBy("points");
  };

  // Check if there are any medals at all (not just scores > 0)
  const hasMedals = leaderboard.some(dept => dept.golds > 0 || dept.silvers > 0 || dept.bronzes > 0);

  return (
    <div className="dark:text-gray-200">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">🏆 Medal Tally</h1>
        <p className="text-gray-600 dark:text-gray-400">Overall department rankings and medal counts</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/50">
                <span className="text-blue-600 text-sm dark:text-blue-300">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filters</h3>
            </div>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
            >
              Clear All
            </button>
          </div>
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <span className="text-xs dark:text-gray-400">
              {isFiltersOpen ? '▼' : '▶'}
            </span>
            {isFiltersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {isFiltersOpen && (
          <div className="p-4 animate-fadeIn dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Medal Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Medal Type</label>
                <select
                  value={medalFilter}
                  onChange={(e) => setMedalFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option value="all">All Medals</option>
                  <option value="gold">🥇 Gold Only</option>
                  <option value="silver">🥈 Silver Only</option>
                  <option value="bronze">🥉 Bronze Only</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option value="all">All Departments</option>
                  {allDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option value="points">Total Points</option>
                  <option value="gold">Gold Medals</option>
                  <option value="silver">Silver Medals</option>
                  <option value="bronze">Bronze Medals</option>
                  <option value="name">Department Name</option>
                </select>
              </div>

              {/* Points Range Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Min Points</label>
                <input
                  type="number"
                  placeholder="0"
                  value={pointsMinFilter}
                  onChange={(e) => setPointsMinFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Max Points</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={pointsMaxFilter}
                  onChange={(e) => setPointsMaxFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  min="0"
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md dark:bg-gray-700 dark:text-gray-400">
              📊 Showing {filteredLeaderboard.length} of {leaderboard.length} departments
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header dark:bg-gray-700 dark:border-gray-600">
              <tr>
                <th className="table-cell text-left font-semibold">Rank</th>
                <th className="table-cell text-left font-semibold">Department</th>
                <th className="table-cell text-center font-semibold">🥇 Gold</th>
                <th className="table-cell text-center font-semibold">🥈 Silver</th>
                <th className="table-cell text-center font-semibold">🥉 Bronze</th>
                <th className="table-cell text-center font-semibold">Total Points</th>
              </tr>
            </thead>
            <tbody className="dark:bg-gray-800 dark:border-gray-700">
              {hasMedals && filteredLeaderboard.length > 0 ? (
                filteredLeaderboard.map((dept, index) => (
                  <tr key={dept.id} className="table-row animate-fadeIn">
                    <td className="table-cell font-bold text-center">#{index + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {dept.image_url ? (
                          <Image
                            src={dept.image_url}
                            alt={dept.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300">
                            {dept.name.substring(0, 3)}
                          </div>
                        )}
                        <span className="font-semibold">{dept.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-center">{dept.golds}</td>
                    <td className="table-cell text-center">{dept.silvers}</td>
                    <td className="table-cell text-center">{dept.bronzes}</td>
                    <td className="table-cell text-center font-bold text-monument-green dark:text-green-400">{dept.total_points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">🏅</div>
                      <p>{!hasMedals ? "No medal results yet. Check back soon!" : "No departments match the current filters. Try adjusting your filter criteria."}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}