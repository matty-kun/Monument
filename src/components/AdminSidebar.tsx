"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Check,
  Flag,
  History,
  LayoutDashboard,
  MapPin,
  Medal,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Tags,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTournament } from "./AdminTournamentProvider";

interface SidebarItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  role?: string;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

const navigation: SidebarGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/activity", label: "Activity log", icon: History },
    ],
  },
  {
    label: "Competition",
    items: [
      { href: "/admin/tournaments", label: "Tournaments", icon: Trophy, role: "super_admin" },
      { href: "/admin/results", label: "Results", icon: Medal },
      { href: "/admin/events", label: "Events", icon: Flag },
      { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
    ],
  },
  {
    label: "Setup",
    items: [
      { href: "/admin/departments", label: "Teams", icon: Building2 },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/venues", label: "Venues", icon: MapPin },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, role: "super_admin" },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const { tournaments, selectedTournament, setSelectedTournament } = useTournament();

  useEffect(() => {
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

  const filteredGroups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (role === "scorer") {
          return item.href === "/admin/results" || item.href === "/admin/schedule";
        }
        return !item.role || item.role === role;
      }),
    }))
    .filter((group) => group.items.length > 0);
  const contextName = selectedTournament?.name || "Platform overview";

  const closeMobileNavigation = () => {
    setIsOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[#d9d9dd] bg-white/90 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/85 md:hidden">
        <button type="button" onClick={() => setIsOpen(true)} className="admin-icon-button" aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <div className="min-w-0 px-3 text-center">
          <p className="truncate text-sm font-semibold text-[#171a18] dark:text-white">{contextName}</p>
          <p className="text-[10px] text-[#747b77] dark:text-white/45">Monument admin</p>
        </div>
        <Link href="/admin/settings" className="admin-icon-button" aria-label="Open settings">
          <Settings size={17} />
        </Link>
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
        className={`fixed inset-y-0 left-0 z-[60] w-[268px] shrink-0 border-r border-[#d9d9dd] bg-white transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 dark:bg-[#0b0b0c] md:sticky md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "md:w-[68px]" : "md:w-[248px]"}`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className={`flex h-16 items-center border-b border-[#e5e8e6] transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 ${isCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                className="group relative hidden h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95 md:flex"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Image src="/monument-logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-md object-cover transition-opacity group-hover:opacity-0" />
                <span className="absolute inset-0 flex items-center justify-center rounded-md bg-[#ececf0] text-[#515154] opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#2c2c2e] dark:text-white/75">
                  {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                </span>
              </button>
              <Image src="/monument-logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-md object-cover md:hidden" />
              <span
                className={`min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isCollapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-40 translate-x-0 opacity-100"
                }`}
                aria-hidden={isCollapsed}
              >
                  <span className="block text-[15px] font-semibold leading-4 text-[#151816] dark:text-white">Monument</span>
                  <span className="block pt-1 font-mono text-[10px] leading-none text-[#79807c] dark:text-white/45">ADMIN CONSOLE</span>
              </span>
            </div>

            <button type="button" onClick={closeMobileNavigation} className={`admin-icon-button transition-opacity duration-200 md:hidden ${isCollapsed ? "opacity-0" : "opacity-100"}`} aria-label="Close navigation">
              <X size={18} />
            </button>
          </div>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            }`}
            aria-hidden={isCollapsed}
          >
            <div className="min-h-0 overflow-hidden px-3 py-4">
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
                </button>

              </div>
            </div>
          </div>

          <nav className={`hide-scrollbar min-h-0 flex-1 overflow-y-auto pb-3 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCollapsed ? "px-2 pt-3" : "px-3"}`} aria-label="Admin navigation">
            <div className={`transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCollapsed ? "space-y-1" : "space-y-4"}`}>
              {filteredGroups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <p
                    className={`overflow-hidden px-2 font-mono text-[10px] uppercase text-[#808783] transition-[max-height,margin,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-white/40 ${
                      isCollapsed ? "mb-0 max-h-0 -translate-x-1 opacity-0" : "mb-1.5 max-h-5 translate-x-0 opacity-100"
                    }`}
                    aria-hidden={isCollapsed}
                  >
                      {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobileNavigation}
                          title={isCollapsed ? item.label : undefined}
                          className={`group relative flex h-9 items-center rounded-md text-[13px] font-medium transition-[background-color,color,padding,gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            isCollapsed ? "justify-center px-2" : "gap-3 px-2.5"
                          } ${
                            isActive
                              ? "bg-[#e9eeeb] text-[#151816] dark:bg-white/[0.09] dark:text-white"
                              : "text-[#626965] hover:bg-[#f0f2f1] hover:text-[#151816] dark:text-white/55 dark:hover:bg-white/[0.055] dark:hover:text-white"
                          }`}
                        >
                          {isActive && <span className="absolute left-0 h-4 w-0.5 rounded-full bg-monument-primary transition-all duration-300" />}
                          <Icon size={16} strokeWidth={1.8} className="shrink-0" />
                          <span
                            className={`truncate overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              isCollapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-36 translate-x-0 opacity-100"
                            }`}
                            aria-hidden={isCollapsed}
                          >
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </nav>

          <div className={`border-t border-[#e5e8e6] py-3 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 ${isCollapsed ? "px-2" : "px-3"}`}>
            <div className={`flex h-10 items-center transition-[gap,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCollapsed ? "justify-center" : "gap-3 px-2.5"}`}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dfeae4] text-[10px] font-semibold text-[#17694f] dark:bg-monument-primary/20 dark:text-[#7bd2b4]">
                {role === "super_admin" ? "SA" : "AD"}
              </span>
              <span
                className={`min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isCollapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-36 translate-x-0 opacity-100"
                }`}
                aria-hidden={isCollapsed}
              >
                  <span className="block truncate text-[12px] font-medium capitalize text-[#343936] dark:text-white/80">{role?.replace("_", " ") || "Admin"}</span>
                  <span className="block text-[10px] text-[#858c88] dark:text-white/35">Signed in</span>
              </span>
            </div>
          </div>
        </div>
      </aside>

      {isDropdownOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsDropdownOpen(false)}
            aria-label="Close tournament selector"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select tournament"
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-[#d8dcda] bg-white shadow-2xl dark:border-white/10 dark:bg-[#181818]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e8e6] px-5 py-4 dark:border-white/10">
              <div>
                <h2 className="text-[15px] font-semibold text-[#151816] dark:text-white">Select tournament</h2>
                <p className="mt-1 text-[13px] text-[#747b77] dark:text-white/45">Choose the workspace you want to manage.</p>
              </div>
              <button type="button" onClick={() => setIsDropdownOpen(false)} className="admin-icon-button" aria-label="Close tournament selector">
                <X size={17} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => { setSelectedTournament(null); setIsDropdownOpen(false); }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-[#4f5652] transition hover:bg-[#f0f2f1] dark:text-white/65 dark:hover:bg-white/[0.06]"
              >
                <span>Platform overview</span>
                {!selectedTournament && <Check size={15} className="shrink-0 text-monument-primary" />}
              </button>
              {tournaments.map((tournament) => (
                <button
                  type="button"
                  key={tournament.id}
                  onClick={() => { setSelectedTournament(tournament); setIsDropdownOpen(false); }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-[#4f5652] transition hover:bg-[#f0f2f1] dark:text-white/65 dark:hover:bg-white/[0.06]"
                >
                  <span className="truncate">{tournament.name}</span>
                  {selectedTournament?.id === tournament.id && <Check size={15} className="shrink-0 text-monument-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
