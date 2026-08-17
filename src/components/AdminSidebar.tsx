"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Medal, 
  Flag, 
  CalendarDays, 
  Building2, 
  Tags, 
  MapPin, 
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Trophy
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament, Tournament } from "./AdminTournamentProvider";

interface SidebarItem {
  href: string;
  label: string;
  icon: any;
  role?: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // Mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createClient();
  const { tournaments, selectedTournament, setSelectedTournament, activeTournament } = useTournament();

  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setRole(data?.role || "user");
      }
    }
    fetchRole();
  }, [supabase]);

  const items: SidebarItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/tournaments", label: "Tournaments", icon: Trophy, role: "super_admin" },
    { href: "/admin/results", label: "Results", icon: Medal },
    { href: "/admin/events", label: "Events", icon: Flag },
    { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/admin/departments", label: "Teams", icon: Building2 },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/venues", label: "Venues", icon: MapPin },
    { href: "/admin/users", label: "Users", icon: Users, role: "super_admin" },
  ];

  const filteredItems = items.filter(item => !item.role || item.role === role);

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 z-[70] bg-monument-primary text-white p-4 rounded-full shadow-2xl md:hidden flex items-center justify-center">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden" onClick={() => setIsOpen(false)}></div>}

      <aside className={`fixed top-0 left-0 bottom-0 z-[60] bg-[#1c1c1e]/90 backdrop-blur-xl border-r border-white/5 transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'md:w-20' : 'md:w-72'} md:sticky md:h-screen md:shrink-0`}>
        <div className="flex flex-col h-full py-6">
          <div className={`px-4 mb-10 flex items-center group/sidebar-header ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="relative flex items-center gap-3">
              <div 
                className={`flex items-center cursor-pointer transition-all duration-500 rounded-2xl ${isCollapsed ? 'p-0 w-12 h-12 justify-center' : 'p-0'}`} 
                onClick={() => isCollapsed && setIsCollapsed(false)}
              >
                <div className={`relative flex items-center ${isCollapsed ? 'w-10 h-10 justify-center overflow-hidden' : ''}`}>
                    <AnimatePresence mode="wait">
                        {isCollapsed ? (
                            <motion.div 
                                key="collapsed-logo" 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative w-full h-full flex items-center justify-center group"
                            >
                                <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-50">
                                    <Image src="/monument-logo.png" alt="Logo" width={32} height={32} className="rounded-lg" />
                                </div>
                                <div 
                                    className="absolute inset-0 flex items-center justify-center opacity-0 scale-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110 text-white"
                                    onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}
                                >
                                    <PanelLeftOpen size={24} />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="full-logo" 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-3"
                            >
                                <Image src="/monument-logo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
                                <div className="flex flex-col whitespace-nowrap overflow-visible">
                                    {tournaments.length > 0 ? (
                                      <div className="relative">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                                          className="flex items-center gap-2 text-[17px] font-black text-white tracking-tight leading-none whitespace-nowrap bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none hover:opacity-80 transition-opacity"
                                        >
                                          <span className="max-w-[150px] truncate">
                                            {selectedTournament ? selectedTournament.name : 'Platform Overview'}
                                          </span>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </button>
                                        
                                        <AnimatePresence>
                                          {isDropdownOpen && (
                                            <>
                                              <div className="fixed inset-0 z-[80]" onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }} />
                                              <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full left-0 mt-3 w-64 bg-[#2c2c2e] border border-white/10 rounded-[16px] shadow-2xl z-[90] overflow-hidden flex flex-col py-2"
                                              >
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); setSelectedTournament(null); setIsDropdownOpen(false); }}
                                                  className={`text-left px-4 py-2.5 text-[14px] font-semibold transition-colors ${!selectedTournament ? 'bg-[#0A84FF] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                  Platform Overview
                                                </button>
                                                <div className="h-px w-full bg-white/10 my-1" />
                                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                  {tournaments.map(t => (
                                                    <button
                                                      key={t.id}
                                                      onClick={(e) => { e.stopPropagation(); setSelectedTournament(t); setIsDropdownOpen(false); }}
                                                      className={`w-full text-left px-4 py-2.5 text-[14px] font-semibold transition-colors flex items-center justify-between ${selectedTournament?.id === t.id ? 'bg-[#0A84FF]/20 text-[#0A84FF]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                                                    >
                                                      <span className="truncate">{t.name}</span>
                                                      {selectedTournament?.id === t.id && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                    </button>
                                                  ))}
                                                </div>
                                              </motion.div>
                                            </>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    ) : (
                                      <span className="text-[17px] font-semibold text-white tracking-tight leading-none whitespace-nowrap">LOADING...</span>
                                    )}
                                      <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mt-1 whitespace-nowrap">
                                      {selectedTournament ? (selectedTournament.is_active ? '● Active Season' : '○ Archived Season') : '● Global Platform'}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </div>
            </div>

            {!isCollapsed && !isOpen && (
              <button onClick={() => setIsCollapsed(true)} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <PanelLeftClose size={20} />
              </button>
            )}
          </div>

          <nav className="flex-1 px-3 space-y-2 overflow-y-auto no-scrollbar">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} 
                      className={`flex items-center group relative ${isCollapsed ? 'justify-center py-4' : 'px-4 py-3 justify-between'} rounded-[20px] transition-all duration-300 ${isActive ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                  <div className="flex items-center gap-4">
                    <Icon size={isCollapsed ? 26 : 20} className={isActive ? 'text-white' : 'transition-transform group-hover:scale-110 duration-300'} />
                    {!isCollapsed && <span className={`text-[14px] font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                  </div>
                  {isCollapsed && (
                    <div className="fixed left-24 bg-[#1c1c1e] border border-white/10 text-white text-[12px] font-semibold tracking-wide px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 z-[100] shadow-2xl">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-4 pt-6 pb-6">
             <div className={`group bg-[#1c1c1e] hover:bg-white/5 rounded-[20px] p-3 flex items-center gap-3 transition-all border border-white/5 shadow-sm hover:border-white/10 cursor-default ${isCollapsed ? 'justify-center p-3' : ''}`}>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#0051a8] shadow-inner flex items-center justify-center shrink-0 relative">
                  <Users className="text-white drop-shadow-md" size={18} strokeWidth={2.5} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#1c1c1e] rounded-full"></div>
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden flex-1">
                    <p className="text-[10px] font-semibold text-white/40 tracking-widest uppercase mb-0.5">Account</p>
                    <p className="text-[14px] font-bold text-white tracking-wide truncate capitalize">{role?.replace('_', ' ') || 'Developer'}</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}
