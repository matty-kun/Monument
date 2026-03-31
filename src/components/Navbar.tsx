'use client';

import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "./ThemeSwitcher"; 
import { Trophy, Flag, CalendarDays, LayoutDashboard } from "lucide-react";
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
    { href: "/", label: "Podium", icon: Trophy },
    { href: "/events", label: "Events", icon: Flag },
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
  ], []);

  const getLinkClass = (href: string, isMobile: boolean = false) => {
    const isActive = mounted && pathname === href;
    const baseClasses = isMobile 
      ? "block px-3 py-2 rounded-md text-base font-medium" 
      : "px-4 py-2 rounded-lg text-sm font-medium transition-colors";

    if (isActive) {
      return `${baseClasses} bg-monument-primary/10 text-monument-primary dark:bg-violet-900/20 dark:text-violet-400`;
    }
    return `${baseClasses} text-gray-700 hover:bg-gray-100 hover:text-monument-primary dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-violet-400`;
  };

  const getBottomNavLinkClass = (href: string) => {
    const isActive = mounted && (pathname === href || (href === "/admin/dashboard" && pathname.startsWith("/admin")));
    const baseClasses = "flex flex-col items-center justify-center flex-1 text-center py-2 px-1 transition-colors";

    if (isActive) {
      return `${baseClasses} text-monument-primary dark:text-violet-400`;
    }
    return `${baseClasses} text-gray-500 hover:text-monument-primary dark:text-gray-400 dark:hover:text-violet-400`;
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
            <div className="flex flex-col">
              <span className="text-xl font-bold text-monument-primary dark:text-violet-400 uppercase tracking-wider leading-none mt-4">CITE FEST 2026</span>
              <span className="hidden md:block text-[0.6rem] font-medium text-gray-500 dark:text-gray-400 mt-[-1px] uppercase tracking-wide whitespace-nowrap transition-all duration-300">
                Empowering Digital Innovators for a Smarter and Sustainable Future
              </span>
            </div>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`${getLinkClass(href)} flex items-center gap-2`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            {(role === "admin" || role === "super_admin") && (
              <Link href="/admin/dashboard" className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium !text-white bg-monument-primary hover:bg-monument-dark dark:bg-violet-600 dark:hover:bg-violet-700 transition-all shadow-sm ${pathname.startsWith('/admin') ? 'ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-gray-800' : ''}`}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
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
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={getBottomNavLinkClass(href)}>
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
          {(role === "admin" || role === "super_admin") && (
            <Link href="/admin/dashboard" className={getBottomNavLinkClass("/admin/dashboard")}>
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span className="text-xs">Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}