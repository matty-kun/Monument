"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Department {
  id: string;
  name: string;
  logo_url: string | null;
  total_points: number;
}

export default function LeaderboardPage() {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("results-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLeaderboard() {
    const { data, error } = await supabase.rpc("get_leaderboard"); 
    if (error) console.error(error);
    else setDepartments(data);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-ndmc-green mb-2">🏆 Leaderboard</h1>
        <p className="text-gray-600">Real-time department rankings and scores</p>
      </div>
      
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left font-semibold">Rank</th>
                <th className="table-cell text-left font-semibold">Department</th>
                <th className="table-cell text-center font-semibold">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <tr key={dept.id} className="table-row animate-fadeIn">
                  <td className="table-cell">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                    {dept.logo_url && (
                      <img src={dept.logo_url} alt={dept.name} className="w-10 h-10 rounded-full border-2 border-gray-200" />
                    )}
                    <span className="font-semibold text-gray-900">{dept.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <span className="text-2xl font-bold text-ndmc-green">{dept.total_points}</span>
                    <span className="text-sm text-gray-500 ml-1">pts</span>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={3} className="table-cell text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p>No results yet. Check back soon!</p>
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
