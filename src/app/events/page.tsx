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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-ndmc-green mb-2">📅 Event Results</h1>
        <p className="text-gray-600">Competition results and winners by event</p>
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
              {Object.entries(grouped).map(([eventName, winners]) => (
                <tr key={eventName} className="table-row animate-fadeIn">
                  <td className="table-cell">
                    <span className="font-semibold text-gray-900">{eventName}</span>
                  </td>
                  <td className="table-cell text-center">
                    {winners.gold ? (
                      <span className="badge badge-gold font-semibold px-3 py-1">
                        {winners.gold}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    {winners.silver ? (
                      <span className="badge badge-silver font-semibold px-3 py-1">
                        {winners.silver}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    {winners.bronze ? (
                      <span className="badge badge-bronze font-semibold px-3 py-1">
                        {winners.bronze}
                      </span>
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
                      <div className="text-4xl mb-2">📅</div>
                      <p>No event results yet. Check back soon!</p>
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
