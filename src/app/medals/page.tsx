"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { calculateTotalPoints } from "@/utils/scoring";

interface Tally {
  department_id: string;
  department_name: string;
  department_abbreviation: string;
  image_url?: string;
  gold: number;
  silver: number;
  bronze: number;
  total_points: number;
}
export default function MedalTallyPage() {
  const [tally, setTally] = useState<Tally[]>([]);
  const [filteredTally, setFilteredTally] = useState<Tally[]>([]);
  const [allDepartments, setAllDepartments] = useState<{id: string, name: string}[]>([]);
  
  // Filter states
  const [medalFilter, setMedalFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [pointsMinFilter, setPointsMinFilter] = useState<string>("");
  const [pointsMaxFilter, setPointsMaxFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("points");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const supabase = createClient();

  const fetchTally = useCallback(async () => {
    const { data: departmentsData, error: departmentsError } = await supabase
      .from("departments")
      .select("id, name, image_url, abbreviation");

    if (departmentsError) {
      console.error("Error fetching departments:", departmentsError);
      return;
    }

    const { data: resultsData, error: resultsError } = await supabase
      .from("results")
      .select("department_id, medal_type");

    if (resultsError) {
      console.error("Error fetching results:", resultsError);
      return;
    }

    const departmentMap = new Map<string, Tally>();
    departmentsData.forEach(dept => {
      departmentMap.set(dept.id, {
        department_id: dept.id,
        department_name: dept.name,
        department_abbreviation: dept.abbreviation || dept.name.substring(0, 3).toUpperCase(),
        image_url: dept.image_url || undefined,
        gold: 0,
        silver: 0,
        bronze: 0,
        total_points: 0,
      });
    });

    resultsData.forEach(result => {
      const dept = departmentMap.get(result.department_id);
      if (dept) {
        if (result.medal_type === "gold") dept.gold++;
        else if (result.medal_type === "silver") dept.silver++;
        else if (result.medal_type === "bronze") dept.bronze++;
      }
    });

    const calculatedTally: Tally[] = Array.from(departmentMap.values()).map(dept => ({
      ...dept,
      total_points: calculateTotalPoints(dept.gold, dept.silver, dept.bronze),
    }));

    calculatedTally.sort((a, b) => b.total_points - a.total_points);

    setTally(calculatedTally);
    setFilteredTally(calculatedTally);
    
    // Set departments for filter
    setAllDepartments(departmentsData.map(dept => ({ id: dept.id, name: dept.name })));
  }, [supabase]);

  useEffect(() => {
    fetchTally();

    const channel = supabase
      .channel("medals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => {
        fetchTally();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTally, supabase]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...tally];

    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter(item => item.department_id === departmentFilter);
    }

    // Filter by medal type
    if (medalFilter !== "all") {
      if (medalFilter === "gold") {
        filtered = filtered.filter(item => item.gold > 0);
      } else if (medalFilter === "silver") {
        filtered = filtered.filter(item => item.silver > 0);
      } else if (medalFilter === "bronze") {
        filtered = filtered.filter(item => item.bronze > 0);
      }
    }

    // Filter by points range
    if (pointsMinFilter) {
      filtered = filtered.filter(item => item.total_points >= parseInt(pointsMinFilter));
    }
    if (pointsMaxFilter) {
      filtered = filtered.filter(item => item.total_points <= parseInt(pointsMaxFilter));
    }

    // Sort
    if (sortBy === "points") {
      filtered.sort((a, b) => b.total_points - a.total_points);
    } else if (sortBy === "gold") {
      filtered.sort((a, b) => b.gold - a.gold);
    } else if (sortBy === "silver") {
      filtered.sort((a, b) => b.silver - a.silver);
    } else if (sortBy === "bronze") {
      filtered.sort((a, b) => b.bronze - a.bronze);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.department_name.localeCompare(b.department_name));
    }

    setFilteredTally(filtered);
  }, [tally, medalFilter, departmentFilter, pointsMinFilter, pointsMaxFilter, sortBy]);

  const clearFilters = () => {
    setMedalFilter("all");
    setDepartmentFilter("all");
    setPointsMinFilter("");
    setPointsMaxFilter("");
    setSortBy("points");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2">🏆 Medal Tally</h1>
        <p className="text-gray-600">Overall department rankings and medal counts</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            </div>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200"
            >
              Clear All
            </button>
          </div>
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
          >
            <span className="text-xs">
              {isFiltersOpen ? '▼' : '▶'}
            </span>
            {isFiltersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {isFiltersOpen && (
          <div className="p-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Medal Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medal Type</label>
            <select
              value={medalFilter}
              onChange={(e) => setMedalFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All Medals</option>
              <option value="gold">🥇 Gold Only</option>
              <option value="silver">🥈 Silver Only</option>
              <option value="bronze">🥉 Bronze Only</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All Departments</option>
              {allDepartments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
            <input
              type="number"
              placeholder="0"
              value={pointsMinFilter}
              onChange={(e) => setPointsMinFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
            <input
              type="number"
              placeholder="∞"
              value={pointsMaxFilter}
              onChange={(e) => setPointsMaxFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
              min="0"
            />
          </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
              📊 Showing {filteredTally.length} of {tally.length} departments
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr><th className="table-cell text-left font-semibold">Rank</th><th className="table-cell text-left font-semibold">Department</th><th className="table-cell text-center font-semibold">🥇 Gold</th><th className="table-cell text-center font-semibold">🥈 Silver</th><th className="table-cell text-center font-semibold">🥉 Bronze</th><th className="table-cell text-center font-semibold">Total Points</th></tr>
            </thead>
            <tbody>
              {filteredTally.map((row, idx) => (
                <tr key={row.department_id} className="table-row animate-fadeIn">
                  <td className="table-cell font-bold">{idx + 1}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3" title={row.department_name}>
                      {row.image_url ? (
                        <Image
                          src={row.image_url}
                          alt={row.department_name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded-full shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shadow-sm text-sm font-bold text-gray-600">
                          {row.department_abbreviation}
                        </div>
                      )}
                      <span className="font-semibold text-gray-800">{row.department_abbreviation}</span>
                    </div>
                  </td>
                  <td className="table-cell text-center text-yellow-500 font-bold">{row.gold}</td>
                  <td className="table-cell text-center text-gray-400">{row.silver}</td>
                  <td className="table-cell text-center text-orange-400">{row.bronze}</td>
                  <td className="table-cell text-center font-extrabold">{row.total_points.toFixed(2)}</td>
                </tr>
              ))}
              {filteredTally.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <p>{tally.length === 0 
                        ? "No medal tally yet. Check back soon!" 
                        : "No departments match the current filters. Try adjusting your filter criteria."}</p>
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