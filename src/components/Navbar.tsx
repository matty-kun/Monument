'use client';

import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "./ThemeSwitcher"; 
import { Trophy, Flag, CalendarDays, LayoutDashboard, History, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tournaments, setTournaments] = useState<{ id: string; name: string; slug: string; is_active: boolean }[]>([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
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
    
    const fetchTournaments = async () => {
      const { data } = await supabase.from('tournaments').select('id, name, slug, is_active').order('start_date', { ascending: false });
      if (data) setTournaments(data);
    };

    fetchRole();
    fetchTournaments();
  }, [supabase, setMounted]);


  const navLinks = useMemo(() => [
    { href: "/", label: "Podium", icon: Trophy },
    { href: "/results", label: "Results", icon: Flag },
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
  const isMainAdminPath = pathname?.startsWith('/admin');

  if (isMainAdminPath) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-2.5 flex justify-between items-center max-w-7xl">
        <div className="flex items-center">
          <Link href="/" className="flex items-center text-2xl font-bold text-monument-green hover:text-green-700 dark:hover:text-green-500 transition-colors no-underline">
            <Image
              src="/monument-logo.png"
              alt="Monument Logo"
              width={42}
              height={42}
              className="mr-2"
              priority
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-monument-primary dark:text-violet-400 uppercase tracking-wider leading-none mt-1 md:mt-4">CITE FEST 2026</span>
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
            
            {/* Archive Dropdown (Desktop) */}
            <div className="relative">
              <button 
                onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                onBlur={() => setTimeout(() => setIsArchiveOpen(false), 200)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-monument-primary dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-violet-400"
              >
                <History className="w-4 h-4" />
                Archive
                <ChevronDown className="w-4 h-4 opacity-70" />
              </button>
              
              {isArchiveOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {tournaments.map(t => (
                      <Link 
                        key={t.id} 
                        href={`/?tournament=${t.slug}`}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${t.is_active ? 'font-bold' : ''}`}
                      >
                        {t.name} {t.is_active && <span className="text-xs ml-2 text-monument-primary">(Active)</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
          {/* Simple Archive Button for Mobile */}
          <button 
            onClick={() => setIsArchiveOpen(!isArchiveOpen)}
            className="flex flex-col items-center justify-center flex-1 text-center py-2 px-1 transition-colors text-gray-500 hover:text-monument-primary dark:text-gray-400 dark:hover:text-violet-400"
          >
            <History className="w-5 h-5 mb-1" />
            <span className="text-xs">Archive</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Archive Menu overlay */}
      {isArchiveOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden flex items-end" onClick={() => setIsArchiveOpen(false)}>
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-2xl p-4 pb-20 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Past Tournaments</h3>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
              {tournaments.map(t => (
                <Link 
                  key={t.id} 
                  href={`/?tournament=${t.slug}`}
                  onClick={() => setIsArchiveOpen(false)}
                  className={`p-3 rounded-lg border ${t.is_active ? 'border-monument-primary bg-monument-primary/5 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="font-medium text-gray-800 dark:text-gray-200">{t.name}</div>
                  {t.is_active && <div className="text-xs text-monument-primary font-bold mt-1">Current Event</div>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}