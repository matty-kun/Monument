"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
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

  const supabase = createClient(); // Moved before useEffect

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase.from("events").select("*").order("name");
    if (!error && data) setEvents(data);
  }, [supabase]);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    if (!error && data) setCategories(data);
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [fetchEvents, fetchCategories]);

  function onEmojiClick(emojiData: EmojiClickData) {
    setIcon(emojiData.emoji);
    setShowEmojiPicker(false);
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
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
    } finally {
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
    <div className="max-w-4xl mx-auto mt-10 dark:text-gray-200">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Events' }]} />
      <h1 className="text-4xl font-bold text-monument-green mb-4 dark:text-green-400">🏟️ Manage Events</h1>
      <form
        onSubmit={handleAddOrUpdate}
        className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow dark:bg-gray-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-full h-full border rounded px-3 py-2 bg-white flex items-center justify-center dark:bg-gray-700 dark:border-gray-600"
            >
              {icon ? (
                <span className="text-2xl">{icon}</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">Select Icon</span>
              )}
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
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600"
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
            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingId ? "Update Event" : "Add Event"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800">
        <div className="table-container">
          <table className="min-w-full">
            <thead className="table-header bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="table-cell text-left dark:text-gray-300">Icon</th>
                <th className="table-cell text-left dark:text-gray-300">Event</th>
                <th className="table-cell text-left dark:text-gray-300">Category</th>
                <th className="table-cell text-center dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
              {events.map((event) => (
                <tr key={event.id} className="table-row dark:hover:bg-gray-700/50">
                  <td className="table-cell text-2xl">{event.icon}</td>
                  <td className="table-cell font-medium dark:text-gray-100">{event.name}</td>
                  <td className="table-cell dark:text-gray-300">{event.category || "—"}</td>
                  <td className="table-cell">
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
                  <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
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