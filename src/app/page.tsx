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
      <h1>Leaderboard</h1>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-ndmc-green text-white">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-center">Points</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <tr key={dept.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-center font-semibold">{index + 1}</td>
                  <td className="px-4 py-2 flex items-center gap-3">
                    {dept.logo_url && (
                      <img src={dept.logo_url} alt={dept.name} className="w-8 h-8 rounded-full" />
                    )}
                    <span className="font-medium">{dept.name}</span>
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-lg text-ndmc-green">{dept.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
