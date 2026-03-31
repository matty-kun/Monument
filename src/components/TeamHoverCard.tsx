"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface Result {
  id: string;
  medal_type: "gold" | "silver" | "bronze";
  events: {
    name: string;
    icon: string;
  };
}

interface TeamHoverCardProps {
  teamId: string;
  children: React.ReactNode;
}

export default function TeamHoverCard({ teamId, children }: TeamHoverCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Result[]>([]);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (isVisible && history.length === 0 && !isLoading) {
      const fetchHistory = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("results")
            .select(`
              id, 
              medal_type, 
              events (
                name, 
                icon
              )
            `)
            .eq("department_id", teamId)
            .order("medal_type", { ascending: true })
            .limit(10);
          
          if (data) {
            // Client-side sort to ensure Gold > Silver > Bronze
            const medalPriority = { gold: 1, silver: 2, bronze: 3 };
            const sorted = [...data].sort((a: any, b: any) => 
              medalPriority[a.medal_type as keyof typeof medalPriority] - 
              medalPriority[b.medal_type as keyof typeof medalPriority]
            );
            setHistory(sorted as any);
          }
        } catch (err) {
          console.error("Error fetching history:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isVisible, teamId, history.length, isLoading, supabase]);

  const handleMouseEnter = () => {
    // 400ms delay to prevent flickering while moving mouse fast
    hoverTimeout.current = setTimeout(() => setIsVisible(true), 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsVisible(false);
  };

  return (
    <div 
      className="relative block" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/teams/${teamId}`}>
        {children}
      </Link>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5 pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏆</span>
              <h4 className="text-xs uppercase font-black text-gray-400 tracking-widest">Recent Medals</h4>
            </div>

            {history.length > 0 ? (
              <div className="space-y-3">
                {history.slice(0, 3).map((res) => (
                  <div key={res.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <span className="text-lg grayscale-0">{res.events?.icon || "🏅"}</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{res.events?.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${
                        res.medal_type === 'gold' ? 'text-yellow-600' : 
                        res.medal_type === 'silver' ? 'text-gray-400' : 
                        'text-orange-600'
                      }`}>
                        {res.medal_type === 'gold' && "🥇 GOLD"}
                        {res.medal_type === 'silver' && "🥈 SILVER"}
                        {res.medal_type === 'bronze' && "🥉 BRONZE"}
                      </span>
                    </div>
                  </div>
                ))}
                
                {history.length > 3 && (
                  <div className="pt-2 text-center">
                    <span className="text-[10px] font-medium text-gray-400">+ {history.length - 3} more achievements</span>
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-center">
                   <div className="text-[10px] font-black text-monument-primary uppercase tracking-widest flex items-center gap-1">
                      Click to view all history 
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                   </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center py-4 space-y-2">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold text-gray-400 animate-pulse uppercase tracking-widest">Loading Records...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 space-y-2 opacity-60">
                 <span className="text-3xl">🏅</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Awaiting achievements</span>
              </div>
            )}
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-900 rotate-45 border-r border-b border-gray-100 dark:border-gray-800 -mt-2 shadow-sm"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
