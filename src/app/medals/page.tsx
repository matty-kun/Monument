"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface MedalTally {
  id: string;
  name: string;
  golds: number;
  silvers: number;
  bronzes: number;
}

export default function MedalTallyPage() {
  const [departments, setDepartments] = useState<MedalTally[]>([]);

  useEffect(() => {
    fetchTally();

    // Realtime update on results change
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
    else setDepartments(data);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-ndmc-green mb-2">🏅 Medal Tally</h1>
        <p className="text-gray-600">Department medal counts and achievements</p>
      </div>
      
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <tr>
              <th className="table-cell text-left font-semibold">Department</th>
              <th className="table-cell text-center font-semibold">🥇 Gold</th>
              <th className="table-cell text-center font-semibold">🥈 Silver</th>
              <th className="table-cell text-center font-semibold">🥉 Bronze</th>
              <th className="table-cell text-center font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="table-row animate-fadeIn">
                <td className="table-cell">
                  <span className="font-semibold text-gray-900">{dept.name}</span>
                </td>
                <td className="table-cell text-center">
                  <div className="flex items-center justify-center">
                    <span className="badge badge-gold text-lg font-bold px-3 py-1">
                      {dept.golds}
                    </span>
                  </div>
                </td>
                <td className="table-cell text-center">
                  <div className="flex items-center justify-center">
                    <span className="badge badge-silver text-lg font-bold px-3 py-1">
                      {dept.silvers}
                    </span>
                  </div>
                </td>
                <td className="table-cell text-center">
                  <div className="flex items-center justify-center">
                    <span className="badge badge-bronze text-lg font-bold px-3 py-1">
                      {dept.bronzes}
                    </span>
                  </div>
                </td>
                <td className="table-cell text-center">
                  <span className="text-xl font-bold text-ndmc-green">
                    {dept.golds + dept.silvers + dept.bronzes}
                  </span>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={5} className="table-cell text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-2">🏅</div>
                    <p>No medals awarded yet. Check back soon!</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
