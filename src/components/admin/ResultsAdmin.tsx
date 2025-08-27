"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Tally {
  department_id: string;
  department_name: string;
  gold: number;
  silver: number;
  bronze: number;
  total_points: number;
}

export function ResultsAdmin() {
  const [tally, setTally] = useState<Tally[]>([]);

  useEffect(() => {
    fetchTally();
  }, []);

  async function fetchTally() {
    const { data, error } = await supabase.rpc("get_medal_tally");
    if (error) console.error(error);
    if (data) setTally(data);
  }

  async function resetResults() {
    if (!confirm("Are you sure you want to reset ALL results?")) return;
    await supabase.from("results").delete().neq("id", ""); // delete all
    fetchTally();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Medal Tally</h2>

      <table className="w-full text-left border">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Department</th>
            <th className="p-2">🥇 Gold</th>
            <th className="p-2">🥈 Silver</th>
            <th className="p-2">🥉 Bronze</th>
            <th className="p-2">Total Points</th>
          </tr>
        </thead>
        <tbody>
          {tally.map((row) => (
            <tr key={row.department_id} className="border-t">
              <td className="p-2 font-semibold">{row.department_name}</td>
              <td className="p-2 text-yellow-600 font-bold">{row.gold}</td>
              <td className="p-2 text-gray-600">{row.silver}</td>
              <td className="p-2 text-orange-700">{row.bronze}</td>
              <td className="p-2 font-bold">{row.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <Button variant="destructive" onClick={resetResults}>
          Reset All Results
        </Button>
      </div>
    </div>
  );
}
