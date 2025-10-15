"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";

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
}

interface Location {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  event_id: string; // Foreign key to events table
  location_id: string; // Foreign key to locations table
  // The following is from the related tables
  events: { name: string; icon: string | null } | null;
  locations: { name: string } | null;
  departments: string[];
  time: string;
  date: string;
  status: "upcoming" | "ongoing" | "finished";
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [eventId, setEventId] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [locationId, setLocationId] = useState("");
  const [time, setTime] = useState("");
  // New state for robust time picker
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [ampm, setAmPm] = useState("AM");
  // New state for robust date picker
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"upcoming" | "ongoing" | "finished">("upcoming");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  // Combine hour, minute, ampm into a 24-hour format time string
  useEffect(() => {
    if (hour && minute && ampm) {
      let h24 = parseInt(hour, 10);
      if (ampm === 'PM' && h24 < 12) {
        h24 += 12;
      } else if (ampm === 'AM' && h24 === 12) {
        h24 = 0;
      }
      setTime(`${h24.toString().padStart(2, '0')}:${minute}`);
    }
  }, [hour, minute, ampm]);

  // Combine year, month, day into a YYYY-MM-DD format date string
  useEffect(() => {
    if (year && month && day) {
      setDate(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
  }, [year, month, day]);

  useEffect(() => {
    fetchSchedules();
    fetchAllDepartments();
    fetchAllEvents();
    fetchAllLocations();
  }, []);

  async function fetchSchedules() {
    const { data, error } = await supabase
      .from("schedules")
      .select(`
        *,
        events ( name, icon ),
        locations ( name )
      `).order("date");
    if (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Could not fetch schedules.");
    } else if (data) {
      setSchedules(data);
    }
  }

  async function fetchAllDepartments() {
    const { data, error } = await supabase.from("departments").select("id, name, image_url").order("name");
    if (error) {
      toast.error("Could not fetch departments.");
    } else if (data) {
      setAllDepartments(data);
    }
  }

  async function fetchAllEvents() {
    const { data, error } = await supabase.from("events").select("id, name, icon, category").order("category,name");
    if (error) {
      toast.error("Could not fetch events.");
    } else if (data) {
      setAllEvents(data);
    }
  }

  async function fetchAllLocations() {
    const { data, error } = await supabase.from("locations").select("id, name").order("name");
    if (error) {
      toast.error("Could not fetch locations.");
    } else if (data) {
      setAllLocations(data);
    }
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from("schedules")
          .update({ event_id: eventId, departments: selectedDepartments, location_id: locationId, time, date, status })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Schedule updated successfully!");
      } else {
        const { error } = await supabase.from("schedules").insert([{ event_id: eventId, departments: selectedDepartments, location_id: locationId, time, date, status }]);
        if (error) throw error;
        toast.success("Schedule added successfully!");
      }
      resetForm();
      fetchSchedules();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Error saving schedule: ${err.message.replace('location', 'location_id')}`);
    }
  }

  function resetForm() {
    setEventId("");
    setSelectedDepartments([]);
    setLocationId("");
    setTime("");
    setHour("");
    setMinute("");
    setAmPm("AM");
    setYear(new Date().getFullYear().toString());
    setMonth("");
    setDay("");
    setDate("");
    setStatus("upcoming");
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

  const eventMap = useMemo(() => {
    return new Map(allEvents.map(event => [event.id, event]));
  }, [allEvents]);

  const groupedEvents = useMemo(() => {
    if (!allEvents.length) return [];
    const groups: { [key: string]: Event[] } = allEvents.reduce((acc, event) => {
      const category = event.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });

    return Object.entries(groups).map(([category, events]) => ({ label: category, options: events }));
  }, [allEvents]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear + 1].map(y => ({ id: y.toString(), name: y.toString() }));
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString(),
      name: new Date(0, i).toLocaleString('default', { month: 'long' }),
    }));
  }, []);

  const daysInMonth = useMemo(() => {
    if (year && month) {
      // The '0' for the day gets the last day of the previous month.
      // So, for month '2' (February), it gets the last day of month '2', which is correct.
      return new Date(parseInt(year), parseInt(month), 0).getDate();
    }
    return 31; // Default to 31 days
  }, [year, month]);
  
  const statusOptions = useMemo(() => [
    { id: 'upcoming', name: '🟡 Upcoming' },
    { id: 'ongoing', name: '🟢 Ongoing' },
    { id: 'finished', name: '🔴 Finished' },
  ], []);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Schedule' }]} />
      <h1 className="text-2xl font-bold mb-4">Manage Schedule</h1>

      <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleSelectDropdown
            options={groupedEvents}
            selectedValue={eventId}
            onChange={setEventId}
            placeholder="Select Event"
          />

          <MultiSelectDropdown
            options={allDepartments}
            selectedValues={selectedDepartments}
            onChange={handleDeptSelection}
            placeholder="Select Departments"
          />

          <SingleSelectDropdown
            options={allLocations.map(location => ({ id: location.id, name: location.name }))}
            selectedValue={locationId}
            onChange={setLocationId}
            placeholder="Select Location"
          />
          {/* Robust Time Picker */}
          <div className="grid grid-cols-3 gap-2">
            <select value={hour} onChange={e => setHour(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="" disabled>Hour</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <select value={minute} onChange={e => setMinute(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="" disabled>Min</option>
              <option value="00">00</option>
              <option value="05">05</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="25">25</option>
              <option value="30">30</option>
              <option value="35">35</option>
              <option value="40">40</option>
              <option value="45">45</option>
              <option value="50">50</option>
              <option value="55">55</option>
            </select>
            <select value={ampm} onChange={e => setAmPm(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>

          {/* Robust Date Picker */}
          <div className="grid grid-cols-3 gap-2">
            <SingleSelectDropdown
              options={years}
              selectedValue={year}
              onChange={setYear}
              placeholder="Year"
            />
            <SingleSelectDropdown
              options={months.map(m => ({ id: m.value, name: m.name }))}
              selectedValue={month}
              onChange={setMonth}
              placeholder="Month"
            />
            <SingleSelectDropdown
              options={Array.from({ length: daysInMonth }, (_, i) => ({ id: (i + 1).toString(), name: (i + 1).toString() }))}
              selectedValue={day}
              onChange={setDay}
              placeholder="Day"
              disabled={!year || !month}
            />
          </div>

          <SingleSelectDropdown
            options={statusOptions}
            selectedValue={status}
            onChange={(value) => setStatus(value as "upcoming" | "ongoing" | "finished")}
            placeholder="Select Status"
          />
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
          <table className="min-w-full">
            <thead className="table-header">
            <tr>
                <th className="table-cell text-left">Event</th>
                <th className="table-cell text-left">Departments</th>
                <th className="table-cell text-left">Location</th>
                <th className="table-cell text-left">Time</th>
                <th className="table-cell text-left">Date</th>
                <th className="table-cell text-left">Status</th>
                <th className="table-cell text-center">Actions</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
            {schedules.map((schedule) => (
                <tr key={schedule.id} className="table-row">
                  <td className="table-cell flex items-center gap-2">
                  <span className="text-xl">{schedule.events?.icon}</span>
                  <span>{schedule.events?.name}</span>
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
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500" title={dept.name}>
                                {dept.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          {index < schedule.departments.length - 1 && <span className="font-bold text-gray-400">vs</span>}
                        </Fragment>
                      );
                    })}
                  </div>
                </td>
                  <td className="table-cell">{schedule.locations?.name || 'N/A'}</td>
                  <td className="table-cell">{schedule.time}</td>
                  <td className="table-cell">{schedule.date}</td>
                  <td className="table-cell">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      schedule.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                      schedule.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                  </span>
                </td>
                  <td className="table-cell text-center">
                  <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setEditingId(schedule.id);
                      setEventId(schedule.event_id);
                      setSelectedDepartments(schedule.departments);
                      setLocationId(schedule.location_id);
                      // Deconstruct time for the robust picker
                      if (schedule.time) {
                        const [h24, m] = schedule.time.split(':').map(Number);
                        const newAmPm = h24 >= 12 ? 'PM' : 'AM';
                        let h12 = h24 % 12;
                        if (h12 === 0) h12 = 12; // 12 PM or 12 AM
                        setHour(h12.toString());
                        setMinute(m.toString().padStart(2, '0'));
                        setAmPm(newAmPm);
                      }
                      // Deconstruct date for the robust picker
                      if (schedule.date) {
                        const [y, mo, d] = schedule.date.split('-').map(Number);
                        setYear(y.toString());
                        setMonth(mo.toString());
                        setDay(d.toString());
                      }
                      setStatus(schedule.status);
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