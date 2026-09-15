import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import { Tournament } from "@/components/AdminTournamentProvider";
import { ResultDepartment, ResultEvent, ResultCategory, ResultWithDepartment } from "../models/resultTypes";
import { replaceEventResultsAction } from "../actions";
import type { ResultAssignmentInput } from "../resultPolicy";

interface UseResultsViewModelProps {
  selectedTournament: Tournament | null;
}

export const useResultsViewModel = ({ selectedTournament }: UseResultsViewModelProps) => {
  const [departments, setDepartments] = useState<ResultDepartment[]>([]);
  const [events, setEvents] = useState<ResultEvent[]>([]);
  const [competingDepartments, setCompetingDepartments] = useState<ResultDepartment[]>([]);
  const [eventId, setEventId] = useState("");
  const [allCategories, setAllCategories] = useState<ResultCategory[]>([]);
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
    if (!selectedTournament) return;
    
    const { data: deptData } = await supabase
      .from("tournament_departments")
      .select("id:department_id, name, image_url, abbreviation")
      .eq("tournament_id", selectedTournament.id);
      
    const { data: eventData } = await supabase.from("events").select("id, name, icon, category").eq("tournament_id", selectedTournament.id).order("category,name");
    const { data: categoriesData } = await supabase.from("categories").select("id, name");
    if (deptData) setDepartments(deptData);
    if (eventData) setEvents(eventData);
    if (categoriesData) setAllCategories(categoriesData);

    const { data: recentData } = await supabase
      .from('results')
      .select('id, event_id, department_id, medal_type, assigned_by, assigned_by_email, created_at, events!inner(tournament_id)')
      .eq('tournament_id', selectedTournament.id)
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (recentData) {
      const mappedData = recentData.map(r => ({
        ...r,
        departments: deptData?.find(d => d.id === r.department_id) || null
      }));
      setRecentResults(mappedData as any[]);
    }
  }, [supabase, selectedTournament]);

  useEffect(() => {
    if (selectedTournament) {
      fetchDropdownData();
      document.title = `Manage Results | ${selectedTournament.name}`;
    }
  }, [fetchDropdownData, selectedTournament]);

  const fetchEventData = useCallback(async (currentEventId?: string) => {
    const idToFetch = currentEventId || eventId;
    if (!idToFetch) {
      setCurrentEventResults([]);
      return;
    }

    const [scheduleRes, resultsRes] = await Promise.all([
      supabase.from('schedules').select('departments').eq('event_id', idToFetch).single(),
      supabase.from('results').select('id, event_id, department_id, medal_type, assigned_by, assigned_by_email, created_at').eq('event_id', idToFetch)
    ]);

    const { data: schedule, error: scheduleError } = scheduleRes;
    const { data: existingResults, error: resultsError } = resultsRes;

    if (resultsError) {
      console.error("Error fetching existing results:", resultsError);
    } else if (existingResults) {
      const mappedResults = existingResults.map(r => ({
        ...r,
        departments: departments.find(d => d.id === r.department_id) || null
      }));
      setCurrentEventResults(mappedResults as ResultWithDepartment[]);
      
      const gold = (existingResults as ResultWithDepartment[]).find(r => r.medal_type === 'gold');
      const silver = (existingResults as ResultWithDepartment[]).find(r => r.medal_type === 'silver');
      const bronze = (existingResults as ResultWithDepartment[]).find(r => r.medal_type === 'bronze');
      
      setGoldId(gold ? (gold.department_id || "") : "awaiting");
      setSilverId(silver ? (silver.department_id || "") : "awaiting");
      setBronzeId(bronze ? (bronze.department_id || "") : "awaiting");
    }

    let availableDepts: ResultDepartment[];
    if (scheduleError || !schedule || !schedule.departments) {
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
          fetchDropdownData(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEventData, fetchDropdownData, supabase, selectedTournament]);

  const groupedRecentResults = useMemo(() => {
    const groups: Record<string, ResultWithDepartment[]> = {};
    recentResults.forEach(r => {
      if (!groups[r.event_id]) groups[r.event_id] = [];
      groups[r.event_id].push(r);
    });

    const medalOrder = ['gold', 'silver', 'bronze', 'none'];
    Object.values(groups).forEach(group => {
      group.sort((a, b) => medalOrder.indexOf(a.medal_type) - medalOrder.indexOf(b.medal_type));
    });

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
    if (!eventId || !selectedTournament) return false;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Finalizing event results...");

    try {
      const selectedIds = [goldId, silverId, bronzeId].filter(id => id !== "" && id !== "awaiting");
      const uniqueIds = new Set(selectedIds);
      if (uniqueIds.size !== selectedIds.length) {
        toast.error("A team cannot win more than one medal in the same event!", { id: loadingToast });
        return false;
      }

      const assignments: ResultAssignmentInput[] = [];
      if (goldId !== "awaiting") assignments.push({ departmentId: goldId === "" ? null : goldId, medalType: "gold" });
      if (silverId !== "awaiting") assignments.push({ departmentId: silverId === "" ? null : silverId, medalType: "silver" });
      if (bronzeId !== "awaiting") assignments.push({ departmentId: bronzeId === "" ? null : bronzeId, medalType: "bronze" });

      const result = await replaceEventResultsAction({
        eventId,
        tournamentId: selectedTournament.id,
        assignments,
      });
      if (!result.success) throw new Error(result.error);

      toast.success("Event results finalized successfully!", { id: loadingToast });
      setEventId("");
      setGoldId("awaiting");
      setSilverId("awaiting");
      setBronzeId("awaiting");
      setCurrentEventResults([]);
      setIsEditing(false);
      fetchDropdownData();
      return true;
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const groupedEvents = useMemo(() => {
    if (!events.length || !allCategories.length) return [];

    const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));

    const groups: { [key: string]: ResultEvent[] } = events.reduce((acc, event) => {
      const categoryName = event.category ? categoryMap.get(event.category) || "Uncategorized" : "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(event);
      return acc;
    }, {} as { [key: string]: ResultEvent[] });

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
    if (!resultToDeleteId || !selectedTournament) return;
    setIsDeleting(true);

    try {
      const result = await replaceEventResultsAction({
        eventId: resultToDeleteId,
        tournamentId: selectedTournament.id,
        assignments: [],
      });

      if (!result.success) {
        toast.error(`Error deleting results: ${result.error}`);
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

  return {
    departments,
    events,
    competingDepartments,
    eventId,
    setEventId,
    allCategories,
    goldId,
    setGoldId,
    silverId,
    setSilverId,
    bronzeId,
    setBronzeId,
    currentEventResults,
    showConfirmModal,
    setShowConfirmModal,
    resultToDeleteId,
    setResultToDeleteId,
    isEditing,
    setIsEditing,
    editingResultId,
    setEditingResultId,
    recentResults,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    isDeleting,
    isSubmitting,
    groupedRecentResults,
    groupedEvents,
    handleSubmit,
    handleConfirmDelete,
    handleDeleteEventResults,
    handleEditByEvent,
    getMedalStyles,
  };
};
