"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Department {
  id: string;
  name: string;
}
interface Event {
  id: string;
  name: string;
}

export default function AddResultPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [medalType, setMedalType] = useState("gold");
  const [points, setPoints] = useState(5);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDropdownData();
  }, []);

  async function fetchDropdownData() {
    const { data: deptData } = await supabase.from("departments").select("id, name");
    const { data: eventData } = await supabase.from("events").select("id, name");
    if (deptData) setDepartments(deptData);
    if (eventData) setEvents(eventData);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("results").insert([
      {
        event_id: eventId,
        department_id: departmentId,
        medal_type: medalType,
        points,
      },
    ]);
    if (error) setMessage(error.message);
    else {
      setMessage("✅ Result added successfully!");
      setEventId("");
      setDepartmentId("");
      setMedalType("gold");
      setPoints(5);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Add Result</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Select Event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>

        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="gold"
              checked={medalType === "gold"}
              onChange={(e) => {
                setMedalType(e.target.value);
                setPoints(5);
              }}
            />
            🥇 Gold
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="silver"
              checked={medalType === "silver"}
              onChange={(e) => {
                setMedalType(e.target.value);
                setPoints(3);
              }}
            />
            🥈 Silver
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="bronze"
              checked={medalType === "bronze"}
              onChange={(e) => {
                setMedalType(e.target.value);
                setPoints(1);
              }}
            />
            🥉 Bronze
          </label>
        </div>

        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
          placeholder="Points"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
