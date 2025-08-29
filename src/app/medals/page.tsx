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

    const channel = supabase
      .channel("medals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => {
        fetchTally();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTally() {
    const { data, error } = await supabase.rpc("get_medal_tally");
    if (error) console.error(error);
    if (data) setTally(data);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-ndmc-green mb-2">🏆 Medal Tally</h1>
        <p className="text-gray-600">Overall department rankings and medal counts</p>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left font-semibold">Rank</th>
                <th className="table-cell text-left font-semibold">Department</th>
                <th className="table-cell text-center font-semibold">🥇 Gold</th>
                <th className="table-cell text-center font-semibold">🥈 Silver</th>
                <th className="table-cell text-center font-semibold">🥉 Bronze</th>
                <th className="table-cell text-center font-semibold">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {tally.map((row, idx) => (
                <tr key={row.department_id} className="table-row animate-fadeIn">
                  <td className="table-cell font-bold">{idx + 1}</td>
                  <td className="table-cell font-semibold">{row.department_name}</td>
                  <td className="table-cell text-center text-yellow-500 font-bold">{row.gold}</td>
                  <td className="table-cell text-center text-gray-400">{row.silver}</td>
                  <td className="table-cell text-center text-orange-400">{row.bronze}</td>
                  <td className="table-cell text-center font-extrabold">{row.total_points}</td>
                </tr>
              ))}
              {tally.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <p>No medal tally yet. Check back soon!</p>
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
