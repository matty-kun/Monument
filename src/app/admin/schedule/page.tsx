"use client";

import { useState, useEffect, useMemo, Fragment, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { formatTime } from "@/lib/utils";

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
  event_id: string; // Foreign key to events table
  venue_id: string; // Foreign key to venues table
  // The following is from the related tables
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
  // Adding T00:00:00 ensures the date isn't affected by timezone shifts
  const date = new Date(dateString + 'T00:00:00');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSchedules = useCallback(async () => {
    const { data, error } = await supabase
      .from("schedules")
      .select(`
        *, start_time, end_time,
        events ( name, icon ),
        venues ( name )
      `).order("date");
    if (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Could not fetch schedules.");
    } else if (data) {
      setSchedules(data);
    }
  }, [supabase]);

  const fetchAllDepartments = useCallback(async () => {
    const { data, error } = await supabase.from("departments").select("id, name, image_url").order("name");
    if (error) {
      toast.error("Could not fetch departments.");
    } else if (data) {
      setAllDepartments(data);
    }
  }, [supabase]);

  const fetchAllEvents = useCallback(async () => {
    const { data, error } = await supabase.from("events").select("id, name, icon, category, gender, division").order("category,name");
    if (error) {
      toast.error("Could not fetch events.");
    } else if (data) {
      setAllEvents(data);
    }
  }, [supabase]);

  const fetchAllVenues = useCallback(async () => {
    const { data, error } = await supabase.from("venues").select("id, name").order("name");
    if (error) {
      toast.error("Could not fetch venues.");
    } else if (data) {
      setAllVenues(data);
    }
  }, [supabase]);

  const fetchAllCategories = useCallback(async () => {
    const { data, error } = await supabase.from("categories").select("id, name").order("name");
    if (error) {
      toast.error("Could not fetch categories.");
    } else if (data) {
      setAllCategories(data);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSchedules();
    fetchAllDepartments();
    fetchAllEvents();
    fetchAllVenues();
    fetchAllCategories();
  }, [fetchSchedules, fetchAllDepartments, fetchAllEvents, fetchAllVenues, fetchAllCategories]);

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from("schedules")
          .update({ event_id: eventId, departments: selectedDepartments, venue_id: venueId, start_time: startTime, end_time: endTime, date })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Schedule updated successfully!");
      } else {
        const { error } = await supabase.from("schedules").insert([{ event_id: eventId, departments: selectedDepartments, venue_id: venueId, start_time: startTime, end_time: endTime, date, status }]);
        if (error) throw error;
        toast.success("Schedule added successfully!");
      }
      resetForm();
      fetchSchedules();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Error saving schedule: ${err.message.replace('venue', 'venue_id')}`);
    }
  }

  function resetForm() {
    setEventId("");
    setSelectedDepartments([]);
    setVenueId("");
    setStartTime("");
    setEndTime("");
    setDate("");
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setScheduleToDeleteId(id);
    setShowConfirmModal(true);
  }

  async function handleConfirmDelete() {
    if (!scheduleToDeleteId) return;

    const { error } = await supabase.from("schedules").delete().eq("id", scheduleToDeleteId);
    if (error) {
      toast.error("Error deleting schedule.");
    } else {
      toast.success("Schedule deleted successfully!");
      fetchSchedules();
    }
    setShowConfirmModal(false);
    setScheduleToDeleteId(null);
  }

  const handleDeptSelection = (deptName: string) => {
    setSelectedDepartments(prev =>
      prev.includes(deptName)
        ? prev.filter(d => d !== deptName)
        : [...prev, deptName]
    );
  };

  const departmentMap = useMemo(() => {
    return new Map(allDepartments.map(dept => [dept.name, dept]));
  }, [allDepartments]);

  // Helper to format the full event name for display
  const formatEventName = useCallback((event: Event | { name: string; gender: string | null; division: string | null; }) => {
    if (!event) return 'N/A';
    const parts = [event.name];
    if (event.division && event.division !== 'N/A') parts.push(`(${event.division})`);
    if (event.gender) parts.push(`- ${event.gender}`);
    return parts.join(' ');
  }, []);

  const groupedEvents = useMemo(() => {
    if (!allEvents.length || !allCategories.length) return [];
    const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));

    const groups: { [key: string]: Event[] } = allEvents.reduce((acc, event) => {
      const categoryName = event.category ? categoryMap.get(event.category) || "Uncategorized" : "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });
    
    // Now, map the events within each group to have a formatted name for the dropdown
    return Object.entries(groups).map(([category, events]) => ({
      label: category,
      options: events.map(event => ({ ...event, id: event.id, name: formatEventName(event) }))
    }));
  }, [allEvents, allCategories, formatEventName]);

  const statusOptions = useMemo(() => [
    { id: 'upcoming', name: '🟡 Upcoming' },
    { id: 'ongoing', name: '🟢 Ongoing' },
    { id: 'finished', name: '🔴 Finished' },
  ], []);

  const getDynamicStatus = useCallback((schedule: Schedule) => {
    if (!schedule.date || !schedule.start_time || !schedule.end_time)
      return {
        status: "upcoming",
        label: "Upcoming",
        color: "bg-yellow-500",
        icon: "⏳",
      };

    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const end = new Date(`${schedule.date}T${schedule.end_time}`);

    if (isNaN(start.getTime()))
      return {
        status: "upcoming",
        label: "Upcoming",
        color: "bg-yellow-500",
        icon: "⏳",
      };

    if (now < start)
      return {
        status: "upcoming",
        label: "Upcoming",
        color: "bg-yellow-500",
        icon: "⏳",
      };
    if (now >= start && now <= end)
      return {
        status: "ongoing",
        label: "Live Now",
        color: "bg-green-500 animate-pulse",
        icon: "🔴",
      };
    return { status: "finished", label: "Finished", color: "bg-red-500", icon: "✅" };
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 dark:text-gray-200">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Schedule' }]} />
      <h1 className="text-4xl font-bold text-monument-green mb-4 dark:text-green-400">🗓️ Manage Schedule</h1>

      <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow dark:bg-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <SingleSelectDropdown
            options={groupedEvents}
            selectedValue={eventId}
            onChange={setEventId}
            placeholder="Select Event"
          />
          <SingleSelectDropdown
            options={allVenues.map(venue => ({ id: venue.id, name: venue.name }))}
            selectedValue={venueId}
            onChange={setVenueId}
            placeholder="Select Venue"
          />

          {/* Row 2: Departments (Full Width) */}
          <div className="md:col-span-2">
            <MultiSelectDropdown
              options={allDepartments}
              selectedValues={selectedDepartments}
              onChange={handleDeptSelection}
              placeholder="Select Departments"
            />
          </div>

          {/* Row 3: Start Time & End Time */}
          <div className="flex flex-col">
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
            <input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input" required />
          </div>

          <div className="flex flex-col">
            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
            <input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input" required />
          </div>

          {/* Row 4: Date & Status */}
          <div className="flex flex-col">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {editingId ? "Update Schedule" : "Add Schedule"}
        </button>
      </form>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="table-header bg-gray-50 dark:bg-gray-700">
            <tr>
                <th className="table-cell text-left dark:text-gray-300">Event</th>
                <th className="table-cell text-left dark:text-gray-300">Departments</th>
                <th className="table-cell text-left dark:text-gray-300">Venue</th>
                <th className="table-cell text-left dark:text-gray-300">Time</th>
                <th className="table-cell text-left dark:text-gray-300">Date</th>
                <th className="table-cell text-left dark:text-gray-300">Status</th>
                <th className="table-cell text-center dark:text-gray-300">Actions</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
            {schedules.map((schedule) => (
                <tr key={schedule.id} className="table-row dark:hover:bg-gray-700/50">
                  <td className="table-cell flex items-center gap-2 dark:text-gray-100">
                  <span className="text-xl">{schedule.events?.icon || '❓'}</span>
                  <span>{schedule.events ? formatEventName(schedule.events) : 'N/A'}</span>
                </td>
                  <td className="table-cell">
                  <div className="flex flex-wrap items-center gap-2">
                    {schedule.departments.map((deptName, index) => {
                      const dept = departmentMap.get(deptName);
                      if (!dept) return null;
                      return (
                        <Fragment key={dept.id}>
                          <div title={dept.name}>
                            {dept.image_url ? (
                              <Image
                                src={dept.image_url}
                                alt={dept.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 dark:bg-gray-600 dark:text-gray-300" title={dept.name}>
                                {dept.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          {index < schedule.departments.length - 1 && <div className="h-8 flex items-center justify-center">
                            <span className="font-bold text-gray-400 dark:text-gray-500">vs</span>
                          </div>}
                        </Fragment>
                      );
                    })}
                  </div>
                </td>
                  <td className="table-cell">{schedule.venues?.name || 'N/A'}</td>
                  <td className="table-cell">{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</td>
                  <td className="table-cell">{formatDate(schedule.date)}</td>
                  <td className="table-cell">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getDynamicStatus(schedule).status === 'upcoming' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                        getDynamicStatus(schedule).status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 animate-pulse' :
                        'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      }`}
                    >
                      {getDynamicStatus(schedule).label}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                  <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setEditingId(schedule.id);
                      setEventId(schedule.event_id);
                      setSelectedDepartments(schedule.departments);
                      setVenueId(schedule.venue_id);
                      setStartTime(schedule.start_time);
                      setEndTime(schedule.end_time);
                      setDate(schedule.date);
                    }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="btn-danger py-1 px-3 text-sm rounded"
                  >
                    🗑️ Delete
                  </button>
                  </div>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                  <td colSpan={7} className="table-cell text-center py-4 text-gray-500">
                  No schedules yet.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this schedule entry? This action cannot be undone."
      />
      <Toaster />
    </div>
  );
}
