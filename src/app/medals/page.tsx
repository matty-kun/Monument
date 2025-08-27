"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Tally {
  department_id: string;
  department_name: string;
  gold: number;
  silver: number;
  bronze: number;
  total_points: number;
}

export default function MedalTallyPage() {
  const [tally, setTally] = useState<Tally[]>([]);

  useEffect(() => {
    fetchTally();

    // Refresh every 30s for real-time updates
    const interval = setInterval(fetchTally, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTally() {
    const { data, error } = await supabase.rpc("get_medal_tally");
    if (error) console.error(error);
    if (data) setTally(data);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-10 text-yellow-400">
        🏆 SIDLAK 2025 Medal Tally
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-3">Rank</th>
              <th className="p-3">Department</th>
              <th className="p-3 text-yellow-400">🥇 Gold</th>
              <th className="p-3 text-gray-300">🥈 Silver</th>
              <th className="p-3 text-orange-400">🥉 Bronze</th>
              <th className="p-3">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {tally.map((row, idx) => (
              <tr
                key={row.department_id}
                className={`border-t ${
                  idx === 0 ? "bg-yellow-900/40" : ""
                }`}
              >
                <td className="p-3 font-bold">{idx + 1}</td>
                <td className="p-3 font-semibold">{row.department_name}</td>
                <td className="p-3 text-yellow-300 font-bold">{row.gold}</td>
                <td className="p-3 text-gray-300">{row.silver}</td>
                <td className="p-3 text-orange-400">{row.bronze}</td>
                <td className="p-3 font-extrabold">{row.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-gray-400 mt-6 text-sm">
        Auto-refreshes every 30 seconds • Powered by Supabase ⚡
      </p>
    </div>
  );
}
