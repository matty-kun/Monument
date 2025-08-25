"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Event {
  id: string;
  name: string;
  category: string | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase.from("events").select("*").order("name");
    if (!error && data) setEvents(data);
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await supabase.from("events").update({ name, category }).eq("id", editingId);
    } else {
      await supabase.from("events").insert([{ name, category }]);
    }
    setName("");
    setCategory("");
    setEditingId(null);
    fetchEvents();
  }

  async function handleDelete(id: string) {
    await supabase.from("events").delete().eq("id", id);
    fetchEvents();
  }

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Manage Events</h1>

      <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-6">
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
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {editingId ? "Update Event" : "Add Event"}
        </button>
      </form>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Event</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b">
                <td className="px-4 py-2">{event.name}</td>
                <td className="px-4 py-2">{event.category || "-"}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(event.id);
                      setName(event.name);
                      setCategory(event.category || "");
                    }}
                    className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
