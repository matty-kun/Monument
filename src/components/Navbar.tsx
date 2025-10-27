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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
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
  }, [supabase, setMounted]);


  const navLinks = useMemo(() => [
    { href: "/", label: "🏆 Podium" },
    { href: "/events", label: "🏟️ Events" },
    { href: "/schedule", label: "🗓️ Schedule" },
  ], []);

  const getLinkClass = (href: string, isMobile: boolean = false) => {
    const isActive = mounted && pathname === href;
    const baseClasses = isMobile 
      ? "block px-3 py-2 rounded-md text-base font-medium" 
      : "px-4 py-2 rounded-lg text-sm font-medium transition-colors";

    if (isActive) {
      return `${baseClasses} bg-monument-green/10 text-monument-green dark:bg-green-900/20 dark:text-green-400`;
    }
    return `${baseClasses} text-gray-700 hover:bg-gray-100 hover:text-monument-green dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-green-400`;
  };

  const getBottomNavLinkClass = (href: string) => {
    const isActive = mounted && (pathname === href || (href === "/admin/dashboard" && pathname.startsWith("/admin")));
    const baseClasses = "flex flex-col items-center justify-center flex-1 text-center py-2 px-1 transition-colors";

    if (isActive) {
      return `${baseClasses} text-monument-green dark:text-green-400`;
    }
    return `${baseClasses} text-gray-500 hover:text-monument-green dark:text-gray-400 dark:hover:text-green-400`;
  };



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
            <ThemeSwitcher mounted={mounted} />
          </div>
        </div>
        {mounted && (
          <div className="md:hidden">
            <ThemeSwitcher mounted={mounted} />
          </div>
        )}
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex justify-around items-center h-16">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={getBottomNavLinkClass(href)}>
              {/* Extract emoji from label for icon, keep full label for text */}
              <span className="text-xl">{label.split(' ')[0]}</span>
              <span className="text-xs">{label.split(' ').slice(1).join(' ')}</span>
            </Link>
          ))}
          {(role === "admin" || role === "super_admin") && (
            <Link href="/admin/dashboard" className={getBottomNavLinkClass("/admin/dashboard")}>
              <span className="text-xl">📊</span>
              <span className="text-xs">Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}