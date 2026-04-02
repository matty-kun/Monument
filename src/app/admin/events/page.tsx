"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { uploadImageAction, deleteImageAction } from "../actions";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { FaTable, FaThLarge } from "react-icons/fa";

interface Category {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  icon?: string | null;
  category: string;
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
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState("");
  const [visualType, setVisualType] = useState<'emoji' | 'photo'>('emoji');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { resolvedTheme } = useTheme();
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

    // ✅ Set up Realtime Subscription
    const channel = supabase
      .channel('events-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          fetchEvents(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, fetchCategories, supabase]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear any old preview first
      setImagePreview(null);
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadImageAction(formData, 'event-images', 'events');

    if (!result.success) {
      console.error('Upload error:', result.error);
      return null;
    }

    return result.publicUrl || null;
  };

  // ✅ Add or Update Event
  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (!eventName.trim() || !selectedCategory) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setUploading(true);
      let finalIcon = visualType === 'emoji' ? (icon || null) : (imagePreview || null);

      if (visualType === 'photo' && selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) {
          finalIcon = uploadedUrl;
        } else {
          // If upload failed, don't proceed to save base64
          toast.error("Failed to upload image. Please check your storage bucket.");
          setUploading(false);
          return;
        }
      }

      // Final check: if we are in photo mode but have a long base64 string, don't save
      if (visualType === 'photo' && finalIcon?.startsWith('data:image')) {
        toast.error("Image upload didn't complete. Please try again.");
        setUploading(false);
        return;
      }

      const eventData = {
        name: eventName,
        category: selectedCategory,
        gender: gender === "N/A" ? null : gender,
        division: division === "N/A" ? null : division,
        icon: finalIcon,
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
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setEventName("");
    setSelectedCategory("");
    setGender(null);
    setDivision(null);
    setIcon("");
    setVisualType('emoji');
    setShowEmojiPicker(false);
    setImagePreview(null);
    setSelectedImage(null);
    setEditingId(null);
  }

  // ✅ Delete Event
  async function handleDelete(id: string) {
    setEventToDeleteId(id);
    setShowConfirmModal(true);
  }

  async function handleConfirmDelete() {
    if (!eventToDeleteId) return;

    const toastId = toast.loading("Deleting event...");

    try {
      const eventToDel = events.find(e => e.id === eventToDeleteId);
      if (eventToDel?.icon?.startsWith('http')) {
        const urlParts = eventToDel.icon.split('/');
        const filePath = `events/${urlParts[urlParts.length - 1]}`;
        const deleteRes = await deleteImageAction('event-images', filePath);
        if (!deleteRes.success) console.warn("Could not delete image from storage:", deleteRes.error);
      }

      // Attempt to delete the event. If this fails due to a foreign key,
      // the error message will tell us which table is dependent.
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventToDeleteId);

      if (error) throw error;

      toast.success("Event deleted successfully!", { id: toastId });
      fetchEvents(); // Refresh the list
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error deleting event:", err);
      toast.error(`Deletion failed: ${err.message}`, { id: toastId });
    }

    setShowConfirmModal(false);
    setEventToDeleteId(null);
  }

  const formatEventName = useCallback((event: Event) => {
    const parts = [event.name];
    if (event.division && event.division !== "N/A") parts.push(`(${event.division})`);
    if (event.gender && event.gender !== "N/A") parts.push(`- ${event.gender}`);
    return parts.join(" ");
  }, []);

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

  const getCategoryName = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name || "N/A",
    [categories]
  );

  // ✅ Helper for Rendering Photo or Emoji with Fallback
  const PhotoOrEmoji = ({ icon, className, emojiSize = "text-2xl" }: { icon?: string | null, className: string, emojiSize?: string }) => {
    const [isError, setIsError] = useState(false);
    
    if (!icon || isError) {
      return <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg ${className}`}>
        <span className={emojiSize}>{(!icon || isError) ? '🏆' : icon}</span>
      </div>;
    }

    const isImage = icon.startsWith('http') || icon.startsWith('data:image');
    
    if (isImage) {
      return <img 
        src={icon} 
        className={className} 
        alt="" 
        onError={() => setIsError(true)} 
      />;
    }

    return <div className={`flex items-center justify-center ${className}`}>
      <span className={emojiSize}>{icon}</span>
    </div>;
  };

  // ✅ Filtered Events
  const filteredEvents = useMemo(() => {
    if (!searchQuery) {
      return events;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return events.filter((event) => {
      const eventName = formatEventName(event).toLowerCase();
      const categoryName = getCategoryName(event.category).toLowerCase();
      return eventName.includes(lowercasedQuery) || categoryName.includes(lowercasedQuery);
    });
  }, [events, searchQuery, formatEventName, getCategoryName]);

  return (
    <div className="max-w-4xl mx-auto mt-10 dark:text-gray-200">
      <Breadcrumbs
        items={[
          { href: "/admin/dashboard", label: "Dashboard" },
          { label: "Manage Events" },
        ]}
      />

      <h1 className="text-4xl font-bold text-monument-primary mb-4">
        🏆 Manage Events
      </h1>

      {/* ✅ Add/Edit Form */}
      <form
        onSubmit={handleAddOrUpdate}
        className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow dark:bg-gray-800"
      >
        {/* Event Visual Choice + Name */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 space-y-4">
             {/* Mode Selector Tabs */}
             <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
               <button 
                 type="button" 
                 onClick={() => setVisualType('emoji')}
                 className={`flex-1 py-2 text-[0.65rem] font-black uppercase tracking-widest rounded-lg transition-all ${visualType === 'emoji' ? 'bg-white dark:bg-gray-600 shadow-sm text-monument-primary' : 'text-gray-400'}`}
               >
                 Emoji
               </button>
               <button 
                 type="button" 
                 onClick={() => setVisualType('photo')}
                 className={`flex-1 py-2 text-[0.65rem] font-black uppercase tracking-widest rounded-lg transition-all ${visualType === 'photo' ? 'bg-white dark:bg-gray-600 shadow-sm text-monument-primary' : 'text-gray-400'}`}
               >
                 Photo
               </button>
             </div>

             <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                <div className="relative group w-24 h-24 mb-4">
                  {(imagePreview || icon) && (
                    <button
                      type="button"
                      onClick={() => { setIcon(""); setImagePreview(null); setSelectedImage(null); }}
                      className="absolute -top-2 -right-2 z-10 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  
                  {visualType === 'photo' ? (
                    imagePreview ? (
                      <img 
                        src={imagePreview} 
                        className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white dark:border-gray-600" 
                        alt="Preview" 
                        onError={() => setImagePreview(null)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400">
                        <span className="text-3xl text-gray-300">🖼️</span>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-white dark:bg-gray-700 rounded-2xl shadow-inner border border-gray-100 dark:border-gray-600">
                      {icon || '🏆'}
                    </div>
                  )}
                </div>

                {visualType === 'photo' ? (
                  <label className="w-full cursor-pointer bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[0.65rem] font-black uppercase tracking-widest text-center py-2.5 rounded-lg hover:border-monument-primary transition-colors text-gray-500">
                    Choose Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2.5 hover:bg-gray-100 text-[0.65rem] font-black uppercase text-gray-500 tracking-widest transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pick Emoji
                  </button>
                )}

                {showEmojiPicker && visualType === 'emoji' && (
                  <div className="absolute z-[80] mt-48 shadow-2xl">
                    <EmojiPicker 
                      theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
                      onEmojiClick={(emojiData: EmojiClickData) => { setIcon(emojiData.emoji); setShowEmojiPicker(false); }} 
                    />
                  </div>
                )}
             </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="block text-[0.7rem] font-black uppercase tracking-widest text-gray-400 mb-1">
                Event Name <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="input w-full"
                placeholder="e.g. Basketball, Creative Dance"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] font-black uppercase tracking-widest text-gray-400 mb-1">Gender</label>
                <SingleSelectDropdown options={genderOptions} selectedValue={gender || "N/A"} onChange={setGender} />
              </div>
              <div>
                <label className="block text-[0.7rem] font-black uppercase tracking-widest text-gray-400 mb-1">Division</label>
                <SingleSelectDropdown options={divisionOptions} selectedValue={division || "N/A"} onChange={setDivision} />
              </div>
            </div>

            <div>
              <label className="block text-[0.7rem] font-black uppercase tracking-widest text-gray-400 mb-1">
                Category <span className="text-red-500 font-bold">*</span>
              </label>
              <SingleSelectDropdown options={categories.map(c => ({ id: c.id, name: c.name }))} selectedValue={selectedCategory} onChange={setSelectedCategory} />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-monument-primary text-white py-3 rounded-xl font-bold hover:bg-monument-dark transition-all disabled:opacity-50"
        >
          {uploading ? "Saving..." : editingId ? "Update Event" : "Add Event"}
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

      {/* Search and View Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-1/2">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search events or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="inline-flex rounded-md shadow-sm bg-white dark:bg-gray-800 self-end">
          <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm font-medium rounded-l-lg flex items-center gap-2 ${viewMode === 'table' ? 'bg-monument-primary text-white dark:bg-violet-600' : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <FaTable />
            Table
          </button>
          <button onClick={() => setViewMode('card')} className={`px-3 py-1 text-sm font-medium rounded-r-lg flex items-center gap-2 ${viewMode === 'card' ? 'bg-monument-primary text-white dark:bg-violet-600' : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <FaThLarge />
            Cards
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="table-container"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Icon</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Event Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
                {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PhotoOrEmoji icon={event.icon} className="w-10 h-10 object-cover rounded-lg border dark:border-gray-600" emojiSize="text-2xl" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">{formatEventName(event)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{getCategoryName(event.category)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => { 
                            setEditingId(event.id); 
                            setEventName(event.name); 
                            setSelectedCategory(event.category); 
                            setGender(event.gender || "N/A"); 
                            setDivision(event.division || "N/A"); 
                            setShowEmojiPicker(false); 
                            const isPhoto = event.icon?.startsWith('http');
                            setVisualType(isPhoto ? 'photo' : 'emoji');
                            setIcon(isPhoto ? "" : (event.icon || "")); 
                            setImagePreview(isPhoto ? (event.icon || null) : null); 
                            window.scrollTo({ top: 0, behavior: 'smooth' }); 
                          }} 
                          className="p-2 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors text-lg" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                          </button>
                          <button onClick={() => handleDelete(event.id)} className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors text-lg" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-gray-500">No events yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredEvents.map((event) => (
              <Card key={event.id} className="flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fadeIn">
                <CardHeader className="p-4">
                  <div className="flex items-center gap-4">
                    <PhotoOrEmoji icon={event.icon} className="w-14 h-14 object-cover rounded-2xl shadow-md border-2 border-white dark:border-gray-700" emojiSize="text-4xl" />
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold leading-tight">{formatEventName(event)}</CardTitle>
                      <CardDescription className="text-xs">{getCategoryName(event.category)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 flex gap-2 justify-end rounded-b-lg mt-auto">
                  <button
                    onClick={() => {
                      setEditingId(event.id);
                      setEventName(event.name);
                      setSelectedCategory(event.category);
                      setGender(event.gender || "N/A");
                      setDivision(event.division || "N/A");
                      setShowEmojiPicker(false);
                      const isPhoto = event.icon?.startsWith('http');
                      setVisualType(isPhoto ? 'photo' : 'emoji');
                      setIcon(isPhoto ? "" : (event.icon || ""));
                      setImagePreview(isPhoto ? (event.icon || null) : null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-1.5 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors text-lg" title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors text-lg" title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </Card>
            ))}
            {filteredEvents.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">{searchQuery ? "No Events Match Your Search" : "No Events Yet"}</h3>
                <p className="text-gray-500 dark:text-gray-400">{searchQuery ? "Try a different search term." : "Add a new event using the form above."}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
