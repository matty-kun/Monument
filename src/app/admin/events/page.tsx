"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";

interface Category {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  icon?: string | null;
  category: string; // 👈 updated from category_id → category
  gender?: string | null;
  division?: string | null;
}

export default function ManageEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eventName, setEventName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [division, setDivision] = useState<string | null>(null);
  const [icon, setIcon] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // New state for emoji picker visibility
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  // ✅ Fetch Events
  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id, name, icon, category, gender, division")
      .order("name");

    if (error) {
      toast.error("Could not fetch events.");
      console.error("Error fetching events:", error);
    } else {
      setEvents(data as Event[]);
    }
  }, [supabase]);

  // ✅ Fetch Categories
  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      toast.error("Could not fetch categories.");
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data as Category[]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [fetchEvents, fetchCategories]);

  // ✅ Add or Update Event
  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (!eventName.trim() || !selectedCategory) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const eventData = {
        name: eventName,
        category: selectedCategory, // 👈 updated
        gender: gender === "N/A" ? null : gender,
        division: division === "N/A" ? null : division,
        icon: icon || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Event updated successfully!");
      } else {
        const { error } = await supabase.from("events").insert([eventData]);
        if (error) throw error;
        toast.success("Event added successfully!");
      }

      resetForm();
      fetchEvents();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Error saving event: ${err.message}`);
    }
  }

  function resetForm() {
    setEventName("");
    setSelectedCategory("");
    setGender(null);
    setDivision(null);
    setIcon("");
    setShowEmojiPicker(false); // Reset picker visibility
    setEditingId(null);
  }

  // ✅ Delete Event
  async function handleDelete(id: string) {
    setEventToDeleteId(id);
    setShowConfirmModal(true);
  }

  async function handleConfirmDelete() {
    if (!eventToDeleteId) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventToDeleteId);

    if (error) {
      toast.error("Error deleting event.");
    } else {
      toast.success("Event deleted successfully!");
      fetchEvents();
    }

    setShowConfirmModal(false);
    setEventToDeleteId(null);
  }

  const formatEventName = (event: Event) => {
    const parts = [event.name];
    if (event.division && event.division !== "N/A") parts.push(`(${event.division})`);
    if (event.gender && event.gender !== "N/A") parts.push(`- ${event.gender}`);
    return parts.join(" ");
  };

  // ✅ Dropdown Options
  const genderOptions = useMemo(
    () => [
      { id: "N/A", name: "N/A (Not Applicable)" },
      { id: "Men", name: "Men" },
      { id: "Women", name: "Women" },
      { id: "Mixed", name: "Mixed" },
    ],
    []
  );

  const divisionOptions = useMemo(
    () => [
      { id: "N/A", name: "N/A (Not Applicable)" },
      { id: "Individual", name: "Individual" },
      { id: "Duo", name: "Duo" },
      { id: "Singles", name: "Singles" },
      { id: "Doubles", name: "Doubles" },
      { id: "Team", name: "Team" },
    ],
    []
  );

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || "N/A";

  return (
    <div className="max-w-4xl mx-auto mt-10 dark:text-gray-200">
      <Breadcrumbs
        items={[
          { href: "/admin/dashboard", label: "Dashboard" },
          { label: "Manage Events" },
        ]}
      />

      <h1 className="text-4xl font-bold text-monument-green mb-4 dark:text-green-400">
        🏆 Manage Events
      </h1>

      {/* ✅ Add/Edit Form */}
      <form
        onSubmit={handleAddOrUpdate}
        className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow dark:bg-gray-800"
      >
        {/* Event Name + Icon */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="relative"> {/* Icon field */}
            <label
              htmlFor="icon"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Icon
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                id="icon"
                value={icon || ""}
                onChange={(e) => setIcon(e.target.value)}
                className="block w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 
                           focus:outline-none focus:ring-green-500 focus:border-green-500 
                           dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g., 🏀"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-2xl"
                title="Pick an emoji"
              >
                😀
              </button>
            </div>
            {showEmojiPicker && (
              <div className="absolute z-10 mt-2 left-0"> {/* Position the picker */}
                <EmojiPicker onEmojiClick={(emojiData: EmojiClickData) => { setIcon(emojiData.emoji); setShowEmojiPicker(false); }} />
              </div>
            )}
          </div>

          <div className="flex-grow w-full">
            <label
              htmlFor="eventName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                         focus:outline-none focus:ring-green-500 focus:border-green-500 
                         dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="e.g., Basketball, Vocal Solo"
              required
            />
          </div>
        </div>

        {/* Gender + Division */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender
            </label>
            <SingleSelectDropdown
              options={genderOptions}
              selectedValue={gender || "N/A"}
              onChange={setGender}
              placeholder="Select Gender"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Division
            </label>
            <SingleSelectDropdown
              options={divisionOptions}
              selectedValue={division || "N/A"}
              onChange={setDivision}
              placeholder="Select Division"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <SingleSelectDropdown
            options={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
            selectedValue={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Select Category"
          />
        </div>

        {/* Buttons */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
        >
          {editingId ? "Update Event" : "Add Event"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="w-full bg-gray-400 text-white py-2 rounded hover:bg-gray-500 transition-colors mt-2"
          >
            Cancel Edit
          </button>
        )}
      </form>

      {/* ✅ Event List */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Icon
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Event Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 whitespace-nowrap text-xl">
                    {event.icon || "❓"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {formatEventName(event)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {getCategoryName(event.category)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          setEditingId(event.id);
                          setEventName(event.name);
                          setSelectedCategory(event.category);
                          setGender(event.gender || "N/A");
                          setDivision(event.division || "N/A");
                          setShowEmojiPicker(false); // Hide picker when editing
                          setIcon(event.icon || "");
                        }}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleDelete(event.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                    No events yet.
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
        message="Are you sure you want to delete this event? This action cannot be undone."
      />

      <Toaster />
    </div>
  );
}
