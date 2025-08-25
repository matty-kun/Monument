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
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-semibold text-ndmc-green">
            SIDLAK
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Leaderboard</Link>
          <Link href="/medals" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Medals</Link>
          <Link href="/events" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Events</Link>
          {role === "admin" && <Link href="/admin/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-ndmc-green hover:bg-opacity-90">Admin</Link>}
        </div>
      </div>
    </nav>
  );
}
