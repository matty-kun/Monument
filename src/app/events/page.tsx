"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Image from "next/image";

interface EventResult {
  event_id: string;
  event_name: string;
  category: string | null;
  department_id: string;
  department_name: string;
  medal_type: "gold" | "silver" | "bronze";
  points: number;
}

export default function EventsPage() {
  const [results, setResults] = useState<EventResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<EventResult[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [departmentData, setDepartmentData] = useState<{[key: string]: {name: string, image_url?: string}}>({});
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [medalFilter, setMedalFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  useEffect(() => {
    fetchResults();
    fetchDepartmentData();

    const channel = supabase
      .channel("events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => {
        fetchResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchResults() {
    const { data, error } = await supabase.rpc("get_event_results");
    if (error) {
      console.error("Error fetching event results:", error);
    } else {
      console.log("Event results data:", data);
      setResults(data);
      setFilteredResults(data);
      
      const categories = [...new Set(data.map((result: EventResult) => result.category).filter(Boolean))] as string[];
      const departments = [...new Set(data.map((result: EventResult) => result.department_name))] as string[];
      setAllCategories(categories);
      setAllDepartments(departments);
    }
  }

  async function fetchDepartmentData() {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, image_url");

    if (!error && data) {
      console.log("Department data from DB:", data); // Debug log
      const deptMap: {[key: string]: {name: string, image_url?: string}} = {};
      data.forEach(dept => {
        deptMap[dept.id] = { name: dept.name, image_url: dept.image_url };
      });
      console.log("Department map created:", deptMap); // Debug log
      setDepartmentData(deptMap);
    } else {
      console.error("Error fetching departments:", error);
    }
  }

  useEffect(() => {
    let filtered = [...results];

    if (categoryFilter !== "all") {
      filtered = filtered.filter(result => result.category === categoryFilter);
    }

    if (medalFilter !== "all") {
      filtered = filtered.filter(result => result.medal_type === medalFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(result => result.department_name === departmentFilter);
    }

    setFilteredResults(filtered);
  }, [results, categoryFilter, medalFilter, departmentFilter]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setMedalFilter("all");
    setDepartmentFilter("all");
  };

  const grouped = filteredResults.reduce((acc, row) => {
    if (!acc[row.event_id]) acc[row.event_id] = { event_name: row.event_name, winners: {} };
    acc[row.event_id].winners[row.medal_type] = {
      department_name: row.department_name,
      department_id: row.department_id
    };
    return acc;
  }, {} as Record<string, { event_name: string; winners: Record<string, { department_name: string; department_id: string }> }>);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2">🏟️ Event Results</h1>
        <p className="text-gray-600">Competition results and winners by event</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medal Type</label>
                <select
                  value={medalFilter}
                  onChange={(e) => setMedalFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="all">All Medals</option>
                  <option value="gold">🥇 Gold</option>
                  <option value="silver">🥈 Silver</option>
                  <option value="bronze">🥉 Bronze</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="all">All Departments</option>
                  {allDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
              📊 Showing {Object.keys(grouped).length} events with {filteredResults.length} results
            </div>
          </div>
        )}
      </div>
      
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left font-semibold">Event</th>
                <th className="table-cell text-center font-semibold">🥇 Gold</th>
                <th className="table-cell text-center font-semibold">🥈 Silver</th>
                <th className="table-cell text-center font-semibold">🥉 Bronze</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([eventId, { event_name, winners }]) => (
                <tr key={eventId} className="table-row animate-fadeIn">
                  <td className="table-cell">
                    <span className="font-semibold text-gray-900">{event_name}</span>
                  </td>
                  <td className="table-cell text-center">
                    {winners.gold ? (
                      <div className="flex items-center justify-center gap-2" title={winners.gold.department_name}>
                        {departmentData[winners.gold.department_id]?.image_url ? (
                          <Image
                            src={departmentData[winners.gold.department_id].image_url!}
                            alt={winners.gold.department_name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-cover rounded-full shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                            {winners.gold.department_name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="hidden md:inline text-sm text-gray-700">
                          {winners.gold.department_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    {winners.silver ? (
                      <div className="flex items-center justify-center gap-2" title={winners.silver.department_name}>
                        {departmentData[winners.silver.department_id]?.image_url ? (
                          <Image
                            src={departmentData[winners.silver.department_id].image_url!}
                            alt={winners.silver.department_name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-cover rounded-full shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                            {winners.silver.department_name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="hidden md:inline text-sm text-gray-700">
                          {winners.silver.department_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    {winners.bronze ? (
                      <div className="flex items-center justify-center gap-2" title={winners.bronze.department_name}>
                        {departmentData[winners.bronze.department_id]?.image_url ? (
                          <Image
                            src={departmentData[winners.bronze.department_id].image_url!}
                            alt={winners.bronze.department_name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-cover rounded-full shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                            {winners.bronze.department_name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="hidden md:inline text-sm text-gray-700">
                          {winners.bronze.department_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {Object.keys(grouped).length === 0 && (
                <tr>
                  <td colSpan={4} className="table-cell text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">🏟️</div>
                      <p>{results.length === 0 
                        ? "No event results yet. Check back soon!" 
                        : "No events match the current filters. Try adjusting your filter criteria."}</p>
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