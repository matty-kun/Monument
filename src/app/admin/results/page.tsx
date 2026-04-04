"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";

interface Department {
  id: string;
  name: string;
  abbreviation?: string | null;
  image_url?: string;
}
interface Event {
  id: string;
  name: string;
  icon?: string;
  category?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ResultWithDepartment {
  id: string;
  event_id: string;
  department_id: string;
  medal_type: 'gold' | 'silver' | 'bronze' | 'none';
  departments: Department | Department[] | null;
}

export default function AddResultPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [competingDepartments, setCompetingDepartments] = useState<Department[]>([]);
  const [eventId, setEventId] = useState("");
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [goldId, setGoldId] = useState("");
  const [silverId, setSilverId] = useState("");
  const [bronzeId, setBronzeId] = useState("");
  const [currentEventResults, setCurrentEventResults] = useState<ResultWithDepartment[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultToDeleteId, setResultToDeleteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<ResultWithDepartment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const fetchDropdownData = useCallback(async () => {
    const { data: deptData } = await supabase
      .from("departments")
      .select("id, name, image_url")
      .not("name", "ilike", "No Team")
      .not("name", "ilike", "No Participant");
    const { data: eventData } = await supabase.from("events").select("id, name, icon, category").order("category,name");
    const { data: categoriesData } = await supabase.from("categories").select("id, name");
    if (deptData) setDepartments(deptData);
    if (eventData) setEvents(eventData);
    if (categoriesData) setAllCategories(categoriesData);

    // Fetch recent results
    const { data: recentData } = await supabase
      .from('results')
      .select('id, event_id, department_id, medal_type, departments (id, name, image_url, abbreviation)')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (recentData) setRecentResults(recentData as ResultWithDepartment[]);
  }, [supabase]);

  useEffect(() => {
    fetchDropdownData();
    document.title = "Manage Results | CITE FEST 2026";
  }, [fetchDropdownData]);

  const fetchEventData = useCallback(async (currentEventId?: string) => {
    const idToFetch = currentEventId || eventId;
    if (!idToFetch) {
      setCurrentEventResults([]);
      return;
    }

    // Fetch both schedule for competing depts and existing results for this event
    const [scheduleRes, resultsRes] = await Promise.all([
      supabase.from('schedules').select('departments').eq('event_id', idToFetch).single(),
      supabase.from('results').select('id, event_id, department_id, medal_type, departments (id, name, image_url, abbreviation)').eq('event_id', idToFetch)
    ]);

    const { data: schedule, error: scheduleError } = scheduleRes;
    const { data: existingResults, error: resultsError } = resultsRes;

    if (resultsError) {
      console.error("Error fetching existing results:", resultsError);
    } else if (existingResults) {
      setCurrentEventResults(existingResults as ResultWithDepartment[]);
      
      // Pre-fill podium from existing results
      const gold = (existingResults as ResultWithDepartment[]).find(r => r.medal_type === 'gold');
      const silver = (existingResults as ResultWithDepartment[]).find(r => r.medal_type === 'silver');
      const bronze = (existingResults as ResultWithDepartment[]).find(r => r.medal_type === 'bronze');
      
      setGoldId(gold ? (gold.department_id || "") : "awaiting");
      setSilverId(silver ? (silver.department_id || "") : "awaiting");
      setBronzeId(bronze ? (bronze.department_id || "") : "awaiting");
    }

    const awardedDeptIds = new Set((existingResults || []).map(r => r.department_id));

    let availableDepts: Department[];
    if (scheduleError || !schedule || !schedule.departments) {
      console.warn(`No schedule found for event ID: ${idToFetch}. Showing all departments.`);
      availableDepts = departments;
      setCompetingDepartments(availableDepts);
    } else {
      const competingDeptNames = schedule.departments as string[];
      availableDepts = departments.filter(dept => competingDeptNames.includes(dept.name));
      setCompetingDepartments(availableDepts);
    }
  }, [supabase, eventId, departments]);

  useEffect(() => {
    fetchEventData();

    // ✅ Set up Realtime Subscription
    const channel = supabase
      .channel('results-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'results',
        },
        () => {
          fetchEventData(); 
          fetchDropdownData(); // Also refresh history
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEventData, fetchDropdownData, supabase]);

  const groupedRecentResults = useMemo(() => {
    // 1. Group the results by event_id
    const groups: Record<string, ResultWithDepartment[]> = {};
    recentResults.forEach(r => {
      if (!groups[r.event_id]) groups[r.event_id] = [];
      groups[r.event_id].push(r);
    });

    // 2. Sort results within each group (gold, silver, bronze)
    const medalOrder = ['gold', 'silver', 'bronze', 'none'];
    Object.values(groups).forEach(group => {
      group.sort((a, b) => medalOrder.indexOf(a.medal_type) - medalOrder.indexOf(b.medal_type));
    });

    // 3. Convert to array and filter by search query
    const resultsArray = Object.entries(groups).map(([eventId, items]) => ({
      eventId,
      items,
      event: events.find(e => e.id === eventId)
    }));

    if (!searchQuery) return resultsArray;
    const q = searchQuery.toLowerCase();
    return resultsArray.filter(({ event, items }) => {
      const eventMatch = (event?.name || '').toLowerCase().includes(q);
      const teamMatch = items.some(item => {
        const dept = Array.isArray(item.departments) ? item.departments[0] : item.departments;
        return (dept?.name || '').toLowerCase().includes(q) || (dept?.abbreviation || '').toLowerCase().includes(q);
      });
      return eventMatch || teamMatch;
    });
  }, [recentResults, searchQuery, events]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!eventId) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Finalizing event results...");

    try {
      // 1. Validation: Prevent duplicate medals for the same team
      const selectedIds = [goldId, silverId, bronzeId].filter(id => id !== "" && id !== "awaiting");
      const uniqueIds = new Set(selectedIds);
      if (uniqueIds.size !== selectedIds.length) {
        toast.error("A team cannot win more than one medal in the same event!", { id: loadingToast });
        return;
      }

      // 2. Remove any existing results for this event
      const { error: deleteError } = await supabase
        .from('results')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) throw deleteError;

      // 2. Prepare the new results batch (Only the selected medals)
      const resultsBatch = [];

      if (goldId !== "awaiting") resultsBatch.push({ event_id: eventId, department_id: goldId === "" ? null : goldId, medal_type: 'gold', points: goldId === "" ? 0 : 200 });
      if (silverId !== "awaiting") resultsBatch.push({ event_id: eventId, department_id: silverId === "" ? null : silverId, medal_type: 'silver', points: silverId === "" ? 0 : 150 });
      if (bronzeId !== "awaiting") resultsBatch.push({ event_id: eventId, department_id: bronzeId === "" ? null : bronzeId, medal_type: 'bronze', points: bronzeId === "" ? 0 : 100 });

      // 3. Perform Bulk Insert
      if (resultsBatch.length > 0) {
        const { error: insertError } = await supabase.from('results').insert(resultsBatch);
        if (insertError) throw insertError;
      }

      toast.success("Event results finalized successfully!", { id: loadingToast });
      setEventId("");
      setGoldId("awaiting");
      setSilverId("awaiting");
      setBronzeId("awaiting");
      setCurrentEventResults([]);
      setIsEditing(false);
      fetchDropdownData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }

  const groupedEvents = useMemo(() => {
    if (!events.length || !allCategories.length) return [];

    const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));

    const groups: { [key: string]: Event[] } = events.reduce((acc, event) => {
      const categoryName = event.category ? categoryMap.get(event.category) || "Uncategorized" : "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });

    return Object.entries(groups).map(([category, events]) => ({
      label: category, options: events
    }));
  }, [events, allCategories]);
  
  const getMedalStyles = (medal: string) => {
    switch (medal) {
      case 'gold':
        return { icon: '🥇', color: 'border-yellow-400', shadow: 'shadow-yellow-300/50' };
      case 'silver':
        return { icon: '🥈', color: 'border-gray-400', shadow: 'shadow-gray-400/50' };
      case 'bronze':
        return { icon: '🥉', color: 'border-orange-400', shadow: 'shadow-orange-400/50' };
      case 'none':
        return { icon: '🏃', color: 'border-gray-200', shadow: '' };
      default:
        return { icon: '🏅', color: 'border-gray-300', shadow: '' };
    }
  };

  function handleDeleteEventResults(eventId: string) {
    setResultToDeleteId(eventId);
    setShowConfirmModal(true);
  }

  async function handleConfirmDelete() {
    if (!resultToDeleteId) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("results")
        .delete()
        .eq("event_id", resultToDeleteId);

      if (error) {
        toast.error(`Error deleting results: ${error.message}`);
      } else {
        toast.success("Event results deleted.");
        fetchEventData();
      }
    } finally {
      setIsDeleting(false);
    }
    setShowConfirmModal(false);
    setResultToDeleteId(null);
  }

  async function handleEditByEvent(eventId: string) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsEditing(true);
    setEventId(eventId);
    await fetchEventData(eventId);
  }

  return (
    <div className="w-full h-full dark:text-gray-200 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Add Result' }]} />
      </div>

      <div className="mb-4 shrink-0">
        <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight">{isEditing ? 'Edit Result' : 'Add Results'}</h1>
        <p className="text-sm text-gray-500 font-medium">{isEditing ? 'Modify medal standings for this event' : 'Record competition winners and points'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-4 h-fit flex flex-col pb-2">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible transition-all hover:shadow-md flex flex-col">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 z-10 backdrop-blur-sm rounded-t-3xl">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Result' : 'Medal Entry Form'}</h2>
              </div>
              
              <div className="p-6 relative flex flex-col pt-4">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 dark:text-gray-500">Step 1: Select Event</label>
                    <SingleSelectDropdown
                      options={groupedEvents}
                      selectedValue={eventId}
                      onChange={(id) => {
                        setEventId(id);
                        setGoldId("awaiting");
                        setSilverId("awaiting");
                        setBronzeId("awaiting");
                        if (!id) setIsEditing(false);
                      }}
                      placeholder="Pick a competition"
                    />
                  </div>



                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 dark:text-gray-500">Step 2: Assign Medals</label>
                    <div className="space-y-4 font-bold">
                      {/* Gold */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">🥇</span>
                        <div className="flex-1">
                          <SingleSelectDropdown
                            options={[
                              { id: "", name: "No Team", icon: "✖️" },
                              { id: "awaiting", name: "Awaiting Result...", icon: "⏳" },
                              ...competingDepartments.filter(d => d.id !== silverId && d.id !== bronzeId)
                            ]}
                            selectedValue={goldId}
                            onChange={(id) => {
                              setGoldId(id);
                              if (id !== "" && id !== "awaiting" && id === silverId) setSilverId("");
                              if (id !== "" && id !== "awaiting" && id === bronzeId) setBronzeId("");
                            }}
                            placeholder="Select Gold Team"
                            disabled={!eventId}
                          />
                        </div>
                      </div>

                      {/* Silver */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">🥈</span>
                        <div className="flex-1">
                          <SingleSelectDropdown
                            options={[
                              { id: "", name: "No Team", icon: "✖️" },
                              { id: "awaiting", name: "Awaiting Result...", icon: "⏳" },
                              ...competingDepartments.filter(d => d.id !== goldId && d.id !== bronzeId)
                            ]}
                            selectedValue={silverId}
                            onChange={(id) => {
                              setSilverId(id);
                              if (id !== "" && id !== "awaiting" && id === goldId) setGoldId("");
                              if (id !== "" && id !== "awaiting" && id === bronzeId) setBronzeId("");
                            }}
                            placeholder="Select Silver Team"
                            disabled={!eventId}
                          />
                        </div>
                      </div>

                      {/* Bronze */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">🥉</span>
                        <div className="flex-1">
                          <SingleSelectDropdown
                            options={[
                              { id: "", name: "No Team", icon: "✖️" },
                              { id: "awaiting", name: "Awaiting Result...", icon: "⏳" },
                              ...competingDepartments.filter(d => d.id !== goldId && d.id !== silverId)
                            ]}
                            selectedValue={bronzeId}
                            onChange={(id) => {
                              setBronzeId(id);
                              if (id !== "" && id !== "awaiting" && id === goldId) setGoldId("");
                              if (id !== "" && id !== "awaiting" && id === silverId) setSilverId("");
                            }}
                            placeholder="Select Bronze Team"
                            disabled={!eventId}
                            dropDirection="up"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-4"
                  >
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !eventId || (!goldId && !silverId && !bronzeId)}
                      className={`w-full font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${
                        (isSubmitting || !eventId || (!goldId && !silverId && !bronzeId))
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none"
                        : "bg-monument-primary hover:bg-monument-dark text-white shadow-violet-500/20"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          RECORDING...
                        </>
                      ) : isEditing ? 'UPDATE RESULTS' : 'RECORD EVENT RESULTS'}
                    </button>
                    <p className="text-[10px] text-center text-gray-400 font-medium italic leading-tight">
                      {!eventId 
                        ? 'Select an event to enable result recording.' 
                        : (!goldId && !silverId && !bronzeId)
                        ? 'Assign at least one medal to record results.'
                        : 'Review and synchronize records with the database.'}
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: History */}
          <div className="lg:col-span-8 flex flex-col h-fit lg:max-h-[calc(100vh-180px)] overflow-hidden">
            <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Results History</h3>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Full log of all competition records</p>
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                 <div className="relative flex-1 sm:w-64">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</div>
                   <input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-monument-primary outline-none transition-all shadow-inner" />
                 </div>
                 <div className="bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded-xl shrink-0 shadow-inner">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{groupedRecentResults.length} Competitions</span>
                 </div>
                 <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl shadow-inner ml-1">
                    <button 
                      onClick={() => setViewMode('cards')} 
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-800 shadow-sm text-monument-primary' : 'text-gray-400 hover:text-gray-500'}`}
                      title="Card View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                    </button>
                    <button 
                      onClick={() => setViewMode('table')} 
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 shadow-sm text-monument-primary' : 'text-gray-400 hover:text-gray-500'}`}
                      title="Table View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                 </div>
              </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
              {groupedRecentResults.length === 0 ? (
                <div className="p-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                  <div className="text-5xl mb-4 opacity-50">🏆</div>
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {searchQuery ? "No results match your search" : "No results recorded yet"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? "Try a different search term." : "Use the form to start awarding medals!"}
                  </p>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                  {groupedRecentResults.map(({ eventId, items, event }, index) => {
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={eventId} 
                        className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
                      >
                        <div className="p-5 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-xl border border-gray-100 dark:border-gray-600">
                                {event?.icon || '🏆'}
                             </div>
                             <h4 className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight leading-tight flex-1">{event?.name || 'Unknown Event'}</h4>
                          </div>
                        </div>

                        <div className="p-5 flex-1 bg-white dark:bg-gray-800">
                          <div className="flex flex-col gap-3">
                             {(["gold", "silver", "bronze"] as const).map(medal => {
                               const item = items.find(i => i.medal_type === medal);
                               const department = item ? (Array.isArray(item.departments) ? item.departments[0] : item.departments) : null;
                               const { icon } = getMedalStyles(medal);

                               return (
                                 <div key={medal} className={`flex items-center gap-3 p-2 rounded-xl ${department ? 'bg-gray-50 dark:bg-gray-900/50' : ''}`}>
                                    <span className="text-xl w-6 flex justify-center drop-shadow-sm">{icon}</span>
                                     {item && !department ? (
                                       <div className="flex items-center gap-2 flex-1 min-w-0" title="No Team">
                                         <span className="text-xs font-semibold italic text-gray-400 dark:text-gray-500 truncate pr-2">No Team</span>
                                       </div>
                                     ) : department ? (
                                       <div className="flex items-center gap-2 flex-1 min-w-0" title={department.name}>
                                         {department.image_url ? (
                                           <Image src={department.image_url} alt="" width={24} height={24} className="rounded-full shrink-0" />
                                         ) : (
                                           <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                             {department.name.substring(0, 2).toUpperCase()}
                                           </div>
                                         )}
                                         <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate pr-2">{department.name}</span>
                                       </div>
                                     ) : (
                                       <span className="text-[10px] font-black italic text-violet-400 dark:text-violet-300 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                                         <div className="w-1 h-1 bg-violet-400 rounded-full animate-pulse" />
                                         Awaiting...
                                       </span>
                                     )}
                                 </div>
                               );
                             })}
                          </div>
                        </div>

                        <div className="p-3 border-t border-gray-50 dark:border-gray-700/50 flex justify-end gap-2 bg-gray-50/50 dark:bg-gray-800/30">
                           <button onClick={() => handleEditByEvent(eventId)} className="px-4 py-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase">
                            ✏️ Edit
                           </button>
                           <button onClick={() => handleDeleteEventResults(eventId)} className="px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase">
                            🗑️ Delete
                           </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-20">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px] table-auto">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                          <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Event</th>
                          <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">🥇 GOLD</th>
                          <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">🥈 SILVER</th>
                          <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">🥉 BRONZE</th>
                          <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {groupedRecentResults.map(({ eventId, items, event }) => (
                          <tr key={eventId} className="group hover:bg-gray-50/30 dark:hover:bg-gray-900/30 transition-colors">
                            <td className="px-3 py-2 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xs border border-gray-100 dark:border-gray-600 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors">
                                  {event?.icon || '🏆'}
                                </div>
                                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100 leading-tight truncate max-w-[100px]">{event?.name || 'Unknown Event'}</span>
                              </div>
                            </td>
                            {(['gold', 'silver', 'bronze'] as const).map(medal => {
                              const item = items.find(i => i.medal_type === medal);
                              const dept = item ? (Array.isArray(item.departments) ? item.departments[0] : item.departments) : null;
                              const { icon } = getMedalStyles(medal);
                              return (
                                <td key={medal} className="px-3 py-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm w-4 flex justify-center opacity-80 shrink-0">{icon}</span>
                                     {item && !dept ? (
                                       <div className="flex items-center gap-1.5 overflow-hidden">
                                         <span className="text-[10px] font-semibold italic text-gray-400 dark:text-gray-500 truncate">No Team</span>
                                       </div>
                                     ) : dept ? (
                                       <div className="flex items-center gap-1.5 overflow-hidden">
                                         {dept.image_url ? (
                                           <Image src={dept.image_url} alt="" width={18} height={18} className="rounded-full shadow-sm shrink-0" />
                                         ) : (
                                           <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[7px] font-bold text-gray-500 shrink-0">
                                             {dept.name.substring(0, 2).toUpperCase()}
                                           </div>
                                         )}
                                         <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate">{dept.name}</span>
                                       </div>
                                     ) : (
                                       <span className="text-[9px] font-black italic text-violet-400 dark:text-violet-300 uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                                         <div className="w-1 h-1 bg-violet-400 rounded-full animate-pulse" />
                                         Awaiting...
                                       </span>
                                     )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end">
                                <button onClick={() => handleEditByEvent(eventId)} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-all" title="Edit">
                                  <span className="text-xs">✏️</span>
                                </button>
                                <button onClick={() => handleDeleteEventResults(eventId)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" title="Delete">
                                  <span className="text-xs">🗑️</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this result entry? This action cannot be undone."
      />
      <Toaster />

      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[10000] flex flex-col items-center justify-center text-white text-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 border-4 border-monument-primary border-t-white rounded-full animate-spin mb-8 shadow-2xl shadow-violet-500/20" />
              <h2 className="text-3xl font-black uppercase tracking-[0.2em] mb-2 leading-none">Deleting</h2>
              <div className="h-1 w-12 bg-monument-primary rounded-full mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Processing Database Permanent Directive</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}