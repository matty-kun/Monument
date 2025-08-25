"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    getRole();
  }, []);

  async function getRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile) setRole(profile.role);
    }
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-ndmc-green hover:text-green-700 transition-colors">
            🏆 SIDLAK
          </Link>
          <span className="ml-2 text-sm text-gray-500 hidden sm:inline">Intramurals</span>
        </div>
        <div className="flex items-center space-x-1">
          <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ndmc-green transition-all">
            📊 Leaderboard
          </Link>
          <Link href="/medals" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ndmc-green transition-all">
            🏅 Medals
          </Link>
          <Link href="/events" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ndmc-green transition-all">
            📅 Events
          </Link>
          <Link href="/scoreboard" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ndmc-green transition-all">
            📺 Live
          </Link>
          {role === "admin" && (
            <Link href="/admin/dashboard" className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-ndmc-green hover:bg-green-700 transition-all shadow-sm">
              ⚙️ Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
