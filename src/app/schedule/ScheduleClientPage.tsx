"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScheduleViewModel } from "@/features/schedule/viewModels/useScheduleViewModel";
import { ScheduleClientPageProps, Schedule } from "@/features/schedule/models/scheduleTypes";
import MatchCard from "@/components/MatchCard";
import CompactMatchCard from "@/components/CompactMatchCard";
import { useSearchParams } from "next/navigation";
import { ScheduleSkeleton } from "@/components/PublicPageSkeletons";

export default function ScheduleClientPage({ 
    tournamentId,
    tournamentSlug,
    initialSchedules, 
    initialCategories,
    initialDepartments,
    mysteryMode: initialMysteryMode
}: ScheduleClientPageProps & { tournamentSlug: string }) {
  const searchParams = useSearchParams();
  const currentSlug = searchParams?.get("tournament") || "default";
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
    tournamentId,
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

  const getClosestSlideIndex = (container: HTMLDivElement) => {
    const viewportCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    Array.from(container.children).forEach((child, index) => {
      const slide = child as HTMLElement;
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const scrollToSlide = (index: number, behavior: ScrollBehavior = "smooth") => {
    const container = swiperRef.current;
    const slide = container?.children[index] as HTMLElement | undefined;
    if (!container || !slide) return;

    const centeredLeft = slide.offsetLeft - (container.clientWidth - slide.offsetWidth) / 2;
    container.scrollTo({ left: centeredLeft, behavior });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!swiperRef.current || e.button !== 0) return;
    isDragging.current = true;
    swiperRef.current.style.scrollBehavior = "auto";
    startX.current = e.clientX;
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
    const walk = e.clientX - startX.current;
    swiperRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const restoreSnap = () => {
    if (!swiperRef.current) return;
    swiperRef.current.style.scrollBehavior = "smooth";
    scrollToSlide(getClosestSlideIndex(swiperRef.current));
  };

  const openMatch = (index: number) => {
    setActiveSwiperIndex(index);
    setSelectedMatchIndex(index);
  };

  // Jump to selected match when sheet opens
  useEffect(() => {
    if (selectedMatchIndex !== null && swiperRef.current) {
      const frame = requestAnimationFrame(() => scrollToSlide(selectedMatchIndex, "instant"));
      return () => cancelAnimationFrame(frame);
    }
  }, [selectedMatchIndex]);

  useEffect(() => () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
  }, []);

  const handleSwiperScroll = () => {
    if (swiperRef.current) {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        if (!swiperRef.current) return;
        const newIndex = getClosestSlideIndex(swiperRef.current);
        if (newIndex !== activeSwiperIndex && newIndex >= 0 && newIndex < filteredSchedules.length) {
          setActiveSwiperIndex(newIndex);
        }
      }, 80);
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

  // Prevent stale data flashing during Next.js client-side query param navigation
  if (currentSlug !== tournamentSlug) {
    return <ScheduleSkeleton />;
  }

  return (
    <div className="bg-black text-white min-h-screen pb-24 font-sans relative overflow-x-hidden">
      {/* Top Header */}
      <div className="relative z-10 px-4 pt-6 pb-4 sticky top-0 bg-black/80 backdrop-blur-xl">
        <h1 className="text-3xl font-black text-white tracking-tight mb-4">Matches</h1>

        {/* Segmented Control */}
        <div className="flex p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner">
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
                className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-colors ${isActive ? 'bg-[#1c1c1e] text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-300'}`}
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
              className="flex items-center gap-2 bg-[#1c1c1e] text-white shadow-xl rounded-full px-5 py-2 hover:bg-white/10 active:scale-95 transition-all pointer-events-auto text-sm font-bold tracking-wide"
            >
              <span>Refresh Matches</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 mt-4">
        {/* Search Bar */}
        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search teams or events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(28,28,30,0.8),rgba(28,28,30,0.65))] py-2.5 pl-9 pr-4 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
        </div>

        {/* Compact Matches List Grouped by Date */}
        <div className="space-y-6">
          {Object.keys(groupedSchedules).length > 0 ? (
            Object.entries(groupedSchedules).map(([dateStr, daySchedules]) => (
              <div key={dateStr} className="space-y-3">
                <h2 className="text-[14px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  {formatDateLabel(dateStr)}
                </h2>
                <div className="flex flex-col overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(28,28,30,0.8),rgba(28,28,30,0.65))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                  {daySchedules.map((s, index) => {
                    const globalIndex = filteredSchedules.findIndex(fs => fs.id === s.id);
                    const isLast = index === daySchedules.length - 1;
                    return (
                      <div key={s.id} className={isLast ? "" : "border-b border-white/[0.08]"}>
                        <CompactMatchCard
                          schedule={s}
                          getDepartmentInfo={getDepartmentInfo}
                          getDynamicStatus={getDynamicStatus}
                          onClick={() => openMatch(globalIndex)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full flex flex-col items-center justify-center text-center h-[30vh]">
              <p className="text-gray-400 font-medium">No schedules.</p>
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
            transition={{ type: "spring", damping: 32, stiffness: 300, mass: 0.75 }}
            className="fixed inset-0 z-[70] flex flex-col pt-safe"
          >
            {/* Background gradient behind cards inside modal */}
            <div className="absolute inset-0 bg-black" />
            
            {/* Modal Header: Date and Close Button */}
            <div className="relative flex justify-center items-center mt-4 mb-4 shrink-0">
              <div className="text-center font-bold text-white text-[15px] sm:text-[17px] tracking-wide">
                {formatFullDate(filteredSchedules[activeSwiperIndex]?.date)}
              </div>
              <button 
                onClick={() => setSelectedMatchIndex(null)}
                className="absolute right-4 z-50 w-8 h-8 sm:w-10 sm:h-10 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 shadow-sm flex items-center justify-center rounded-full transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
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
              className="flex w-full flex-1 cursor-grab snap-x snap-mandatory scroll-px-[5vw] select-none overflow-x-auto overscroll-x-contain hide-scrollbar active:cursor-grabbing"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              {filteredSchedules.map((s) => (
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
