import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Schedule, ScheduleStatus } from "../models/scheduleTypes";
import { Department, Category } from "@/shared/models/tournamentTypes";

interface UseScheduleViewModelProps {
  initialSchedules: Schedule[];
  initialDepartments: Department[];
  initialCategories: Category[];
  initialMysteryMode?: boolean;
}

export const useScheduleViewModel = ({
  initialSchedules,
  initialDepartments,
  initialCategories,
  initialMysteryMode = false,
}: UseScheduleViewModelProps) => {
  const [mysteryMode, setMysteryMode] = useState(initialMysteryMode);
  const [schedules] = useState<Schedule[]>(initialSchedules);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>(initialSchedules);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<'all' | 'ongoing' | 'upcoming' | 'finished'>('all');
  const [showRefresh, setShowRefresh] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const supabase = createClient();

  // Supabase Realtime Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('public-schedules-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules' },
        () => setShowRefresh(true)
      )
      .subscribe();

    const mysterySub = supabase
      .channel('app_settings_schedule')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: "key=eq.mystery_mode" },
        (payload) => {
          if (payload.new && (payload.new as any).key === 'mystery_mode') {
            setMysteryMode((payload.new as any).value === 'true');
          } else if (payload.eventType === 'DELETE') {
            setMysteryMode(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(mysterySub);
    };
  }, [supabase]);

  const getDynamicStatus = useCallback((schedule: Schedule): { status: ScheduleStatus; label: string; color: string; icon: string } => {
    if (schedule.status === "finished") {
      return { status: "finished", label: "Finished", color: "bg-rose-500", icon: "🏁" };
    }
    if (!schedule.date || !schedule.start_time) {
      return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    }
    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const endStr = schedule.end_time ? `${schedule.end_date || schedule.date}T${schedule.end_time}` : null;
    const end = endStr ? new Date(endStr) : null;
    if (isNaN(start.getTime())) return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    if (now < start) return { status: "scheduled", label: "Upcoming", color: "bg-amber-500", icon: "⏳" };
    if (now >= start && (!end || now <= end)) return { status: "live", label: "Live Now", color: "bg-emerald-500 animate-pulse", icon: "🔴" };
    return { status: "finished", label: "Finished", color: "bg-rose-500", icon: "🏁" };
  }, []);

  const getCategoryName = useCallback((categoryId: string | { name: string } | null | undefined) => {
    if (!categoryId) return null;
    if (typeof categoryId === 'object' && categoryId !== null && 'name' in categoryId) return categoryId.name;
    return initialCategories.find(c => c.id === categoryId)?.name || null;
  }, [initialCategories]);

  const getDepartmentInfo = useCallback((d: Department | string): Department => {
    if (typeof d === 'string') {
      const matched = initialDepartments.find(dept => dept.name === d || dept.abbreviation === d);
      return (matched as Department) || { id: '', name: d, abbreviation: d, image_url: undefined };
    }
    return d as Department;
  }, [initialDepartments]);

  useEffect(() => {
    let filtered: Schedule[] = [...schedules];

    if (statusTab !== 'all') {
      filtered = filtered.filter(s => {
        const status = getDynamicStatus(s).status;
        if (statusTab === 'ongoing') return status === 'live';
        if (statusTab === 'upcoming') return status === 'scheduled';
        return status === 'finished';
      });
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const eventName = s.events?.name?.toLowerCase() || '';
        const departmentNames = s.departments.map(d => (typeof d === 'string' ? d.toLowerCase() : (d as Department).name.toLowerCase()));
        const categoryName = s.events?.category ? (typeof s.events.category === 'object' ? s.events.category.name.toLowerCase() : getCategoryName(s.events.category)?.toLowerCase() || '') : '';
        const venueName = s.venues?.name?.toLowerCase() || '';
        return eventName.includes(lowercasedQuery) || departmentNames.some(dn => dn.includes(lowercasedQuery)) || categoryName.includes(lowercasedQuery) || venueName.includes(lowercasedQuery);
      });
    }

    filtered.sort((a, b) => {
      const statA = getDynamicStatus(a).status;
      const statB = getDynamicStatus(b).status;

      const prioA = statA === 'live' ? 0 : statA === 'scheduled' ? 1 : 2;
      const prioB = statB === 'live' ? 0 : statB === 'scheduled' ? 1 : 2;

      if (prioA !== prioB) return prioA - prioB;

      const timeA = new Date(`${a.date}T${a.start_time}`).getTime();
      const timeB = new Date(`${b.date}T${b.start_time}`).getTime();
      const valA = isNaN(timeA) ? Infinity : timeA;
      const valB = isNaN(timeB) ? Infinity : timeB;

      if (valA !== valB) {
        if (prioA === 2) {
          return valB - valA;
        }
        return valA - valB;
      }
      
      const nameA = a.events?.name?.toLowerCase() || '';
      const nameB = b.events?.name?.toLowerCase() || '';
      if (nameA !== nameB) return nameA.localeCompare(nameB);

      const venueA = a.venues?.name?.toLowerCase() || '';
      const venueB = b.venues?.name?.toLowerCase() || '';
      return venueA.localeCompare(venueB);
    });

    setFilteredSchedules(filtered);
  }, [schedules, searchQuery, statusTab, getCategoryName, getDynamicStatus]);

  const refreshPage = () => {
    window.location.reload();
  };

  return {
    mysteryMode,
    filteredSchedules,
    searchQuery,
    setSearchQuery,
    statusTab,
    setStatusTab,
    showRefresh,
    refreshPage,
    isSearchFocused,
    setIsSearchFocused,
    getDynamicStatus,
    getDepartmentInfo,
    getCategoryName,
  };
};
