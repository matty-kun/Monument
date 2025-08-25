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
      <h1 className="text-2xl font-bold mb-6">Medal Tally</h1>
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-yellow-600 text-white">
            <tr>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">🥇 Gold</th>
              <th className="px-4 py-2">🥈 Silver</th>
              <th className="px-4 py-2">🥉 Bronze</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b">
                <td className="px-4 py-2">{dept.name}</td>
                <td className="px-4 py-2 text-center font-semibold text-yellow-600">
                  {dept.golds}
                </td>
                <td className="px-4 py-2 text-center font-semibold text-gray-500">
                  {dept.silvers}
                </td>
                <td className="px-4 py-2 text-center font-semibold text-orange-600">
                  {dept.bronzes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
