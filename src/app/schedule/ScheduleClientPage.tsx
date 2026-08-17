"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/lib/utils";
import { useScheduleViewModel } from "@/features/schedule/viewModels/useScheduleViewModel";
import { ScheduleClientPageProps, Schedule } from "@/features/schedule/models/scheduleTypes";
import MatchCard from "@/components/MatchCard";
import CompactMatchCard from "@/components/CompactMatchCard";

export default function ScheduleClientPage({ 
    initialSchedules, 
    initialEvents, 
    initialVenues, 
    initialCategories,
    initialDepartments,
    mysteryMode: initialMysteryMode
}: ScheduleClientPageProps) {
  const {
    filteredSchedules,
    searchQuery,
    setSearchQuery,
    statusTab,
    setStatusTab,
    showRefresh,
    getDynamicStatus,
    getDepartmentInfo,
    getCategoryName,
  } = useScheduleViewModel({
    initialSchedules,
    initialDepartments,
    initialCategories,
    initialMysteryMode
  });

  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [activeSwiperIndex, setActiveSwiperIndex] = useState<number>(0);
  const swiperRef = useRef<HTMLDivElement>(null);
  
  // Mouse drag-to-scroll state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!swiperRef.current) return;
    isDragging.current = true;
    // Disable smooth scrolling temporarily while dragging to avoid jerky movement
    swiperRef.current.style.scrollBehavior = 'auto';
    swiperRef.current.style.scrollSnapType = 'none';
    startX.current = e.pageX - swiperRef.current.offsetLeft;
    scrollLeft.current = swiperRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    restoreSnap();
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    restoreSnap();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !swiperRef.current) return;
    e.preventDefault();
    const x = e.pageX - swiperRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2; // Smoother 1.2x multiplier
    swiperRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const restoreSnap = () => {
    if (swiperRef.current) {
      swiperRef.current.style.scrollBehavior = 'smooth';
      swiperRef.current.style.scrollSnapType = 'x mandatory';
      // Snap to closest
      const itemWidth = swiperRef.current.clientWidth;
      const index = Math.round(swiperRef.current.scrollLeft / itemWidth);
      swiperRef.current.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
    }
  };

  // Jump to selected match when sheet opens
  useEffect(() => {
    if (selectedMatchIndex !== null && swiperRef.current) {
      setActiveSwiperIndex(selectedMatchIndex);
      const child = swiperRef.current.children[selectedMatchIndex] as HTMLElement;
      if (child) {
        // Use a tiny timeout to ensure rendering is complete before scrolling
        setTimeout(() => {
          if (swiperRef.current) {
            swiperRef.current.scrollTo({ left: child.offsetLeft, behavior: 'instant' });
          }
        }, 10);
      }
    }
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [selectedMatchIndex]);

  const handleSwiperScroll = () => {
    if (swiperRef.current) {
      const scrollPosition = swiperRef.current.scrollLeft;
      const itemWidth = swiperRef.current.clientWidth;
      const newIndex = Math.round(scrollPosition / itemWidth);
      
      // Debounce the state update to prevent massive re-renders during drag/scroll
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        if (newIndex !== activeSwiperIndex && newIndex >= 0 && newIndex < filteredSchedules.length) {
          setActiveSwiperIndex(newIndex);
        }
      }, 50); // 50ms debounce
    }
  };

  const formatFullDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group by date logic
  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const date = schedule.date || "TBA";
    if (!acc[date]) acc[date] = [];
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const formatDateLabel = (dateString: string) => {
    if (dateString === "TBA") return "To Be Announced";
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="bg-[#F5F5F7] dark:bg-black text-gray-900 dark:text-white min-h-screen pb-24 font-sans relative overflow-x-hidden">
      {/* Top gradient wash */}
      <div
        className="absolute left-0 right-0 top-0 h-72 pointer-events-none z-0"
        style={{ background: "linear-gradient(to bottom, rgba(22,163,74,0.15) 0%, transparent 100%)" }}
      />

      {/* Top Header */}
      <div className="relative z-10 px-4 pt-6 pb-4 sticky top-0 bg-[#F5F5F7]/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Matches</h1>

        {/* Segmented Control */}
        <div className="flex p-1 bg-gray-200/50 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 shadow-inner">
          {(['all', 'ongoing', 'upcoming', 'finished'] as const).map(tab => {
            const isActive = statusTab === tab;
            let label = "All";
            if (tab === 'ongoing') label = "Live";
            if (tab === 'upcoming') label = "Upcoming";
            if (tab === 'finished') label = "Final";

            return (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-colors ${isActive ? 'bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Refresh Pill */}
      <AnimatePresence>
        {showRefresh && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-32 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-white dark:bg-[#1c1c1e] text-black dark:text-white shadow-xl rounded-full px-5 py-2 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all pointer-events-auto text-sm font-bold tracking-wide"
            >
              <span>Refresh Matches</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 mt-4">
        {/* Search Bar */}
        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search teams or events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-[15px] focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-white/20 transition-shadow backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm"
          />
        </div>

        {/* Compact Matches List Grouped by Date */}
        <div className="space-y-6">
          {Object.keys(groupedSchedules).length > 0 ? (
            Object.entries(groupedSchedules).map(([dateStr, daySchedules]) => (
              <div key={dateStr} className="space-y-3">
                <h2 className="text-[14px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">
                  {formatDateLabel(dateStr)}
                </h2>
                <div className="flex flex-col bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-sm">
                  {daySchedules.map((s, index) => {
                    const globalIndex = filteredSchedules.findIndex(fs => fs.id === s.id);
                    const isLast = index === daySchedules.length - 1;
                    return (
                      <div key={s.id} className={isLast ? "" : "border-b border-gray-100 dark:border-white/5"}>
                        <CompactMatchCard
                          schedule={s}
                          getDepartmentInfo={getDepartmentInfo}
                          getDynamicStatus={getDynamicStatus}
                          onClick={() => setSelectedMatchIndex(globalIndex)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full flex flex-col items-center justify-center text-center h-[30vh]">
              <span className="text-5xl opacity-20 mb-3">📅</span>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No matches found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Swiper Bottom Sheet Modal */}
      <AnimatePresence>
        {selectedMatchIndex !== null && (
          <motion.div 
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setSelectedMatchIndex(null)}
          />
        )}
        {selectedMatchIndex !== null && (
          <motion.div
            key="modal"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70] flex flex-col pt-safe"
          >
            {/* Background gradient behind cards inside modal */}
            <div className="absolute inset-0 bg-[#F5F5F7] dark:bg-black" />
            
            {/* Modal Header: Date and Close Button */}
            <div className="relative flex justify-center items-center mt-4 mb-4 shrink-0">
              <div className="text-center font-bold text-gray-900 dark:text-white text-[15px] sm:text-[17px] tracking-wide">
                {formatFullDate(filteredSchedules[activeSwiperIndex]?.date)}
              </div>
              <button 
                onClick={() => setSelectedMatchIndex(null)}
                className="absolute right-4 z-50 w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center rounded-full transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-white">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div 
              ref={swiperRef}
              onScroll={handleSwiperScroll}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar flex-1 w-full select-none cursor-grab active:cursor-grabbing"
              style={{ scrollBehavior: 'smooth' }}
            >
              {filteredSchedules.map((s, idx) => (
                <div 
                  key={s.id} 
                  className="w-[90vw] md:w-[400px] shrink-0 snap-center h-full px-2"
                >
                  <MatchCard 
                    schedule={s}
                    getDepartmentInfo={getDepartmentInfo}
                    getDynamicStatus={getDynamicStatus}
                    getCategoryName={getCategoryName}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
