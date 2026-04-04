"use client";

import { useEffect, useState, useMemo, useCallback, Fragment } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar,
  Settings2,
  X,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { formatTime } from "@/lib/utils";
import SingleSelectDropdown from "@/components/SingleSelectDropdown";
import DatePickerDropdown from "@/components/DatePickerDropdown";
import TimePickerDropdown from "@/components/TimePickerDropdown";

// --- Types ---
interface Department {
  id: string;
  name: string;
  abbreviation: string;
  image_url: string | null;
}

interface Event {
  id: string;
  name: string;
  icon: string | null;
  category: { id: string; name: string } | string | null;
}

interface Venue {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  event_id: string;
  venue_id: string;
  departments: string[];
  start_time: string;
  end_time: string;
  date: string;
  status: "scheduled" | "live" | "finished";
  winner_id: string | null;
  score_a: number | null;
  score_b: number | null;
  events: Event | null;
  venues: Venue | null;
  end_date: string | null;
}

// --- Icons / Components ---
const FaClock = ({ size }: { size?: number }) => <Clock size={size || 14} />;
const FaMapMarkerAlt = ({ size }: { size?: number }) => <MapPin size={size || 14} />;
const FaCalendarAlt = ({ size }: { size?: number }) => <Calendar size={size || 14} />;
const FaTrash = () => <Trash2 size={14} />;
const FaEdit = () => <Settings2 size={14} />;
const FaCheck = ({ size }: { size?: number }) => <CheckCircle2 size={size || 14} />;

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
  const [endTime, setEndTime] = useState("09:00");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isWholeDay, setIsWholeDay] = useState(false);

  // Result Modal states
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMatch, setResultMatch] = useState<Schedule | null>(null);
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
    setLoading(true);
    const { data, error } = await supabase
      .from("schedules")
      .select(`
        *,
        events (*),
        venues (*)
      `)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    
    if (error) toast.error("Failed to fetch schedules");
    else setSchedules(data || []);
    setLoading(false);
  }, [supabase]);

  const fetchData = useCallback(async () => {
    const [eventsRes, venuesRes, deptsRes, catRes] = await Promise.all([
      supabase.from("events").select("*").order("name"),
      supabase.from("venues").select("*").order("name"),
      supabase.from("departments").select("*").order("name"),
      supabase.from("categories").select("id, name")
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (venuesRes.data) setVenues(venuesRes.data);
    if (deptsRes.data) setDepartments(deptsRes.data);
    if (catRes.data) setCategories(catRes.data);
  }, [supabase]);

  useEffect(() => {
    fetchSchedules();
    fetchData();
  }, [fetchSchedules, fetchData]);

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
    if (!eventId || !venueId || !date || selectedDepartments.length < 1) {
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
      end_time: isWholeDay ? "23:59:59" : `${endTime}:00`,
      departments: selectedDepartments,
      status: 'scheduled' as const
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
        // 3-team: update schedule status to finished
        const { error: schedError } = await supabase
          .from("schedules")
          .update({ status: 'finished', winner_id: medalGoldId })
          .eq("id", resultMatch.id);
        if (schedError) throw schedError;

        // Auto-link: delete existing results for this event, then insert medals
        await supabase.from('results').delete().eq('event_id', resultMatch.event_id);

        const resultsBatch: { event_id: string; department_id: string | null; medal_type: string; points: number }[] = [];
        if (medalGoldId !== null && medalGoldId !== 'awaiting') resultsBatch.push({ event_id: resultMatch.event_id, department_id: medalGoldId === '' ? null : medalGoldId, medal_type: 'gold', points: medalGoldId === '' ? 0 : 200 });
        if (medalSilverId !== null && medalSilverId !== 'awaiting') resultsBatch.push({ event_id: resultMatch.event_id, department_id: medalSilverId === '' ? null : medalSilverId, medal_type: 'silver', points: medalSilverId === '' ? 0 : 150 });
        if (medalBronzeId !== null && medalBronzeId !== 'awaiting') resultsBatch.push({ event_id: resultMatch.event_id, department_id: medalBronzeId === '' ? null : medalBronzeId, medal_type: 'bronze', points: medalBronzeId === '' ? 0 : 100 });

        if (resultsBatch.length > 0) {
          const { error: resError } = await supabase.from('results').insert(resultsBatch);
          if (resError) throw resError;
        }

        toast.success("Match finished & medals recorded!", { id: toastId });
      } else {
        // 2-team: existing behavior (schedule-only)
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

  function openResultModal(schedule: Schedule) {
    setResultMatch(schedule);
    setWinnerId(schedule.winner_id);
    setScoreA(schedule.score_a || 0);
    setScoreB(schedule.score_b || 0);
    // Reset 3-team medal state
    setMedalGoldId(null);
    setMedalSilverId(null);
    setMedalBronzeId(null);
    setShowResultModal(true);
  }

  const getDynamicStatus = (schedule: Schedule) => {
    if (schedule.status === 'finished') return { label: 'Finished', color: 'bg-rose-500', status: 'finished' };
    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const end = new Date(`${schedule.end_date || schedule.date}T${schedule.end_time}`);
    if (now >= start && now <= end) return { label: 'Live Now', color: 'bg-emerald-500 animate-pulse', status: 'live' };
    if (now > end) return { label: 'Finished', color: 'bg-rose-500', status: 'finished' };
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
    setEndTime("09:00");
    setIsWholeDay(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  const formatEventName = (ev: Event | null) => {
    if (!ev) return "N/A";
    return ev.name.length > 25 ? ev.name.substring(0, 25) + '...' : ev.name;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Header / Search Area */}
      <div className="flex-none p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-monument-primary uppercase tracking-tight">Admin Control Center</h1>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Schedules & Competition Management</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { closeModal(); setShowFormModal(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-monument-primary hover:bg-monument-primary/95 text-white rounded-[1.2rem] shadow-xl shadow-monument-primary/20 transition-all text-xs font-black uppercase tracking-widest"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Create Schedule</span>
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-monument-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Quick find events, teams, or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-transparent focus:border-monument-primary/20 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-20 lg:pb-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <div className="w-12 h-12 border-4 border-monument-primary border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Tournament Data...</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
              {filteredSchedules.map((s) => {
                const dynStatus = getDynamicStatus(s);
                return (
                  <div key={s.id} className="h-fit bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300">
                    <div className={`${dynStatus.color} px-8 py-2.5 flex justify-between items-center text-white`}>
                      <span className="text-[10px] font-black uppercase tracking-widest">{dynStatus.label}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{s.end_date && s.end_date !== s.date ? `${formatDate(s.date)} — ${formatDate(s.end_date)}` : formatDate(s.date)}</span>
                    </div>

                    <div className="p-6 space-y-4 flex-1">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl drop-shadow-sm">{s.events?.icon || '🏅'}</span>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight truncate">{formatEventName(s.events)}</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {typeof s.events?.category === 'object' && s.events.category ? s.events.category.name : categories.find(c => c.id === s.events?.category)?.name || ''}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50/50 dark:bg-gray-900/40 rounded-[2rem] p-4 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-around gap-2 relative">
                          {s.departments.map((dName, i) => {
                            const d = departmentMap.get(dName);
                            const isWinner = d && s.winner_id === d.id;
                            return (
                              <Fragment key={i}>
                                <div className="flex flex-col items-center gap-2 relative">
                                  {isWinner && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-3 -right-1 z-10 w-6 h-6 flex items-center justify-center text-sm drop-shadow-md">
                                      🏆
                                    </motion.div>
                                  )}
                                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-black border-4 shadow-xl transition-all ${isWinner ? 'bg-yellow-400 text-yellow-900 border-yellow-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-white dark:border-gray-800'}`}>
                                    {d?.image_url ? (
                                      <img src={d.image_url} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      dName.slice(0, 3).toUpperCase()
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${isWinner ? 'text-yellow-600' : 'text-gray-400'}`}>
                                    {d?.abbreviation || dName.slice(0,3)}
                                  </span>
                                </div>
                                {i < s.departments.length - 1 && <span className="text-[10px] font-black text-gray-200 dark:text-gray-700 italic opacity-20">vs</span>}
                              </Fragment>
                            );
                          })}
                        </div>
                        
                        {s.status === 'finished' && (Number(s.score_a) > 0 || Number(s.score_b) > 0) && (
                          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 font-black text-2xl italic text-gray-900 dark:text-gray-100">
                            <span className={s.winner_id === (departmentMap.get(s.departments[0])?.id) ? 'text-emerald-500' : 'opacity-30'}>{s.score_a || 0}</span>
                            <span className="text-gray-200">—</span>
                            <span className={s.winner_id === (departmentMap.get(s.departments[1])?.id) ? 'text-emerald-500' : 'opacity-30'}>{s.score_b || 0}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-3 text-gray-500">
                          <Clock size={16} className="shrink-0" />
                          <span className="text-[11px] font-bold uppercase tracking-widest">
                             {s.start_time.startsWith("00:00") && s.end_time.startsWith("23:59") ? "All Day Event" : `${formatTime(s.start_time)} — ${formatTime(s.end_time)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                          <MapPin size={16} className="shrink-0" />
                          <span className="text-[11px] font-bold uppercase tracking-widest truncate">{s.venues?.name || 'TBA'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-gray-900/40 px-8 py-3.5 border-t border-gray-100 dark:border-gray-700/50 flex justify-end items-center gap-3">
                       {dynStatus.status !== 'finished' ? (
                         <button onClick={() => openResultModal(s)} className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border border-emerald-100" title="Finish Match & Pick Winner">
                           <FaCheck size={14} />
                         </button>
                       ) : (
                         <button onClick={() => handleResetMatch(s.id)} className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all" title="Reset Match Status">
                           <span className="text-sm">🔄</span>
                         </button>
                       )}
                       <button onClick={() => openResultModal(s)} className="w-9 h-9 bg-monument-primary/5 text-monument-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all" title="Manage Result">
                         <span className="text-sm">🏆</span>
                       </button>
                       <button onClick={() => { 
                         setEditingId(s.id); setEventId(s.event_id); setSelectedDepartments(s.departments); setVenueId(s.venue_id); setStartTime(s.start_time.substring(0,5)); setEndTime(s.end_time.substring(0,5)); setIsWholeDay(s.start_time.startsWith("00:00") && s.end_time.startsWith("23:59")); setDate(s.date); if (s.end_date) setEndDate(s.end_date); setShowFormModal(true); 
                       }} className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 text-yellow-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border border-yellow-100"><FaEdit /></button>
                       <button onClick={() => { setScheduleToDeleteId(s.id); setShowConfirmModal(true); }} className="w-9 h-9 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border border-rose-100"><FaTrash /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Control Modal (Form) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl shadow-monument-primary/10">
              <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700/50">
                <div>
                  <h2 className="text-gray-900 dark:text-gray-100 font-black text-xl uppercase tracking-tight">{editingId ? 'Edit Schedule' : 'Create New Schedule'}</h2>
                </div>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95"><X size={16} strokeWidth={3} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Events</label>
                    <SingleSelectDropdown 
                      options={eventOptions}
                      selectedValue={eventId}
                      onChange={setEventId}
                      placeholder="SELECT EVENT"
                      dropDirection="down"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tournament Venue</label>
                    <SingleSelectDropdown 
                      options={venueOptions}
                      selectedValue={venueId}
                      onChange={setVenueId}
                      placeholder="SELECT VENUE"
                      dropDirection="down"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Competing Departments</label>
                    <span className={`text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full ${selectedDepartments.length >= 2 ? 'bg-monument-primary/10 text-monument-primary' : 'bg-gray-100 text-gray-400'}`}>{selectedDepartments.length}/3 selected</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {departments.map((d) => {
                      const isSelected = selectedDepartments.includes(d.name);
                      return (
                        <button key={d.id} onClick={() => { setSelectedDepartments(prev => isSelected ? prev.filter(x => x !== d.name) : (prev.length < 3 ? [...prev, d.name] : prev)); }} className={`flex flex-col items-center p-2 rounded-2xl transition-all border-2 ${isSelected ? 'border-monument-primary bg-monument-primary/5 shadow-md scale-105' : selectedDepartments.length >= 3 ? 'border-transparent bg-gray-50 dark:bg-gray-900/50 grayscale opacity-30 cursor-not-allowed' : 'border-transparent bg-gray-50 dark:bg-gray-900/50 grayscale opacity-60 hover:opacity-100'}`}>
                          {d.image_url ? <img src={d.image_url} className="w-8 h-8 rounded-full mb-1" /> : <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full mb-1" />}
                          <span className="text-[8px] font-black uppercase truncate w-full text-center">{d.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
                    <DatePickerDropdown value={date} onChange={setDate} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Date <span className="text-gray-300 normal-case font-medium">(optional)</span></label>
                    <DatePickerDropdown value={endDate || ''} onChange={(val) => setEndDate(val || null)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Window</label>
                    <button onClick={() => setIsWholeDay(!isWholeDay)} className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full transition-all ${isWholeDay ? 'bg-monument-primary text-white ring-2 ring-monument-primary/30' : 'bg-gray-100 text-gray-400'}`}>Whole Day</button>
                  </div>
                  {!isWholeDay ? (
                    <div className="flex items-center gap-2">
                       <div className="flex-1">
                        <TimePickerDropdown value={startTime} onChange={setStartTime} />
                      </div>
                      <span className="text-[9px] font-black text-gray-300">TO</span>
                      <div className="flex-1">
                        <TimePickerDropdown value={endTime} onChange={setEndTime} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full py-3 bg-monument-primary/5 border-2 border-dashed border-monument-primary/20 rounded-2xl flex items-center justify-center text-[9px] font-black text-monument-primary uppercase tracking-widest">Whole Day Match Window</div>
                  )}
                </div>

                <div className="pt-4">
                  <button onClick={handleSaveSchedule} disabled={isSubmitting} className="w-full bg-monument-primary text-white py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-monument-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editingId ? (<span>Update Record</span>) : (<span>Deploy Schedule</span>)}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result Recording Modal */}
      <AnimatePresence>
        {showResultModal && resultMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowResultModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">

              {resultMatch.departments.length >= 3 ? (
                /* ═══ 3-TEAM MEDAL ASSIGNMENT MODAL ═══ */
                <>
                  <div className="bg-monument-primary px-8 py-5 flex justify-between items-center">
                    <div>
                      <h2 className="text-white font-black text-sm uppercase tracking-[0.1em]">Assign Medals</h2>
                      <p className="text-white/60 text-[10px] font-bold tracking-tight uppercase">{resultMatch.events?.name} — Auto-links to Results</p>
                    </div>
                    <button onClick={() => setShowResultModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-2xl border border-violet-100 dark:border-violet-900/30 flex items-center gap-3">
                      <AlertCircle className="text-monument-primary shrink-0" size={16} />
                      <span className="text-[9px] font-bold text-monument-primary dark:text-violet-300 uppercase tracking-tight">3-team match — medals will be auto-saved to the Results page & Podium.</span>
                    </div>

                    {(['gold', 'silver', 'bronze'] as const).map((medal) => {
                      const medalIcon = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉';
                      const medalLabel = medal === 'gold' ? 'Gold' : medal === 'silver' ? 'Silver' : 'Bronze';
                      const currentId = medal === 'gold' ? medalGoldId : medal === 'silver' ? medalSilverId : medalBronzeId;
                      const setter = medal === 'gold' ? setMedalGoldId : medal === 'silver' ? setMedalSilverId : setMedalBronzeId;
                      const otherIds = [medalGoldId, medalSilverId, medalBronzeId].filter((_, idx) => idx !== ['gold', 'silver', 'bronze'].indexOf(medal));

                      return (
                        <div key={medal} className="flex items-center gap-4">
                          <span className="text-3xl w-10 flex justify-center shrink-0">{medalIcon}</span>
                          <div className="flex-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">{medalLabel}</label>
                            <div className="flex gap-2 flex-wrap">
                              {/* No Team option */}
                              <button
                                onClick={() => setter(currentId === '' ? null : '')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${
                                  currentId === ''
                                    ? 'border-monument-primary bg-violet-50 dark:bg-violet-900/30 text-monument-primary scale-105 shadow-md'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-900/30 text-gray-400 hover:border-gray-200 hover:bg-white'
                                }`}
                              >
                                <span className="text-sm">✖️</span> No Team
                              </button>
                              {/* Awaiting option */}
                              <button
                                onClick={() => setter(currentId === 'awaiting' ? null : 'awaiting')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${
                                  currentId === 'awaiting'
                                    ? 'border-monument-primary bg-violet-50 dark:bg-violet-900/30 text-monument-primary scale-105 shadow-md'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-900/30 text-gray-400 hover:border-gray-200 hover:bg-white'
                                }`}
                              >
                                <span className="text-sm">⏳</span> Awaiting
                              </button>
                              {/* Team options */}
                              {resultMatch.departments.map((dName) => {
                                const d = departmentMap.get(dName);
                                if (!d) return null;
                                const isSelected = currentId === d.id;
                                const isTaken = otherIds.includes(d.id);
                                return (
                                  <button
                                    key={d.id}
                                    onClick={() => !isTaken && setter(isSelected ? null : d.id)}
                                    disabled={isTaken}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${
                                      isSelected
                                        ? 'border-monument-primary bg-violet-50 dark:bg-violet-900/30 text-monument-primary scale-105 shadow-md'
                                        : isTaken
                                        ? 'border-transparent bg-gray-50 dark:bg-gray-900/30 text-gray-300 opacity-40 cursor-not-allowed'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-900/30 text-gray-600 hover:border-gray-200 hover:bg-white'
                                    }`}
                                  >
                                    {d.image_url ? (
                                      <img src={d.image_url} className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px]">{d.abbreviation?.slice(0,2)}</div>
                                    )}
                                    {d.abbreviation || dName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!medalGoldId && medalGoldId !== '' && medalGoldId !== 'awaiting' && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={16} />
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight">Assign at least Gold to finalize.</span>
                      </div>
                    )}

                    <div className="flex gap-4 pt-2">
                      <button onClick={() => setShowResultModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-all">Cancel</button>
                      <button onClick={handleSaveResult} disabled={isSubmittingResult || (medalGoldId === null)} className="flex-[2] py-4 bg-monument-primary text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-monument-primary/20 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale">
                        Finalize Medals
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* ═══ 2-TEAM WINNER PICKER MODAL ═══ */
                <>
                  <div className="bg-monument-primary px-8 py-5 flex justify-between items-center">
                    <div>
                      <h2 className="text-white font-black text-sm uppercase tracking-[0.1em]">Record Winner & Outcome</h2>
                      <p className="text-white/60 text-[10px] font-bold tracking-tight uppercase">{resultMatch.events?.name} - Final Score</p>
                    </div>
                    <button onClick={() => setShowResultModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                  </div>

                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-around gap-6">
                      {resultMatch.departments.map((dName, i) => {
                        const d = departmentMap.get(dName);
                        const isSelected = winnerId === d?.id;
                        return (
                          <div key={i} className="flex flex-col items-center gap-4">
                            <button onClick={() => d && setWinnerId(d.id)} className={`group relative w-24 h-24 rounded-full p-1 transition-all duration-500 ${isSelected ? 'ring-8 ring-monument-primary/20 scale-110' : 'ring-2 ring-gray-100 dark:ring-gray-700 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}>
                              <div className={`w-full h-full rounded-full overflow-hidden border-4 shadow-xl ${isSelected ? 'border-monument-primary' : 'border-white dark:border-gray-800'}`}>
                                {d?.image_url ? <img src={d.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center font-black text-xl">{dName.slice(0,2)}</div>}
                              </div>
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-monument-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-4 border-white font-black">
                                  🏆
                                </motion.div>
                              )}
                            </button>
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-monument-primary' : 'text-gray-400'}`}>{d?.abbreviation || dName}</span>
                              <input type="number" value={i === 0 ? scoreA : scoreB} onChange={(e) => i === 0 ? setScoreA(parseInt(e.target.value) || 0) : setScoreB(parseInt(e.target.value) || 0)} placeholder="SCORE" className="w-20 text-center bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl mt-3 font-black text-2xl py-2 focus:ring-2 focus:ring-monument-primary/30" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!winnerId && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={18} />
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">You must pick a championship winner to finalize the result.</span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button onClick={() => setShowResultModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-all">Cancel</button>
                      <button onClick={handleSaveResult} disabled={isSubmittingResult || !winnerId} className="flex-[2] py-4 bg-monument-primary text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-monument-primary/20 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale">
                        Deploy Final Result
                      </button>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-500/5">
                <Trash2 size={28} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-gray-900 dark:text-white font-black uppercase tracking-tight text-lg">Erase match record?</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This action is permanent and will remove the schedule from all views.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">Abort</button>
                <button onClick={handleDeleteSchedule} className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">Delete Forever</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
