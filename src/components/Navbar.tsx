'use client';

import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "./ThemeSwitcher"; 
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (!error && profile) setRole(profile.role);
      }
    };
    fetchRole();
  }, [supabase]);


  const navLinks = useMemo(() => [
    { href: "/", label: "🏆 Podium" },
    { href: "/events", label: "🏟️ Events" },
    { href: "/schedule", label: "🗓️ Schedule" },
  ], []);

  const getLinkClass = (href: string, isMobile: boolean = false) => {
    const isActive = pathname === href;
    const baseClasses = isMobile 
      ? "block px-3 py-2 rounded-md text-base font-medium" 
      : "px-4 py-2 rounded-lg text-sm font-medium transition-colors";

    if (isActive) {
      return `${baseClasses} bg-monument-green/10 text-monument-green dark:bg-green-900/20 dark:text-green-400`;
    }
    return `${baseClasses} text-gray-700 hover:bg-gray-100 hover:text-monument-green dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-green-400`;
  };

  const closeMenu = () => setIsMenuOpen(false);


  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
        <div className="flex items-center">
          <Link href="/" className="flex items-center text-2xl font-bold text-monument-green hover:text-green-700 dark:hover:text-green-500 transition-colors no-underline">
            <Image
              src="/monument-logo.png"
              alt="Monument Logo"
              width={50}
              height={50}
              className="mr-2"
              priority
            />
            <div className="flex items-baseline space-x-2 text-monument-green dark:text-green-400">
              <span className="text-xl font-bold">Monument</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal hidden lg:inline lg:ml-2">This is your moment</span>
            </div>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={getLinkClass(href)}>
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            {(role === "admin" || role === "super_admin") && (
              <Link href="/admin/dashboard" className={`px-4 py-2 rounded-lg text-sm font-medium !text-white bg-monument-green hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 transition-all shadow-sm ${pathname.startsWith('/admin') ? 'ring-2 ring-offset-2 ring-green-500 dark:ring-offset-gray-800' : ''}`}>
                📊 Dashboard
              </Link>
            )}
            <ThemeSwitcher />
          </div>
        </div>
        <div className="md:hidden flex items-center">
          <ThemeSwitcher />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="ml-2 text-gray-700 dark:text-gray-300 hover:text-monument-green dark:hover:text-green-400 focus:outline-none">
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
            {(role === "admin" || role === "super_admin") &&  (
              <Link href="/admin/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium !text-white bg-monument-green hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 ${pathname.startsWith('/admin') ? 'ring-2 ring-white' : ''}`} onClick={closeMenu}>
                📊 Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}