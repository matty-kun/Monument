"use client";

import { useState, useEffect, useMemo, Fragment, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";
import TimePickerDropdown from '../../../components/TimePickerDropdown';
import DatePickerDropdown from "../../../components/DatePickerDropdown";
import { formatTime } from "@/lib/utils";
import { FaTable, FaThLarge, FaClock, FaMapMarkerAlt, FaSearch, FaPlus, FaTrash, FaEdit, FaCalendarAlt } from "react-icons/fa";

interface Department {
  id: string;
  name: string;
  image_url?: string;
}

interface Event {
  id: string;
  name: string;
  icon?: string;
  category?: string | null;
  gender?: string | null;
  division?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Venue {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  event_id: string;
  venue_id: string;
  events: { name: string; icon: string | null; gender: string | null; division: string | null; } | null;
  venues: { name: string } | null;
  departments: string[];
  start_time: string;
  end_time: string;
  date: string;
  status: "upcoming" | "ongoing" | "finished";
}

const formatDate = (dateString: string) => {
  if (!dateString) return "TBA";
  const d = new Date(dateString + 'T00:00:00');
  if (isNaN(d.getTime())) return "TBA";
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [eventId, setEventId] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [venueId, setVenueId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [date, setDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isWholeDay, setIsWholeDay] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const getDynamicStatus = useCallback((schedule: Schedule) => {
    if (!schedule.date || !schedule.start_time || !schedule.end_time) return { status: "upcoming", label: "Upcoming", color: "bg-yellow-500", icon: "⏳" };
    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const end = new Date(`${schedule.date}T${schedule.end_time}`);
    if (isNaN(start.getTime())) return { status: "upcoming", label: "Upcoming", color: "bg-yellow-500", icon: "⏳" };
    if (now < start) return { status: "upcoming", label: "Upcoming", color: "bg-yellow-500", icon: "⏳" };
    if (now >= start && now <= end) return { status: "ongoing", label: "Live Now", color: "bg-green-500 animate-pulse", icon: "🔴" };
    return { status: "finished", label: "Finished", color: "bg-red-500", icon: "✅" };
  }, []);

  const fetchSchedules = useCallback(async () => {
    const { data, error } = await supabase.from("schedules").select(`*, start_time, end_time, events ( name, icon, gender, division ), venues ( name )`).order("date");
    if (!error && data) {
      const statusOrder: Record<string, number> = { ongoing: 1, upcoming: 2, finished: 3 };
      const sortedData = data.sort((a, b) => {
        const orderA = statusOrder[getDynamicStatus(a).status] || 4;
        const orderB = statusOrder[getDynamicStatus(b).status] || 4;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.date + "T" + a.start_time).getTime() - new Date(b.date + "T" + b.start_time).getTime();
      });
      setSchedules(sortedData);
    }
  }, [supabase, getDynamicStatus]);

  const fetchData = useCallback(async () => {
    const [deptRes, eventRes, venueRes, catRes] = await Promise.all([
      supabase.from("departments").select("id, name, image_url").order("name"),
      supabase.from("events").select("id, name, icon, category, gender, division").order("category,name"),
      supabase.from("venues").select("id, name").order("name"),
      supabase.from("categories").select("id, name").order("name")
    ]);
    if (!deptRes.error) setAllDepartments(deptRes.data);
    if (!eventRes.error) setAllEvents(eventRes.data);
    if (!venueRes.error) setAllVenues(venueRes.data);
    if (!catRes.error) setAllCategories(catRes.data);
  }, [supabase]);

  useEffect(() => {
    fetchSchedules();
    fetchData();
    document.title = "Manage Schedule | CITE FEST 2026";
    const channel = supabase.channel('schedules-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => fetchSchedules()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSchedules, fetchData, supabase]);

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || !venueId || !date) { toast.error("Missing required fields."); return; }
    const finalStartTime = isWholeDay ? "00:00" : startTime;
    const finalEndTime = isWholeDay ? "23:59" : endTime;
    try {
      const payload = { event_id: eventId, departments: selectedDepartments, venue_id: venueId, start_time: finalStartTime, end_time: finalEndTime, date };
      if (editingId) {
        const { error } = await supabase.from("schedules").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Schedule updated!");
      } else {
        const { error } = await supabase.from("schedules").insert([payload]);
        if (error) throw error;
        toast.success("Schedule added!");
      }
      resetForm();
      fetchSchedules();
    } catch (error: any) { toast.error(error.message); }
  }

  function resetForm() {
    setEventId(""); setSelectedDepartments([]); setVenueId(""); setStartTime(""); setEndTime(""); setDate(""); setIsWholeDay(false); setEditingId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleConfirmDelete() {
    if (!scheduleToDeleteId) return;
    const toastId = toast.loading("Deleting schedule...");
    try {
      const { error } = await supabase.from("schedules").delete().eq("id", scheduleToDeleteId);
      if (error) throw error;
      toast.success("Schedule deleted!", { id: toastId });
      fetchSchedules();
    } catch (error: any) {
      toast.error(`Deletion failed: ${error.message}`, { id: toastId });
    }
    setShowConfirmModal(false);
    setScheduleToDeleteId(null);
  }

  const formatEventName = useCallback((event: any) => {
    if (!event) return 'N/A';
    const parts = [event.name];
    if (event.division && event.division !== 'N/A') parts.push(`(${event.division})`);
    if (event.gender) parts.push(`- ${event.gender}`);
    return parts.join(' ');
  }, []);

  const groupedEvents = useMemo(() => {
    if (!allEvents.length || !allCategories.length) return [];
    const catMap = new Map(allCategories.map(c => [c.id, c.name]));
    const groups: any = allEvents.reduce((acc: any, ev) => {
      const cat = ev.category ? catMap.get(ev.category) || "Uncategorized" : "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ id: ev.id, name: formatEventName(ev) });
      return acc;
    }, {});
    return Object.entries(groups).map(([label, options]) => ({ label, options: options as { id: string, name: string }[] }));
  }, [allEvents, allCategories, formatEventName]);

  const filteredSchedules = useMemo(() => {
    if (!searchQuery) return schedules;
    const q = searchQuery.toLowerCase();
    return schedules.filter(s => formatEventName(s.events).toLowerCase().includes(q) || s.venues?.name.toLowerCase().includes(q) || s.departments.join(' ').toLowerCase().includes(q));
  }, [schedules, searchQuery, formatEventName]);

  const departmentMap = useMemo(() => new Map(allDepartments.map(d => [d.name, d])), [allDepartments]);

  return (
    <div className="w-full h-full dark:text-gray-200 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Schedule' }]} />
      </div>

      <div className="mb-4 shrink-0">
        <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight">{editingId ? 'Edit Schedule' : 'Manage Schedule'}</h1>
        <p className="text-sm text-gray-500 font-medium">Coordinate competition times, venues, and participating teams</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-4 h-full flex flex-col min-h-0 pb-2">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-100">{editingId ? 'Update Entry' : 'Schedule Entry Form'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative flex flex-col">
                <form onSubmit={handleAddOrUpdate} className="space-y-6 flex flex-col">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Competition Event</label>
                    <SingleSelectDropdown options={groupedEvents} selectedValue={eventId} onChange={setEventId} placeholder="Pick an event" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Competing Teams</label>
                    <MultiSelectDropdown options={allDepartments} selectedValues={selectedDepartments} onChange={(name) => setSelectedDepartments(prev => prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name])} placeholder="Select teams" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Location / Venue</label>
                    <SingleSelectDropdown options={allVenues.map(v => ({ id: v.id, name: v.name }))} selectedValue={venueId} onChange={setVenueId} placeholder="Pick a venue" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Competition Date</label>
                    <DatePickerDropdown value={date} onChange={setDate} />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Start Time</label>
                        <TimePickerDropdown value={startTime} onChange={setStartTime} disabled={isWholeDay} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">End Time</label>
                        <TimePickerDropdown value={endTime} onChange={setEndTime} disabled={isWholeDay} />
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-3 cursor-pointer group p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                       <input type="checkbox" checked={isWholeDay} onChange={(e) => setIsWholeDay(e.target.checked)} className="peer sr-only" />
                       <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 rounded-md peer-checked:bg-monument-primary peer-checked:border-monument-primary transition-all flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-sm scale-0 peer-checked:scale-100 transition-transform"></div>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">All Day Event</span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button type="submit" className="w-full bg-monument-primary hover:bg-monument-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95">
                      {editingId ? 'UPDATE SCHEDULE' : 'ADD TO SCHEDULE'}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold py-3 rounded-2xl hover:bg-gray-200 transition-colors">Cancel Edit</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
        </div>

        {/* RIGHT COLUMN: List */}
        <div className="lg:col-span-8 h-full flex flex-col min-h-0 pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm gap-4 shrink-0 mb-4">
               <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search by event, venue, or team..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium" />
               </div>
               <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl shrink-0">
                  <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-monument-primary' : 'text-gray-400'}`}><FaTable size={18}/></button>
                  <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-monument-primary' : 'text-gray-400'}`}><FaThLarge size={18}/></button>
               </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                  <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
                    <div className="overflow-y-auto custom-scrollbar overflow-x-auto relative flex-1">
                      <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700 space-y-0">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/20 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Event & Status</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Teams</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Time & Place</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filteredSchedules.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No schedules found</td></tr>
                        ) : filteredSchedules.map((s) => {
                          const status = getDynamicStatus(s);
                          return (
                            <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <span className="text-2xl">{s.events?.icon || '🏅'}</span>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight">{formatEventName(s.events)}</span>
                                    <span className={`inline-flex w-fit px-2 py-0.5 mt-1 rounded-md text-[9px] font-black uppercase text-white ${status.color}`}>{status.label}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {s.departments.map((dName, i) => {
                                    const d = departmentMap.get(dName);
                                    return (
                                      <Fragment key={i}>
                                        {d?.image_url ? <img src={d.image_url} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm" title={dName} /> : <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold" title={dName}>{dName.slice(0,2)}</div>}
                                        {i < s.departments.length - 1 && <span className="text-[10px] font-black text-monument-primary italic">vs</span>}
                                      </Fragment>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><FaClock size={10} /><span className="text-[11px] font-bold uppercase">{formatTime(s.start_time)} - {formatTime(s.end_time)}</span></div>
                                  <div className="flex items-center gap-2 text-gray-400"><FaMapMarkerAlt size={10} /><span className="text-[11px] font-bold uppercase">{s.venues?.name || 'TBA'}</span></div>
                                  <div className="flex items-center gap-2 text-monument-primary"><FaCalendarAlt size={10} /><span className="text-[11px] font-black uppercase">{formatDate(s.date)}</span></div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => { 
                                    setEditingId(s.id); setEventId(s.event_id); setSelectedDepartments(s.departments); setVenueId(s.venue_id); setStartTime(s.start_time.substring(0,5)); setEndTime(s.end_time.substring(0,5)); setIsWholeDay(s.start_time.startsWith("00:00") && s.end_time.startsWith("23:59")); setDate(s.date); window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                  }} className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all"><FaEdit /></button>
                                  <button onClick={() => { setScheduleToDeleteId(s.id); setShowConfirmModal(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><FaTrash /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar p-2 h-full">
                  {filteredSchedules.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-sm">No schedules found</div>
                  ) : filteredSchedules.map((s) => {
                    const status = getDynamicStatus(s);
                    return (
                      <div key={s.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group overflow-hidden">
                         <div className={`${status.color} px-6 py-2 flex justify-between items-center`}>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{status.label}</span>
                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{formatDate(s.date)}</span>
                         </div>
                         <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                               <span className="text-4xl">{s.events?.icon || '🏅'}</span>
                               <div className="flex-1">
                                  <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight leading-tight">{formatEventName(s.events)}</h4>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.venues?.name || 'TBA'}</p>
                               </div>
                            </div>
                            <div className="flex items-center justify-center gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl">
                               {s.departments.map((dName, i) => {
                                 const d = departmentMap.get(dName);
                                 return (
                                   <Fragment key={i}>
                                      <div className="flex flex-col items-center gap-1.5">
                                         {d?.image_url ? <img src={d.image_url} className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 shadow-md" /> : <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-black">{dName.slice(0,3)}</div>}
                                      </div>
                                      {i < s.departments.length - 1 && <span className="text-sm font-black text-monument-primary italic">VS</span>}
                                   </Fragment>
                                 );
                               })}
                            </div>
                            <div className="flex justify-between items-center pt-2">
                               <div className="flex items-center gap-2 text-gray-500 font-black text-[11px] uppercase tracking-wider"><FaClock className="text-monument-primary" /> {formatTime(s.start_time)} - {formatTime(s.end_time)}</div>
                               <div className="flex gap-2">
                                  <button onClick={() => { 
                                    setEditingId(s.id); setEventId(s.event_id); setSelectedDepartments(s.departments); setVenueId(s.venue_id); setStartTime(s.start_time.substring(0,5)); setEndTime(s.end_time.substring(0,5)); setIsWholeDay(s.start_time.startsWith("00:00") && s.end_time.startsWith("23:59")); setDate(s.date); window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                  }} className="w-8 h-8 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"><FaEdit size={12}/></button>
                                  <button onClick={() => { setScheduleToDeleteId(s.id); setShowConfirmModal(true); }} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"><FaTrash size={12}/></button>
                               </div>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
      />
      <Toaster />
    </div>
  );
}
