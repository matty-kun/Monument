"use client";

import Link from "next/link";
import { Trophy, CalendarDays, List, MoreHorizontal, LayoutDashboard, History, Swords } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tournaments, setTournaments] = useState<{ id: string; name: string; slug: string; is_active: boolean }[]>([]);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setRole(profile.role);
      }
    };

    const fetchTournaments = async () => {
      const { data } = await supabase.from('tournaments').select('id, name, slug, is_active').order('start_date', { ascending: false });
      if (data) setTournaments(data);
    };

    fetchRole();
    fetchTournaments();
  }, [supabase]);

  const searchParams = useSearchParams();
  const urlTournamentParam = searchParams?.get('tournament');
  const [activeTournamentParam, setActiveTournamentParam] = useState<string | null>(null);

  useEffect(() => {
    const isMainPage = pathname === "/" || pathname === "/schedule";

    if (urlTournamentParam) {
      setActiveTournamentParam(urlTournamentParam);
      sessionStorage.setItem('lastViewedTournament', urlTournamentParam);
    } else if (isMainPage) {
      setActiveTournamentParam(null);
      sessionStorage.removeItem('lastViewedTournament');
    } else {
      const stored = sessionStorage.getItem('lastViewedTournament');
      if (stored) {
        setActiveTournamentParam(stored);
      } else {
        setActiveTournamentParam(null);
      }
    }
  }, [pathname, urlTournamentParam]);

  const navLinks = useMemo(() => [
    { href: activeTournamentParam ? `/?tournament=${activeTournamentParam}` : "/", label: "Podium", icon: Trophy },
    { href: activeTournamentParam ? `/schedule?tournament=${activeTournamentParam}` : "/schedule", label: "Scores", icon: Swords },
  ], [activeTournamentParam]);

  const isMainAdminPath = pathname?.startsWith('/admin');
  if (isMainAdminPath) return null;

  // Third tab logic: History if non-admin (or loading), More if admin
  const isHistoryActive = mounted && pathname === "/history";

  return (
    <>
      {/* Bottom Navigation — Spotify Design */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/95 to-transparent pointer-events-none" />
        <nav className="relative flex justify-around items-end pb-5 pt-12 px-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = mounted && pathname === href.split('?')[0]; // simple path check
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center w-20 transition-all duration-300 z-10"
              >
                <Icon
                  className={`w-[26px] h-[26px] mb-1 transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-[#b3b3b3]'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive && label !== 'Scores' ? 'currentColor' : 'none'}
                />
                <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-[#b3b3b3]'
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Conditional 3rd Tab */}
          {role === 'admin' ? (
            <button
              onClick={() => setIsMoreOpen(true)}
              className="flex flex-col items-center justify-center w-20 transition-all duration-300 z-10 hover:opacity-80"
            >
              <MoreHorizontal className="w-[26px] h-[26px] mb-1 text-[#b3b3b3]" strokeWidth={2} />
              <span className="text-[10px] font-semibold tracking-wide text-[#b3b3b3]">More</span>
            </button>
          ) : (
            <Link
              href="/history"
              className="flex flex-col items-center justify-center w-20 transition-all duration-300 z-10"
            >
              <History
                className={`w-[26px] h-[26px] mb-1 transition-colors duration-300 ${
                  isHistoryActive ? 'text-white' : 'text-[#b3b3b3]'
                }`}
                strokeWidth={isHistoryActive ? 2.5 : 2}
                fill="none"
              />
              <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${
                isHistoryActive ? 'text-white' : 'text-[#b3b3b3]'
              }`}>
                History
              </span>
            </Link>
          )}
        </nav>
      </div>

      {/* More Sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e] rounded-t-3xl pt-5 px-4 pb-28 shadow-2xl border-t border-white/5"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5 opacity-40" />

              {/* Admin link (if applicable) */}
              {(role === "admin" || role === "super_admin") && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all mb-3 border border-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-[15px] text-white">Admin Dashboard</div>
                    <div className="text-[11px] text-gray-500">Manage events, results & more</div>
                  </div>
                </Link>
              )}

              {/* Archive section */}
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-3 mt-4 flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Past Tournaments
              </div>

              <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto no-scrollbar">
                {tournaments.map(t => (
                  <Link
                    key={t.id}
                    href={`/?tournament=${t.slug}`}
                    onClick={() => setIsMoreOpen(false)}
                    className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${
                      t.is_active
                        ? 'bg-monument-green text-white shadow-none'
                        : 'bg-white/5 text-gray-200 hover:bg-white/10 border-transparent shadow-none'
                    }`}
                  >
                    <div className="font-semibold text-[15px]">{t.name}</div>
                    {t.is_active && (
                      <div className="text-[10px] uppercase tracking-wider font-black px-2 py-1 bg-white/20 rounded-md">
                        Current
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}