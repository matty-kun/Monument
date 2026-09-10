"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Flag,
  History,
  LayoutDashboard,
  MapPin,
  Medal,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Tags,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { useTournament } from "./AdminTournamentProvider";

interface SidebarItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  role?: string;
}

const navigation: SidebarItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy, role: "super_admin" },
  { href: "/admin/results", label: "Results", icon: Medal },
  { href: "/admin/activity", label: "Activity log", icon: History },
  { href: "/admin/events", label: "Events", icon: Flag },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/admin/departments", label: "Teams", icon: Building2 },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/venues", label: "Venues", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: Users, role: "super_admin" },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [supabase] = useState(() => createClient());
  const { tournaments, selectedTournament, setSelectedTournament } = useTournament();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);

    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setRole(data?.role || "user");
    }

    fetchRole();
  }, [supabase]);

  const filteredItems = navigation.filter((item) => !item.role || item.role === role);
  const contextName = selectedTournament?.name || "Platform overview";
  const isDark = resolvedTheme === "dark";

  const closeMobileNavigation = () => {
    setIsOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[#dde1df] bg-white/95 px-4 backdrop-blur-md dark:border-white/10 dark:bg-[#111412]/95 md:hidden">
        <button type="button" onClick={() => setIsOpen(true)} className="admin-icon-button" aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <div className="min-w-0 px-3 text-center">
          <p className="truncate text-sm font-semibold text-[#171a18] dark:text-white">{contextName}</p>
          <p className="text-[10px] text-[#747b77] dark:text-white/45">Monument admin</p>
        </div>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="admin-icon-button"
          aria-label={isDark ? "Use light theme" : "Use dark theme"}
        >
          {mounted ? (isDark ? <Sun size={17} /> : <Moon size={17} />) : <span className="h-4 w-4" />}
        </button>
      </header>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/45 md:hidden"
          onClick={closeMobileNavigation}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-[268px] shrink-0 border-r border-[#dde1df] bg-[#fbfcfb] transition-[width,transform] duration-200 dark:border-white/10 dark:bg-[#101211] md:sticky md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "md:w-[68px]" : "md:w-[248px]"}`}
      >
        <div className="flex h-full flex-col">
          <div className={`flex h-16 items-center border-b border-[#e5e8e6] dark:border-white/10 ${isCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            <button
              type="button"
              onClick={() => isCollapsed && setIsCollapsed(false)}
              className="flex min-w-0 items-center gap-3 text-left"
              aria-label={isCollapsed ? "Expand sidebar" : "Monument admin"}
            >
              <Image src="/monument-logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-md object-cover" />
              {!isCollapsed && (
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-4 text-[#151816] dark:text-white">Monument</span>
                  <span className="block pt-1 font-mono text-[10px] leading-none text-[#79807c] dark:text-white/45">ADMIN CONSOLE</span>
                </span>
              )}
            </button>

            {!isCollapsed && (
              <>
                <button type="button" onClick={() => setIsCollapsed(true)} className="admin-icon-button hidden md:inline-flex" aria-label="Collapse sidebar">
                  <PanelLeftClose size={17} />
                </button>
                <button type="button" onClick={closeMobileNavigation} className="admin-icon-button md:hidden" aria-label="Close navigation">
                  <X size={18} />
                </button>
              </>
            )}
          </div>

          <div className={isCollapsed ? "px-2 py-3" : "px-3 py-4"}>
            {isCollapsed ? (
              <button type="button" onClick={() => setIsCollapsed(false)} className="admin-icon-button mx-auto" title={contextName} aria-label={`Selected tournament: ${contextName}`}>
                <PanelLeftOpen size={17} />
              </button>
            ) : (
              <div className="relative">
                <p className="mb-1.5 px-2 font-mono text-[10px] text-[#808783] dark:text-white/40">TOURNAMENT</p>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  className="flex h-10 w-full items-center justify-between gap-3 rounded-md border border-[#dde1df] bg-white px-3 text-left text-sm font-medium text-[#202421] transition-colors hover:border-[#b8c0bc] dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:hover:border-white/20"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="min-w-0 truncate">{contextName}</span>
                  <ChevronDown size={15} className={`shrink-0 text-[#747b77] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-[70] cursor-default" onClick={() => setIsDropdownOpen(false)} aria-label="Close tournament selector" />
                    <div className="absolute left-0 right-0 top-[66px] z-[80] max-h-72 overflow-y-auto rounded-md border border-[#d8dcda] bg-white p-1 shadow-[0_14px_38px_rgba(18,24,20,0.14)] dark:border-white/10 dark:bg-[#191c1a]">
                      <button
                        type="button"
                        onClick={() => { setSelectedTournament(null); setIsDropdownOpen(false); }}
                        className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm text-[#4f5652] hover:bg-[#f0f2f1] dark:text-white/65 dark:hover:bg-white/[0.06]"
                      >
                        Platform overview
                        {!selectedTournament && <Check size={14} className="text-monument-primary" />}
                      </button>
                      {tournaments.map((tournament) => (
                        <button
                          type="button"
                          key={tournament.id}
                          onClick={() => { setSelectedTournament(tournament); setIsDropdownOpen(false); }}
                          className="flex w-full items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-sm text-[#4f5652] hover:bg-[#f0f2f1] dark:text-white/65 dark:hover:bg-white/[0.06]"
                        >
                          <span className="truncate">{tournament.name}</span>
                          {selectedTournament?.id === tournament.id && <Check size={14} className="shrink-0 text-monument-primary" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <nav className={`min-h-0 flex-1 overflow-y-auto pb-3 ${isCollapsed ? "px-2" : "px-3"}`} aria-label="Admin navigation">
            {!isCollapsed && <p className="mb-1.5 px-2 font-mono text-[10px] text-[#808783] dark:text-white/40">WORKSPACE</p>}
            <div className="space-y-0.5">
              {filteredItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileNavigation}
                    title={isCollapsed ? item.label : undefined}
                    className={`group relative flex h-9 items-center rounded-md text-[13px] font-medium transition-colors ${
                      isCollapsed ? "justify-center px-2" : "gap-3 px-2.5"
                    } ${
                      isActive
                        ? "bg-[#e9eeeb] text-[#151816] dark:bg-white/[0.09] dark:text-white"
                        : "text-[#626965] hover:bg-[#f0f2f1] hover:text-[#151816] dark:text-white/55 dark:hover:bg-white/[0.055] dark:hover:text-white"
                    }`}
                  >
                    {isActive && <span className="absolute left-0 h-4 w-0.5 rounded-full bg-monument-primary" />}
                    <Icon size={16} strokeWidth={1.8} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className={`border-t border-[#e5e8e6] py-3 dark:border-white/10 ${isCollapsed ? "px-2" : "px-3"}`}>
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isCollapsed ? (isDark ? "Use light theme" : "Use dark theme") : undefined}
              className={`flex h-9 w-full items-center rounded-md text-[#626965] transition-colors hover:bg-[#f0f2f1] hover:text-[#151816] dark:text-white/55 dark:hover:bg-white/[0.055] dark:hover:text-white ${isCollapsed ? "justify-center" : "gap-3 px-2.5"}`}
            >
              {mounted ? (isDark ? <Sun size={16} /> : <Moon size={16} />) : <span className="h-4 w-4" />}
              {!isCollapsed && <span className="text-[13px] font-medium">{isDark ? "Light mode" : "Dark mode"}</span>}
            </button>

            <div className={`mt-1 flex h-10 items-center ${isCollapsed ? "justify-center" : "gap-3 px-2.5"}`}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dfeae4] text-[10px] font-semibold text-[#17694f] dark:bg-monument-primary/20 dark:text-[#7bd2b4]">
                {role === "super_admin" ? "SA" : "AD"}
              </span>
              {!isCollapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium capitalize text-[#343936] dark:text-white/80">{role?.replace("_", " ") || "Admin"}</span>
                  <span className="block text-[10px] text-[#858c88] dark:text-white/35">Signed in</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
