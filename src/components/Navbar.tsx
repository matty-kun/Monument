'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    getRole();
  }, []);

  async function getRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();

    if (!error && profile) setRole(profile.role);
  }

  const navLinks = useMemo(() => [
    { href: "/", label: "🏆 Podium" },
    { href: "/medals", label: "🏅 Medals" },
    { href: "/events", label: "🏟️ Events" },
    { href: "/schedule", label: "🗓️ Schedule" },
  ], []);

  const getLinkClass = (href: string, isMobile: boolean = false) => {
    const isActive = pathname === href;
    const baseClasses = isMobile 
      ? "block px-3 py-2 rounded-md text-base font-medium" 
      : "px-4 py-2 rounded-lg text-sm font-medium transition-all";

    if (isActive) {
      return `${baseClasses} bg-monument-green/10 text-monument-green`;
    }
    return `${baseClasses} text-gray-700 hover:bg-gray-100 hover:text-monument-green`;
  };

  const closeMenu = () => setIsMenuOpen(false);


  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
        <div className="flex items-center">
          <Link href="/" className="flex items-center text-2xl font-bold text-monument-green hover:text-green-700 transition-colors no-underline">
            <Image
              src="/monument-logo.png"
              alt="Monument Logo"
              width={50}
              height={50}
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
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={getLinkClass(href)}>
              {label}
            </Link>
          ))}
          {role === "admin" && (
            <Link href="/admin/dashboard" className={`ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-monument-green hover:bg-green-700 transition-all shadow-sm ${pathname.startsWith('/admin') ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}>
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
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={getLinkClass(href, true)} onClick={closeMenu}>
                {label}
              </Link>
            ))}
            {role === "admin" && (
              <Link href="/admin/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium text-white bg-monument-green hover:bg-green-700 ${pathname.startsWith('/admin') ? 'ring-2 ring-white' : ''}`} onClick={closeMenu}>📊 Dashboard</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}