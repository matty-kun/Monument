"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface TeamHoverCardProps {
  teamId: string;
  children: React.ReactNode;
}

export default function TeamHoverCard({ teamId, children }: TeamHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
      fetchHistory();
    }, 400); // 400ms delay before showing tooltip to avoid flashes
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const fetchHistory = async () => {
    if (history || loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("results")
      .select(`
        medal_type,
        events (
          name,
          icon
        )
      `)
      .eq("department_id", teamId)
      // Sort in JS, just get top 5 latest? Results don't have created_at usually, we just take top 5
      .limit(5);
      
    // Order medals roughly: gold -> silver -> bronze
    const sorted = (data || []).sort((a, b) => {
      const val = { gold: 3, silver: 2, bronze: 1 };
      return val[b.medal_type as keyof typeof val] - val[a.medal_type as keyof typeof val];
    });

    setHistory(sorted);
    setLoading(false);
  };

  // For touch devices, we rely purely on the Link wrapping it, since hover doesn't activate.
  return (
    <div 
      className="relative flex items-center justify-center w-full group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/teams/${teamId}`} className="w-full flex justify-center items-center">
        {children}
      </Link>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 pointer-events-none"
          >
            <div className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
              🏆 Recent Medals Glimpse
            </div>
            {loading ? (
              <div className="text-xs text-gray-500 py-2 flex justify-center">
                <div className="w-4 h-4 border-2 border-monument-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : history && history.length > 0 ? (
              <ul className="space-y-1 mt-2">
                {history.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-center gap-2">
                    <span className="text-base">{item.medal_type === 'gold' ? '🥇' : item.medal_type === 'silver' ? '🥈' : '🥉'}</span>
                    <span className="truncate text-gray-600 dark:text-gray-300 font-medium">{item.events?.icon} {item.events?.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-500 py-2 text-center italic">No medals won yet.</div>
            )}
            <div className="mt-3 text-[10px] text-center text-monument-primary font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50 py-1 rounded">
              Click to view all history
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-gray-800 drop-shadow-md" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
