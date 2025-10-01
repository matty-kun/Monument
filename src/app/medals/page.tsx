"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { calculateTotalPoints } from "@/utils/scoring";

interface Tally {
  department_id: string;
  department_name: string;
  image_url?: string;
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
    const { data: departmentsData, error: departmentsError } = await supabase
      .from("departments")
      .select("id, name, image_url");

    if (departmentsError) {
      console.error("Error fetching departments:", departmentsError);
      return;
    }

    const { data: resultsData, error: resultsError } = await supabase
      .from("results")
      .select("department_id, medal_type");

    if (resultsError) {
      console.error("Error fetching results:", resultsError);
      return;
    }

    const departmentMap = new Map<string, Omit<Tally, "total_points" | "gold" | "silver" | "bronze">>();
    departmentsData.forEach(dept => {
      departmentMap.set(dept.id, {
        department_id: dept.id,
        department_name: dept.name,
        image_url: dept.image_url || undefined,
        gold: 0,
        silver: 0,
        bronze: 0,
      });
    });

    resultsData.forEach(result => {
      const dept = departmentMap.get(result.department_id);
      if (dept) {
        if (result.medal_type === "gold") dept.gold++;
        else if (result.medal_type === "silver") dept.silver++;
        else if (result.medal_type === "bronze") dept.bronze++;
      }
    });

    const calculatedTally: Tally[] = Array.from(departmentMap.values()).map(dept => ({
      ...dept,
      total_points: calculateTotalPoints(dept.gold, dept.silver, dept.bronze),
    }));

    calculatedTally.sort((a, b) => b.total_points - a.total_points);

    setTally(calculatedTally);
  }

  return (
    <div>
      <div className="mb-8">
  <h1 className="text-4xl font-bold text-monument-green mb-2">🏆 Medal Tally</h1>
        <p className="text-gray-600">Overall department rankings and medal counts</p>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left font-semibold">Rank</th>
                <th className="table-cell text-left font-semibold"></th> {/* For Image */}
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
                  <td className="table-cell">
                    {row.image_url ? (
                      <Image
                        src={row.image_url}
                        alt={row.department_name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded-full shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-xl">🏫</span>
                      </div>
                    )}
                  </td>
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
