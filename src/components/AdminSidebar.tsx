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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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
  const [role, setRole] = useState<string | null>(null);
  const supabase = createClient();

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

      <aside className={`fixed top-0 left-0 bottom-0 z-[60] bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'md:w-20' : 'md:w-72'} md:sticky md:h-screen md:shrink-0`}>
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
                                    className="absolute inset-0 flex items-center justify-center opacity-0 scale-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110 text-monument-primary"
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
                                <div className="flex flex-col whitespace-nowrap">
                                    <span className="text-lg font-black text-monument-primary dark:text-violet-400 uppercase tracking-tighter leading-none whitespace-nowrap">CITE FEST 2026</span>
                                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mt-1 whitespace-nowrap">Management</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </div>
            </div>

            {!isCollapsed && !isOpen && (
              <button onClick={() => setIsCollapsed(true)} className="p-2 text-gray-300 hover:text-monument-primary hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all">
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
                      className={`flex items-center group relative ${isCollapsed ? 'justify-center py-4' : 'px-4 py-3 justify-between'} rounded-2xl transition-all duration-300 ${isActive ? 'bg-monument-primary text-white dark:text-white shadow-xl shadow-violet-500/30' : 'text-gray-400 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-monument-primary dark:hover:text-white'}`}>
                  <div className="flex items-center gap-4">
                    <Icon size={isCollapsed ? 26 : 20} className={isActive ? 'text-white dark:text-white' : 'transition-transform group-hover:scale-110 duration-300'} />
                    {!isCollapsed && <span className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-white dark:text-white' : ''}`}>{item.label}</span>}
                  </div>
                  {isCollapsed && (
                    <div className="fixed left-24 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 z-[100] shadow-2xl">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-3 pt-6 border-t border-gray-50 dark:border-gray-700/50">
             <div className={`bg-gray-50/50 dark:bg-gray-900/30 rounded-[2rem] p-5 flex items-center gap-4 transition-all ${isCollapsed ? 'justify-center p-4' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center border border-gray-100 dark:border-gray-700 shrink-0">
                  <Users className="text-monument-primary" size={20} />
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Authenticated</p>
                    <p className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight truncate">{role?.replace('_', ' ') || 'Developer'}</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}
