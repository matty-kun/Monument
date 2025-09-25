"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js"; // Import User type

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // Update useState type
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [name, setName] = useState("");
  const [departments, setDepartments] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"upcoming" | "ongoing" | "finished">("upcoming");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // router.push("/admin/login"); // Temporarily bypass login
      } else {
        setUser(session.user);
      }
    };

    fetchUser();
    fetchSchedules();
  }, [router]);

  async function fetchSchedules() {
    const { data, error } = await supabase.from("schedules").select("*").order("date");
    if (!error && data) setSchedules(data);
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    const departmentsArray = departments.split(",").map((d) => d.trim());
    if (editingId) {
      await supabase
        .from("schedules")
        .update({ name, departments: departmentsArray, location, time, date, status })
        .eq("id", editingId);
    } else {
      await supabase.from("schedules").insert([{ name, departments: departmentsArray, location, time, date, status }]);
    }
    setName("");
    setDepartments("");
    setLocation("");
    setTime("");
    setDate("");
    setStatus("upcoming");
    setEditingId(null);
    fetchSchedules();
  }

  async function handleDelete(id: string) {
    await supabase.from("schedules").delete().eq("id", id);
    fetchSchedules();
  }

  

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
          <input
            type="text"
            placeholder="Departments (comma-separated)"
            value={departments}
            onChange={(e) => setDepartments(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
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
                <td className="px-4 py-2">{schedule.departments.join(", ")}</td>
                <td className="px-4 py-2">{schedule.location}</td>
                <td className="px-4 py-2">{schedule.time}</td>
                <td className="px-4 py-2">{schedule.date}</td>
                <td className="px-4 py-2">{schedule.status}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(schedule.id);
                      setName(schedule.name);
                      setDepartments(schedule.departments.join(", "));
                      setLocation(schedule.location);
                      setTime(schedule.time);
                      setDate(schedule.date);
                      setStatus(schedule.status);
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
    </div>
  );
}