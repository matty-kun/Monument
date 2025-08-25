"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface EventResult {
  event_id: string;
  event_name: string;
  category: string | null;
  department_name: string;
  medal_type: "gold" | "silver" | "bronze";
  points: number;
}

export default function EventsPage() {
  const [results, setResults] = useState<EventResult[]>([]);

  useEffect(() => {
    fetchResults();

    // Realtime update on results change
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
    if (error) console.error(error);
    else setResults(data);
  }

  // Group results by event_name for display
  const grouped = results.reduce((acc, row) => {
    if (!acc[row.event_name]) acc[row.event_name] = {};
    acc[row.event_name][row.medal_type] = row.department_name;
    return acc;
  }, {} as Record<string, Record<string, string>>);

  return (
    <div>
      <h1>Event Results</h1>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-ndmc-green text-white">
              <tr>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-center">🥇 Gold</th>
                <th className="px-4 py-3 text-center">🥈 Silver</th>
                <th className="px-4 py-3 text-center">🥉 Bronze</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([eventName, winners]) => (
                <tr key={eventName} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{eventName}</td>
                  <td className="px-4 py-2 text-center font-semibold text-yellow-500">
                    {winners.gold || "-"}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-gray-400">
                    {winners.silver || "-"}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-orange-500">
                    {winners.bronze || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
