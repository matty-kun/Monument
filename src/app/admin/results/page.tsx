"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils//supabase/client";
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

  const supabase = createClient();

  const fetchDropdownData = useCallback(async () => {
    const { data: deptData } = await supabase.from("departments").select("id, name, image_url");
    const { data: eventData } = await supabase.from("events").select("id, name, icon, category").order("category,name");
    const { data: categoriesData } = await supabase.from("categories").select("id, name");
    if (deptData) setDepartments(deptData);
    if (eventData) setEvents(eventData);
    if (categoriesData) setAllCategories(categoriesData);
  }, [supabase]);

  useEffect(() => {
    fetchDropdownData();
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
  }, [fetchEventData]);

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
      if (medalType === "gold") calculatedPoints = 1;
      else if (medalType === "silver") calculatedPoints = 0.20;
      else if (medalType === "bronze") calculatedPoints = 0.04;

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

  async function handleDelete(id: string) {
    setResultToDeleteId(id);
    setShowConfirmModal(true);
  }

  async function handleEdit(result: any) {
    console.log("Editing result:", result);
    setIsEditing(true);
    setEditingResultId(result.id);
    setEventId(result.event_id);
    await fetchEventData(); // Ensure competingDepartments are updated
    setDepartmentId(result.department_id);
    setMedalType(result.medal_type);
  }


  return (
    <div className="max-w-2xl mx-auto dark:text-gray-200">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Add Result' }]} />
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">{isEditing ? '✏️ Edit Result' : '➕ Add Result'}</h1>
                <p className="text-gray-600 dark:text-gray-400">{isEditing ? 'Modify the details of this competition result' : 'Record competition results and award medals to departments'}</p>
              </div>
            </div>
            
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="card-header dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Result Form' : 'Competition Result Form'}</h2>
              </div>
              
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Event</label>
                                    <SingleSelectDropdown
                                      options={groupedEvents}
                                      selectedValue={eventId}
                                      onChange={setEventId}
                                      placeholder="Select Event"
                                      disabled={isEditing}
                                    />              </div>
      
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Department</label>
                                    <SingleSelectDropdown
                                      options={competingDepartments}
                                      selectedValue={departmentId}
                                      onChange={setDepartmentId}
                                      placeholder="Select Department"
                                      disabled={!eventId || competingDepartments.length === 0}
                                    />              </div>
      
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-300">Medal Type</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={() => setMedalType('gold')}
                    disabled={awardedMedalTypes.includes('gold')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${medalType === 'gold' ? 'bg-yellow-400 text-yellow-900 shadow-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'} ${awardedMedalTypes.includes('gold') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    🥇 Gold
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedalType('silver')}
                    disabled={awardedMedalTypes.includes('silver')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${medalType === 'silver' ? 'bg-gray-300 text-gray-800 shadow-sm font-bold dark:bg-gray-500 dark:text-gray-100' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'} ${awardedMedalTypes.includes('silver') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    🥈 Silver
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedalType('bronze')}
                    disabled={awardedMedalTypes.includes('bronze')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${medalType === 'bronze' ? 'bg-orange-400 text-orange-900 shadow-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'} ${awardedMedalTypes.includes('bronze') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    🥉 Bronze
                  </button>
                </div>
              </div>
      
              <div className="flex gap-2">
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
                    className="btn btn-secondary w-full text-lg py-3 dark:bg-gray-600 dark:hover:bg-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary w-full text-lg py-3 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  {isEditing ? '💾 Update Result' : '🏆 Submit Result'}
                </button>
              </div>
            </form>


      </div>


      {eventId && currentEventResults.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
            Current Winners for {events.find(e => e.id === eventId)?.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentEventResults.map((result) => {
                          const { icon, color, shadow } = getMedalStyles(result.medal_type);
                          const department = Array.isArray(result.departments) ? result.departments[0] : result.departments;
                          if (!department) return null;
            
                          return (
                            <Card key={result.id} className={`animate-fadeIn overflow-hidden text-center border-2 ${color} ${shadow} transition-all hover:shadow-xl hover:scale-105 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900`}>
                              <CardHeader className="p-4 relative">
                                <div className="relative w-24 h-24 mx-auto mb-3">
                                  {department.image_url ? (
                                    <Image 
                                      src={department.image_url} 
                                      alt={department.name}
                                      fill
                                      className="object-cover rounded-full"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                      <span className="text-4xl text-gray-400">🏫</span>
                                    </div>
                                  )}
                                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
                                    <span className="text-3xl">{icon}</span>
                                  </div>
                                </div>
                                                    <CardTitle className="font-bold text-xl text-gray-800 dark:text-gray-100 truncate" title={department.name}>
                                                      {department.abbreviation || department.name}
                                                    </CardTitle>
                                                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400 capitalize">{result.medal_type} Medal</CardDescription>
                                                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                                                                            <button onClick={() => handleEdit(result)} className="w-8 h-8 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full flex items-center justify-center transition-colors">
                                                                              <span className="text-lg">✏️</span>
                                                                            </button>                                                      <button onClick={() => handleDelete(result.id)} className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors">
                                                        <span className="text-lg">🗑️</span>
                                                      </button>
                                                    </div>                              </CardHeader>
                            </Card>
                          );
                        })}
          </div>
        </div>
      )}
      {eventId && currentEventResults.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No winners recorded for this event yet.</p>
        </div>
      )}
      <Toaster />
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this result entry? This action cannot be undone."
      />
    </div>
  );
}