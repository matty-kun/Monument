"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  medal_type: 'gold' | 'silver' | 'bronze';
  departments: Department | Department[] | null;
}

export default function AddResultPage() {
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [competingDepartments, setCompetingDepartments] = useState<Department[]>([]);
  const [eventId, setEventId] = useState("");
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [medalType, setMedalType] = useState("gold");
  const [currentEventResults, setCurrentEventResults] = useState<ResultWithDepartment[]>([]);
  const [awardedMedalTypes, setAwardedMedalTypes] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultToDeleteId, setResultToDeleteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<ResultWithDepartment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  const fetchDropdownData = useCallback(async () => {
    const { data: deptData } = await supabase.from("departments").select("id, name, image_url");
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
      const medalOrder = ['gold', 'silver', 'bronze'];
      const sortedResults = (existingResults as ResultWithDepartment[]).sort((a, b) => {
        return medalOrder.indexOf(a.medal_type) - medalOrder.indexOf(b.medal_type);
      });
      setCurrentEventResults(sortedResults);
      setAwardedMedalTypes(sortedResults.map(r => r.medal_type));
    }

    const awardedDeptIds = new Set((existingResults || []).map(r => r.department_id));

    let availableDepts: Department[];
    if (scheduleError || !schedule || !schedule.departments) {
      console.warn(`No schedule found for event ID: ${idToFetch}. Showing all departments.`);
      availableDepts = departments.filter(dept => !awardedDeptIds.has(dept.id));
      setCompetingDepartments(availableDepts);
    } else {
      const competingDeptNames = schedule.departments as string[];
      const competingDepts = departments.filter(dept => competingDeptNames.includes(dept.name));
      availableDepts = competingDepts.filter(dept => !awardedDeptIds.has(dept.id) || isEditing);
      setCompetingDepartments(availableDepts);
    }}, [supabase, eventId, departments, isEditing]);

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

  const filteredRecentResults = useMemo(() => {
    if (!searchQuery) return recentResults;
    const q = searchQuery.toLowerCase();
    return recentResults.filter((result) => {
      const event = events.find(e => e.id === result.event_id);
      const department = Array.isArray(result.departments) ? result.departments[0] : result.departments;
      return (
        (event?.name || '').toLowerCase().includes(q) ||
        (department?.name || '').toLowerCase().includes(q) ||
        (department?.abbreviation || '').toLowerCase().includes(q)
      );
    });
  }, [recentResults, searchQuery, events]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!eventId || !departmentId) {
      toast.error("Please select both an event and a department.");
      return;
    }

    if (isEditing) {
      // Update existing result
      const { error } = await supabase
        .from("results")
        .update({ department_id: departmentId, medal_type: medalType })
        .eq("id", editingResultId);

      if (error) {
        toast.error(`Error updating result: ${error.message}`);
      } else {
        toast.success("Result updated successfully!");
        setIsEditing(false);
        setEditingResultId(null);
        // Reset form fields
        setEventId("");
        setDepartmentId("");
        setMedalType("gold");
        fetchEventData();
      }
    } else {
      // Add new result
      if (awardedMedalTypes.includes(medalType)) {
        toast.error(`A ${medalType} medal has already been awarded for this event.`);
        return;
      }

      let calculatedPoints = 0;
      if (medalType === "gold") calculatedPoints = 200;
      else if (medalType === "silver") calculatedPoints = 150;
      else if (medalType === "bronze") calculatedPoints = 100;

      const { error } = await supabase.from("results").insert([
        {
          event_id: eventId,
          department_id: departmentId,
          medal_type: medalType,
          points: calculatedPoints,
        },
      ]);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Result added successfully!");
        fetchEventData();
      }
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
      default:
        return { icon: '🏅', color: 'border-gray-300', shadow: '' };
    }
  };

  async function handleConfirmDelete() {
    if (!resultToDeleteId) return;

    const { error } = await supabase.from("results").delete().eq("id", resultToDeleteId);

    if (error) {
      toast.error("Error deleting result.");
    } else {
      toast.success("Result deleted successfully!");
      fetchEventData(); // Refresh the list
    }
    setShowConfirmModal(false);
    setResultToDeleteId(null);
  }

  function handleDelete(id: string) {
    setResultToDeleteId(id);
    setShowConfirmModal(true);
  }

  async function handleEdit(result: ResultWithDepartment) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsEditing(true);
    setEditingResultId(result.id);
    setEventId(result.event_id);
    await fetchEventData(result.event_id);
    setDepartmentId(result.department_id);
    setMedalType(result.medal_type);
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
        <div className="lg:col-span-4 h-full flex flex-col min-h-0 pb-2">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Result' : 'Medal Entry Form'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative flex flex-col pt-4">
                <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 dark:text-gray-500">Select Event</label>
                    <SingleSelectDropdown
                      options={groupedEvents}
                      selectedValue={eventId}
                      onChange={setEventId}
                      placeholder="Pick a competition"
                      disabled={isEditing}
                    />
                  </div>
          
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 dark:text-gray-500">Awarding Team</label>
                    <SingleSelectDropdown
                      options={competingDepartments}
                      selectedValue={departmentId}
                      onChange={setDepartmentId}
                      placeholder={!eventId ? "Select event first" : "Pick a winner"}
                      disabled={!eventId || competingDepartments.length === 0}
                    />
                  </div>
          
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 dark:text-gray-500">Medal Standing</label>
                    <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-50 rounded-2xl dark:bg-gray-900/50">
                      <button
                        type="button"
                        onClick={() => setMedalType('gold')}
                        disabled={awardedMedalTypes.includes('gold')}
                        className={`py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${medalType === 'gold' ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800'} ${awardedMedalTypes.includes('gold') ? 'opacity-30 cursor-not-allowed scale-95' : 'hover:scale-105'}`}
                      >
                        🥇 Gold
                      </button>
                      <button
                        type="button"
                        onClick={() => setMedalType('silver')}
                        disabled={awardedMedalTypes.includes('silver')}
                        className={`py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${medalType === 'silver' ? 'bg-gray-200 text-gray-800 shadow-md dark:bg-gray-600 dark:text-gray-100' : 'text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800'} ${awardedMedalTypes.includes('silver') ? 'opacity-30 cursor-not-allowed scale-95' : 'hover:scale-105'}`}
                      >
                        🥈 Silver
                      </button>
                      <button
                        type="button"
                        onClick={() => setMedalType('bronze')}
                        disabled={awardedMedalTypes.includes('bronze')}
                        className={`py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${medalType === 'bronze' ? 'bg-orange-400 text-orange-900 shadow-md' : 'text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800'} ${awardedMedalTypes.includes('bronze') ? 'opacity-30 cursor-not-allowed scale-95' : 'hover:scale-105'}`}
                      >
                        🥉 Bronze
                      </button>
                    </div>
                  </div>
          
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="submit"
                      className="w-full bg-monument-primary hover:bg-monument-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95"
                    >
                      {isEditing ? 'UPDATE ENTRY' : 'SUBMIT RESULT'}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditingResultId(null);
                          setEventId("");
                          setDepartmentId("");
                          setMedalType("gold");
                        }}
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold py-3 rounded-2xl hover:bg-gray-200 transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>


        </div>

        {/* RIGHT COLUMN: History */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-fit lg:max-h-[calc(100vh-180px)] overflow-hidden transition-all hover:shadow-md">
            <div className="p-6 sm:p-8 border-b border-gray-50 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50/50 dark:bg-gray-800/50 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Results History</h3>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Full log of all competition records</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="relative flex-1 sm:w-64">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</div>
                   <input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-monument-primary outline-none transition-all shadow-sm" />
                 </div>
                 <div className="bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shrink-0 shadow-sm">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{filteredRecentResults.length} Entries</span>
                 </div>
              </div>
            </div>

            <div className="overflow-y-auto custom-scrollbar overflow-x-auto relative flex-1">
              <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700">
                <thead className="bg-gray-50/50 dark:bg-gray-900/20 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Competition</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Team</th>
                    <th className="px-8 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Medal</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {filteredRecentResults.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                        {searchQuery 
                          ? `No results match "${searchQuery}"` 
                          : "No results recorded yet. Use the form to start awarding medals!"}
                      </td>
                    </tr>
                  ) : filteredRecentResults.map((result) => {
                      const event = events.find(e => e.id === result.event_id);
                      const department = Array.isArray(result.departments) ? result.departments[0] : result.departments;
                      const { icon } = getMedalStyles(result.medal_type);
                      
                      return (
                        <tr key={result.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                          <td className="px-8 py-5">
                            <span className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight">{event?.name || 'Unknown Event'}</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                               {department?.image_url && (
                                 <Image src={department.image_url} alt="" width={24} height={24} className="rounded-full shrink-0" />
                               )}
                               <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{department?.abbreviation || department?.name || 'Unknown Team'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center text-2xl drop-shadow-sm group-hover:scale-125 transition-transform">
                            {icon}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                               <button onClick={() => handleEdit(result)} className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all">
                                ✏️
                               </button>
                               <button onClick={() => handleDelete(result.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                🗑️
                               </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
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
    </div>
  );
}