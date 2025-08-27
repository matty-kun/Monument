"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface Department {
  id: string;
  name: string;
}

const POINTS = { 1: 5, 2: 3, 3: 1 };

export function EventsAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newEvent, setNewEvent] = useState("");

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
  }, []);

  async function fetchEvents() {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (data) setEvents(data);
  }

  async function fetchDepartments() {
    const { data } = await supabase.from("departments").select("*").order("name");
    if (data) setDepartments(data);
  }

  async function addEvent() {
    if (!newEvent.trim()) return;
    await supabase.from("events").insert([{ name: newEvent, status: "upcoming" }]);
    setNewEvent("");
    fetchEvents();
  }

  async function deleteEvent(id: string) {
    await supabase.from("events").delete().eq("id", id);
    fetchEvents();
  }

  async function assignWinner(eventId: string, deptId: string, rank: number) {
    const points = POINTS[rank as keyof typeof POINTS] || 0;

    // Upsert into results
    await supabase.from("results").upsert([
      {
        event_id: eventId,
        department_id: deptId,
        rank,
        points,
      },
    ], { onConflict: "event_id,rank" }); // ensures unique rank per event

    fetchEvents();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Events</h2>

      {/* Add Event */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Event Name"
          value={newEvent}
          onChange={(e) => setNewEvent(e.target.value)}
          className="border rounded p-2 flex-1"
        />
        <Button onClick={addEvent}>Add</Button>
      </div>

      {/* List Events */}
      {events.map((ev) => (
        <div key={ev.id} className="bg-gray-100 p-4 rounded-lg mb-4 shadow">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">{ev.name}</h3>
            <Button variant="destructive" onClick={() => deleteEvent(ev.id)}>Delete</Button>
          </div>

          {/* Winner Assignment */}
          <div className="mt-4">
            {[1, 2, 3].map((rank) => (
              <div key={rank} className="flex items-center gap-2 mb-2">
                <span className="w-20 font-semibold">{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</span>
                <select
                  onChange={(e) => assignWinner(ev.id, e.target.value, rank)}
                  className="border p-2 rounded flex-1"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
