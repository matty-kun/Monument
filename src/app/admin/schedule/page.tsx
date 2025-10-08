"use client";

import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabaseClient";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';

interface Department {
  id: string;
  name: string;
  image_url?: string;
}

interface Schedule {
  id: string;
  name: string;
  departments: string[];
  location: string;
  time: string;
  date: string;
  status: "upcoming" | "ongoing" | "finished";
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"upcoming" | "ongoing" | "finished">("upcoming");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(null);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSchedules();
    fetchAllDepartments();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [deptDropdownRef]);

  async function fetchSchedules() {
  const { data, error } = await supabase.from("schedules").select("*").order("date"); // data: Schedule[] | null
    if (!error && data) setSchedules(data);
  }

  async function fetchAllDepartments() {
    const { data, error } = await supabase.from("departments").select("id, name, image_url").order("name");
    if (error) {
      toast.error("Could not fetch departments.");
    } else if (data) {
      setAllDepartments(data);
    }
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from("schedules")
          .update({ name, departments: selectedDepartments, location, time, date, status })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Schedule updated successfully!");
      } else {
        const { error } = await supabase.from("schedules").insert([{ name, departments: selectedDepartments, location, time, date, status }]);
        if (error) throw error;
        toast.success("Schedule added successfully!");
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Error saving schedule: ${err.message}`);
    }
    setName("");
    setSelectedDepartments([]);
    setLocation("");
    setTime("");
    setDate("");
    setStatus("upcoming");
    setEditingId(null);
    fetchSchedules();
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

  

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Manage Schedule</h1>

      <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Event name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <div className="relative" ref={deptDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
              className="w-full border rounded px-3 py-2 text-left bg-white flex items-center gap-2"
            >
              {selectedDepartments.length > 0 ? (
                <div className="flex items-center gap-2">
                  {selectedDepartments.map((deptName, index) => {
                    const dept = departmentMap.get(deptName);
                    if (!dept) return null;
                    return (
                      <Fragment key={dept.id}>
                        {dept.image_url ? (
                          <Image
                            src={dept.image_url}
                            alt={dept.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{dept.name.substring(0,2)}</div>
                        )}
                        {index < selectedDepartments.length - 1 && <span className="font-bold text-gray-400">vs</span>}
                      </Fragment>
                    );
                  })}
                </div>
              ) : "Select Departments"}
            </button>
            {isDeptDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {allDepartments.map((dept) => (
                  <label
                    key={dept.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {dept.image_url ? (
                      <Image
                        src={dept.image_url}
                        alt={dept.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 object-cover rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-xs font-bold text-gray-500">
                        {dept.name.substring(0, 2)}
                      </div>
                    )}
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(dept.name)}
                      onChange={() => handleDeptSelection(dept.name)}
                      className="mr-3"
                    />
                    {dept.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="time"
            placeholder="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="date"
            placeholder="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "upcoming" | "ongoing" | "finished")}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="finished">Finished</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {editingId ? "Update Schedule" : "Add Schedule"}
        </button>
      </form>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Event</th>
              <th className="px-4 py-2 text-left">Departments</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="border-b">
                <td className="px-4 py-2">{schedule.name}</td>
                <td className="px-4 py-2">
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
                <td className="px-4 py-2">{schedule.location}</td>
                <td className="px-4 py-2">{schedule.time}</td>
                <td className="px-4 py-2">{schedule.date}</td>
                <td className="px-4 py-2">{schedule.status}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => {
                      console.log("Editing schedule:", schedule);
                      setEditingId(schedule.id);
                      setName(schedule.name);
                      setSelectedDepartments(schedule.departments);
                      setLocation(schedule.location);
                      setTime(schedule.time);
                      setDate(schedule.date);
                      setStatus(schedule.status);
                      console.log("State after edit click:", {
                        editingId: schedule.id,
                        name: schedule.name,
                        departments: schedule.departments,
                        location: schedule.location,
                        time: schedule.time,
                        date: schedule.date,
                        status: schedule.status,
                      });
                    }}
                    className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No schedules yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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