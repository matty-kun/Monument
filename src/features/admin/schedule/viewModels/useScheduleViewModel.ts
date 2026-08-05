import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import { AdminSchedule, ScheduleEvent, ScheduleVenue, ScheduleDepartment } from "../models/scheduleTypes";
import { Tournament } from "@/components/AdminTournamentProvider";

interface UseScheduleViewModelProps {
  selectedTournament: Tournament | null;
}

export const useScheduleViewModel = ({ selectedTournament }: UseScheduleViewModelProps) => {
  const [schedules, setSchedules] = useState<AdminSchedule[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [venues, setVenues] = useState<ScheduleVenue[]>([]);
  const [departments, setDepartments] = useState<ScheduleDepartment[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchQuery, setSearchQuery] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [eventId, setEventId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isWholeDay, setIsWholeDay] = useState(false);

  // Result Modal states
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMatch, setResultMatch] = useState<AdminSchedule | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  // 3-team medal assignment states
  const [medalGoldId, setMedalGoldId] = useState<string | null>(null);
  const [medalSilverId, setMedalSilverId] = useState<string | null>(null);
  const [medalBronzeId, setMedalBronzeId] = useState<string | null>(null);

  // Deletion Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSchedules = useCallback(async () => {
    if (!selectedTournament) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("schedules")
      .select(`
        *,
        events (*),
        venues (*)
      `)
      .eq("tournament_id", selectedTournament.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    
    if (error) toast.error("Failed to fetch schedules");
    else setSchedules(data || []);
    setLoading(false);
  }, [supabase, selectedTournament]);

  const fetchData = useCallback(async () => {
    if (!selectedTournament) return;
    const [eventsRes, venuesRes, deptsRes, catRes] = await Promise.all([
      supabase.from("events").select("*").eq("tournament_id", selectedTournament.id).order("name"),
      supabase.from("venues").select("*").order("name"),
      supabase.from("tournament_departments").select("id:department_id, name, abbreviation, image_url").eq("tournament_id", selectedTournament.id).order("name"),
      supabase.from("categories").select("id, name")
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (venuesRes.data) setVenues(venuesRes.data);
    if (deptsRes.data) setDepartments(deptsRes.data as any[]);
    if (catRes.data) setCategories(catRes.data);
  }, [supabase, selectedTournament]);

  useEffect(() => {
    if (selectedTournament) {
      fetchSchedules();
      fetchData();
      document.title = `Manage Schedule | ${selectedTournament.name}`;
    }
  }, [fetchSchedules, fetchData, selectedTournament]);

  const departmentMap = useMemo(() => new Map(departments.map(d => [d.name, d])), [departments]);
  const departmentIdMap = useMemo(() => new Map(departments.map(d => [d.id, d])), [departments]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const eventName = s.events?.name?.toLowerCase() || '';
      const venueName = s.venues?.name?.toLowerCase() || '';
      const depts = s.departments.join(' ').toLowerCase();
      const q = searchQuery.toLowerCase();
      return eventName.includes(q) || venueName.includes(q) || depts.includes(q);
    });
  }, [schedules, searchQuery]);

  const groupedEvents = useMemo(() => {
    return events.reduce((acc, ev) => {
      let categoryName = 'Uncategorized';
      if (typeof ev.category === 'object' && ev.category) {
        categoryName = ev.category.name;
      } else if (typeof ev.category === 'string') {
        categoryName = categories.find(c => c.id === ev.category)?.name || 'Uncategorized';
      }
      
      const cat = categoryName;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ ...ev, icon: ev.icon });
      return acc;
    }, {} as Record<string, any[]>);
  }, [events, categories]);

  const eventOptions = useMemo(() => {
    return Object.entries(groupedEvents).map(([cat, evs]) => ({
      label: cat,
      options: evs.map(ev => ({
        id: ev.id,
        name: ev.name,
        icon: ev.icon
      }))
    }));
  }, [groupedEvents]);

  const venueOptions = useMemo(() => {
    return venues.map(v => ({
      id: v.id,
      name: v.name,
      icon: "📍"
    }));
  }, [venues]);

  async function handleSaveSchedule() {
    if (!eventId || !venueId || !date) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    const payload = {
      event_id: eventId,
      venue_id: venueId,
      date,
      end_date: endDate || date,
      start_time: isWholeDay ? "00:00:00" : `${startTime}:00`,
      end_time: isWholeDay ? "23:59:59" : endTime ? `${endTime}:00` : null,
      departments: selectedDepartments,
      status: 'scheduled' as const,
      tournament_id: selectedTournament?.id
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("schedules").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Schedule updated!");
      } else {
        const { error } = await supabase.from("schedules").insert([payload]);
        if (error) throw error;
        toast.success("Schedule created!");
      }
      closeModal();
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSchedule() {
    if (!scheduleToDeleteId) return;
    try {
      const { error } = await supabase.from("schedules").delete().eq("id", scheduleToDeleteId);
      if (error) throw error;
      toast.success("Schedule deleted");
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setShowConfirmModal(false);
      setScheduleToDeleteId(null);
    }
  }

  async function handleResetMatch(id: string) {
    const toastId = toast.loading("Resetting match match...");
    try {
      const { error } = await supabase.from("schedules").update({ 
        status: 'scheduled',
        winner_id: null,
        score_a: null,
        score_b: null
      }).eq("id", id);
      if (error) throw error;
      toast.success("Match has been reset to upcoming!", { id: toastId });
      fetchSchedules();
    } catch (error: any) {
      toast.error(`Reset failed: ${error.message}`, { id: toastId });
    }
  }

  async function handleSaveResult() {
    if (!resultMatch) return;
    const is3Team = resultMatch.departments.length >= 3;

    setIsSubmittingResult(true);
    const toastId = toast.loading(is3Team ? "Recording medals & finishing match..." : "Saving match result...");
    try {
      if (is3Team) {
        const { error: schedError } = await supabase
          .from("schedules")
          .update({ status: 'finished', winner_id: medalGoldId })
          .eq("id", resultMatch.id);
        if (schedError) throw schedError;

        await supabase.from('results').delete().eq('event_id', resultMatch.event_id);

        const resultsBatch: { event_id: string; department_id: string | null; medal_type: string; points: number, tournament_id: string }[] = [];
        if (medalGoldId !== null && medalGoldId !== 'awaiting') resultsBatch.push({ event_id: resultMatch.event_id, department_id: medalGoldId === '' ? null : medalGoldId, medal_type: 'gold', points: medalGoldId === '' ? 0 : 200, tournament_id: selectedTournament!.id });
        if (medalSilverId !== null && medalSilverId !== 'awaiting') resultsBatch.push({ event_id: resultMatch.event_id, department_id: medalSilverId === '' ? null : medalSilverId, medal_type: 'silver', points: medalSilverId === '' ? 0 : 150, tournament_id: selectedTournament!.id });
        if (medalBronzeId !== null && medalBronzeId !== 'awaiting') resultsBatch.push({ event_id: resultMatch.event_id, department_id: medalBronzeId === '' ? null : medalBronzeId, medal_type: 'bronze', points: medalBronzeId === '' ? 0 : 100, tournament_id: selectedTournament!.id });

        if (resultsBatch.length > 0) {
          const { error: resError } = await supabase.from('results').insert(resultsBatch);
          if (resError) throw resError;
        }

        toast.success("Match finished & medals recorded!", { id: toastId });
      } else {
        const { error } = await supabase
          .from("schedules")
          .update({
            winner_id: winnerId,
            score_a: scoreA,
            score_b: scoreB,
            status: 'finished'
          })
          .eq("id", resultMatch.id);
        if (error) throw error;
        toast.success("Match result recorded!", { id: toastId });
      }

      setShowResultModal(false);
      fetchSchedules();
    } catch (error: any) {
      toast.error(`Save failed: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmittingResult(false);
    }
  }

  async function openResultModal(schedule: AdminSchedule) {
    setResultMatch(schedule);
    setWinnerId(schedule.winner_id);
    setScoreA(schedule.score_a || 0);
    setScoreB(schedule.score_b || 0);
    
    setMedalGoldId(null);
    setMedalSilverId(null);
    setMedalBronzeId(null);

    if (schedule.departments.length >= 3) {
      const { data } = await supabase
        .from('results')
        .select('medal_type, department_id')
        .eq('event_id', schedule.event_id);

      if (data) {
        const gold = data.find(r => r.medal_type === 'gold');
        const silver = data.find(r => r.medal_type === 'silver');
        const bronze = data.find(r => r.medal_type === 'bronze');
        if (gold) setMedalGoldId(gold.department_id || '');
        if (silver) setMedalSilverId(silver.department_id || '');
        if (bronze) setMedalBronzeId(bronze.department_id || '');
      }
    }

    setShowResultModal(true);
  }

  const getDynamicStatus = (schedule: AdminSchedule) => {
    if (schedule.status === 'finished') return { label: 'Finished', color: 'bg-rose-500', status: 'finished' };
    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const endStr = schedule.end_time ? `${schedule.end_date || schedule.date}T${schedule.end_time}` : null;
    const end = endStr ? new Date(endStr) : null;
    if (now >= start && (!end || now <= end)) return { label: 'Live Now', color: 'bg-emerald-500 animate-pulse', status: 'live' };
    if (end && now > end) return { label: 'Finished', color: 'bg-rose-500', status: 'finished' };
    return { label: 'Upcoming', color: 'bg-amber-500', status: 'scheduled' };
  };

  const closeModal = () => {
    setShowFormModal(false);
    setEditingId(null);
    setEventId("");
    setVenueId("");
    setSelectedDepartments([]);
    setDate("");
    setEndDate(null);
    setStartTime("08:00");
    setEndTime("");
    setIsWholeDay(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  const formatEventName = (ev: ScheduleEvent | null) => {
    if (!ev || !ev.name) return "N/A";
    return ev.name.length > 25 ? ev.name.substring(0, 25) + '...' : ev.name;
  };

  return {
    schedules,
    events,
    venues,
    departments,
    categories,
    loading,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    showFormModal,
    setShowFormModal,
    isSubmitting,
    editingId,
    setEditingId,
    eventId,
    setEventId,
    venueId,
    setVenueId,
    date,
    setDate,
    endDate,
    setEndDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    selectedDepartments,
    setSelectedDepartments,
    isWholeDay,
    setIsWholeDay,
    showResultModal,
    setShowResultModal,
    resultMatch,
    setResultMatch,
    winnerId,
    setWinnerId,
    scoreA,
    setScoreA,
    scoreB,
    setScoreB,
    isSubmittingResult,
    medalGoldId,
    setMedalGoldId,
    medalSilverId,
    setMedalSilverId,
    medalBronzeId,
    setMedalBronzeId,
    showConfirmModal,
    setShowConfirmModal,
    scheduleToDeleteId,
    setScheduleToDeleteId,
    departmentMap,
    filteredSchedules,
    eventOptions,
    venueOptions,
    handleSaveSchedule,
    handleDeleteSchedule,
    handleResetMatch,
    handleSaveResult,
    openResultModal,
    getDynamicStatus,
    closeModal,
    formatDate,
    formatEventName,
  };
};
