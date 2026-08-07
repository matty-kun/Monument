"use client";

import Link from "next/link";
import { Trophy, CalendarDays, List, MoreHorizontal, LayoutDashboard, History } from "lucide-react";
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
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }

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
  const tournamentParam = searchParams?.get('tournament');

  const navLinks = useMemo(() => [
    { href: tournamentParam ? `/?tournament=${tournamentParam}` : "/", label: "Standings", icon: Trophy },
    { href: tournamentParam ? `/schedule?tournament=${tournamentParam}` : "/schedule", label: "Scores", icon: CalendarDays },
  ], [tournamentParam]);

  const isMainAdminPath = pathname?.startsWith('/admin');
  if (isMainAdminPath) return null;

  return (
    <>
      {/* Bottom Navigation — Floating Pill Design */}
      <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[360px] z-50">
        <nav className="bg-[#1c1c1e]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-2xl flex justify-between items-center h-[64px] px-2.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = mounted && pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center w-[70px] h-[52px] rounded-[24px] transition-all duration-300 ${
                  isActive ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-[20px] h-[20px] mb-0.5 transition-colors duration-300 ${
                    isActive ? 'text-[#0A84FF]' : 'text-white'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                />
                <span className={`text-[10px] font-bold tracking-wide transition-colors duration-300 ${
                  isActive ? 'text-[#0A84FF]' : 'text-white'
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* 4th tab: More */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center w-[70px] h-[52px] rounded-[24px] transition-all duration-300 hover:bg-white/5"
          >
            <MoreHorizontal className="w-[20px] h-[20px] mb-0.5 text-white" strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide text-white">More</span>
          </button>
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
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all mb-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
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
                    className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                      t.is_active
                        ? 'bg-[#0A84FF] text-white'
                        : 'bg-white/5 text-gray-200 hover:bg-white/10'
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