"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";

interface Category {
  id: string;
  name: string;
}
interface Event {
  id: string;
  name: string;
  category: string | null;
  icon?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [icon, setIcon] = useState<string | undefined>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  async function fetchEvents() {
  const { data, error } = await supabase.from("events").select("*").order("name"); // data: Event[] | null
    if (!error && data) setEvents(data);
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    if (!error && data) setCategories(data);
  }

  function onEmojiClick(emojiData: EmojiClickData) {
    setIcon(emojiData.emoji);
    setShowEmojiPicker(false);
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault(); // Prevent default form submission
    try {
      if (editingId) {
        const { error } = await supabase.from("events").update({ name, category, icon }).eq("id", editingId);
        if (error) throw error;
        toast.success("Event updated successfully!");
      } else {
        const { error } = await supabase.from("events").insert([{ name, category, icon }]);
        if (error) throw error;
        toast.success("Event added successfully!");
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Error saving event: ${err.message}`);
    }
    finally {
      resetForm();
      fetchEvents();
    }
  }

  function resetForm() {
    setName("");
    setCategory("");
    setIcon("");
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setEventToDeleteId(id);
    setShowConfirmModal(true);
  }

  async function handleConfirmDelete() {
    if (!eventToDeleteId) return;

    const { error } = await supabase.from("events").delete().eq("id", eventToDeleteId);
    if (error) {
      toast.error("Error deleting event.");
    } else {
      toast.success("Event deleted successfully!");
      fetchEvents();
    }
    setShowConfirmModal(false);
    setEventToDeleteId(null);
  }

  function handleEdit(event: Event) {
    setEditingId(event.id);
    setName(event.name);
    setCategory(event.category || "");
    setIcon(event.icon);
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Events' }]} />
      <h1 className="text-2xl font-bold mb-4">🗓️ Manage Events</h1>
      <form
        onSubmit={handleAddOrUpdate}
        className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-full h-full border rounded px-3 py-2 bg-white flex items-center justify-center"
            >
              {icon ? <span className="text-2xl">{icon}</span> : "Select Icon"}
            </button>
            {showEmojiPicker && (
              <div className="absolute z-10">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="Enter event name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
          <SingleSelectDropdown
            options={categories.map(c => ({ id: c.name, name: c.name }))}
            selectedValue={category}
            onChange={setCategory}
            placeholder="Select a Category"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingId ? "Update Event" : "Add Event"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Icon</th>
              <th className="px-4 py-2 text-left">Event</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-2xl">{event.icon}</td>
                <td className="px-4 py-2 font-medium">{event.name}</td>
                <td className="px-4 py-2">{event.category || "—"}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(event)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors"
                    >
                      ✏️ Edit
                    </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="btn-danger py-1 px-3 text-sm rounded"
                  >
                    🗑️ Delete
                  </button>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2">🗓️</span>
                    <span>No events yet. Add your first event!</span>
                  </div>
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
        message="Are you sure you want to delete this event entry? This action cannot be undone."
      />
      <Toaster />
    </div>
  );
}
