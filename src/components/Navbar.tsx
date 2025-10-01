"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Logo from "../assets/monument-logo.png";

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <Link href="/" className="flex items-center text-2xl font-bold text-monument-green hover:text-green-700 transition-colors no-underline">
            <Image 
              src={Logo} 
              alt="Monument Logo" 
              width={50} 
              className="mr-2"
              priority
            />
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold">Monument</span>
              <span className="text-sm text-gray-500 font-normal">| This is your moment</span>
            </div>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-1">
          <Link href="/medals" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-monument-green transition-all">
            🏅 Medals
          </Link>
          <Link href="/events" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-monument-green transition-all">
            🏟️ Events
          </Link>
          <Link href="/schedule" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-monument-green transition-all">
            🗓️ Schedule
          </Link>
          {role === "admin" && (
            <Link href="/admin/dashboard" className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-monument-green hover:bg-green-700 transition-all shadow-sm">
              📊 Dashboard
            </Link>
          )}
        </div>
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-monument-green focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/medals" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-monument-green hover:bg-gray-50">🏅 Medals</Link>
            <Link href="/events" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-monument-green hover:bg-gray-50">🏟️ Events</Link>
            <Link href="/schedule" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-monument-green hover:bg-gray-50">🗓️ Schedule</Link>
            {role === "admin" && (
              <Link href="/admin/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-monument-green hover:bg-green-700">📊 Dashboard</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}