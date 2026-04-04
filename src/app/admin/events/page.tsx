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
import { FaTable, FaThLarge, FaSearch, FaPlus, FaTrash, FaEdit } from "react-icons/fa";

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase.from("events").select("id, name, icon, category, gender, division").order("name");
    if (!error) setEvents(data as Event[]);
  }, [supabase]);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from("categories").select("id, name").order("name");
    if (!error) setCategories(data as Category[]);
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
    document.title = "Manage Events | CITE FEST 2026";
    const channel = supabase.channel('events-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents, fetchCategories, supabase]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(null);
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { if (reader.result) setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImageAction(formData, 'event-images', 'events');
    return result.success ? result.publicUrl || null : null;
  };

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName.trim() || !selectedCategory) {
      toast.error("Event name and category are required.");
      return;
    }

    try {
      setUploading(true);
      let finalIcon = visualType === 'emoji' ? (icon || null) : (imagePreview || null);

      if (visualType === 'photo' && selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) finalIcon = uploadedUrl;
        else { toast.error("Failed to upload image."); setUploading(false); return; }
      }

      const eventData = {
        name: eventName,
        category: selectedCategory,
        gender: gender === "N/A" ? null : gender,
        division: division === "N/A" ? null : division,
        icon: finalIcon,
      };

      if (editingId) {
        const { error } = await supabase.from("events").update(eventData).eq("id", editingId);
        if (error) throw error;
        toast.success("Event updated successfully!");
      } else {
        const { error } = await supabase.from("events").insert([eventData]);
        if (error) throw error;
        toast.success("Event added successfully!");
      }
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
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

  async function handleConfirmDelete() {
    if (!eventToDeleteId) return;
    const toastId = toast.loading("Deleting event...");
    try {
      const eventToDel = events.find(e => e.id === eventToDeleteId);
      if (eventToDel?.icon?.startsWith('http')) {
        const urlParts = eventToDel.icon.split('/');
        const filePath = `events/${urlParts[urlParts.length - 1]}`;
        await deleteImageAction('event-images', filePath);
      }
      const { error } = await supabase.from("events").delete().eq("id", eventToDeleteId);
      if (error) throw error;
      toast.success("Event deleted!", { id: toastId });
      fetchEvents();
    } catch (error: any) {
      toast.error(`Deletion failed: ${error.message}`, { id: toastId });
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

  const genderOptions = useMemo(() => [
    { id: "N/A", name: "N/A (Not Applicable)" },
    { id: "Men", name: "Men" },
    { id: "Women", name: "Women" },
    { id: "Mixed", name: "Mixed" },
  ], []);

  const divisionOptions = useMemo(() => [
    { id: "N/A", name: "N/A (Not Applicable)" },
    { id: "Individual", name: "Individual" },
    { id: "Duo", name: "Duo" },
    { id: "Singles", name: "Singles" },
    { id: "Doubles", name: "Doubles" },
    { id: "Team", name: "Team" },
  ], []);

  const getCategoryName = useCallback((id: string) => categories.find((c) => c.id === id)?.name || "N/A", [categories]);

  const PhotoOrEmoji = ({ icon, className, emojiSize = "text-2xl" }: { icon?: string | null, className: string, emojiSize?: string }) => {
    const [isError, setIsError] = useState(false);
    if (!icon || isError) {
      return <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg ${className}`}>
        <span className={emojiSize}>🏆</span>
      </div>;
    }
    const isImage = icon.startsWith('http') || icon.startsWith('data:image');
    if (isImage) return <img src={icon} className={className} alt="" onError={() => setIsError(true)} />;
    return <div className={`flex items-center justify-center ${className}`}><span className={emojiSize}>{icon}</span></div>;
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter((e) => formatEventName(e).toLowerCase().includes(q) || getCategoryName(e.category).toLowerCase().includes(q));
  }, [events, searchQuery, formatEventName, getCategoryName]);

  return (
    <div className="w-full h-full dark:text-gray-200 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: "/admin/dashboard", label: "Dashboard" }, { label: "Manage Events" }]} />
      </div>

      <div className="mb-4 shrink-0">
        <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight">{editingId ? 'Edit Event' : 'Manage Events'}</h1>
        <p className="text-sm text-gray-500 font-medium">Configure competitions, sports, and technical events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-4 h-full flex flex-col min-h-0 pb-2">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-100">{editingId ? 'Update Event' : 'Add New Event'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                <form onSubmit={handleAddOrUpdate} className="space-y-6">
                  {/* Visual Picker */}
                  <div className="space-y-4">
                    <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-2xl">
                      <button type="button" onClick={() => setVisualType('emoji')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${visualType === 'emoji' ? 'bg-white dark:bg-gray-700 shadow-sm text-monument-primary' : 'text-gray-400'}`}>Emoji</button>
                      <button type="button" onClick={() => setVisualType('photo')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${visualType === 'photo' ? 'bg-white dark:bg-gray-700 shadow-sm text-monument-primary' : 'text-gray-400'}`}>Photo</button>
                    </div>

                    <div className="flex flex-col items-center gap-4 bg-gray-50/50 dark:bg-gray-900/20 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="relative group w-20 h-20">
                          {visualType === 'photo' ? (
                            imagePreview ? <img src={imagePreview} className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white dark:border-gray-600" alt="Preview"/> :
                            <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl text-3xl">🖼️</div>
                          ) : <div className="w-full h-full flex items-center justify-center text-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-inner">{icon || '🏆'}</div>}
                        </div>
                        
                        {visualType === 'photo' ? (
                          <label className="w-full cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-center py-3 rounded-xl hover:border-monument-primary transition-colors text-gray-500">
                            Upload Image
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                          </label>
                        ) : (
                          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase hover:bg-gray-50 transition-all text-gray-500">Pick Emoji</button>
                        )}

                        {showEmojiPicker && visualType === 'emoji' && (
                          <div className="absolute z-[80] mt-48 shadow-2xl">
                            <EmojiPicker theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT} onEmojiClick={(d) => { setIcon(d.emoji); setShowEmojiPicker(false); }} />
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Event Title</label>
                      <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-4 text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-monument-primary transition-all" placeholder="e.g. Basketball Men" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Gender</label>
                        <SingleSelectDropdown options={genderOptions} selectedValue={gender || "N/A"} onChange={setGender} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Division</label>
                        <SingleSelectDropdown options={divisionOptions} selectedValue={division || "N/A"} onChange={setDivision} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
                      <SingleSelectDropdown options={categories.map(c => ({ id: c.id, name: c.name }))} selectedValue={selectedCategory} onChange={setSelectedCategory} placeholder="Select category" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button type="submit" disabled={uploading} className="w-full bg-monument-primary hover:bg-monument-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-50">
                      {uploading ? "SAVING..." : editingId ? "UPDATE EVENT" : "CREATE EVENT"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold py-3 rounded-2xl hover:bg-gray-200 transition-colors">Cancel Edit</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
        </div>

        {/* RIGHT COLUMN: List */}
        <div className="lg:col-span-8 h-full flex flex-col min-h-0 pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm gap-4 shrink-0 mb-4">
               <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search events or categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium" />
               </div>
               <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl shrink-0">
                  <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-monument-primary' : 'text-gray-400'}`}><FaTable size={18}/></button>
                  <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-monument-primary' : 'text-gray-400'}`}><FaThLarge size={18}/></button>
               </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                  <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
                    <div className="overflow-y-auto custom-scrollbar overflow-x-auto relative flex-1">
                    <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700">
                      <thead className="bg-gray-50/50 dark:bg-gray-900/20 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Icon</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Name</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filteredEvents.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No events found</td></tr>
                        ) : filteredEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                            <td className="px-8 py-5">
                              <PhotoOrEmoji icon={event.icon} className="w-10 h-10 object-cover rounded-xl border-2 border-white dark:border-gray-700 shadow-sm" />
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight">{formatEventName(event)}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="inline-flex px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">{getCategoryName(event.category)}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { 
                                  setEditingId(event.id); setEventName(event.name); setSelectedCategory(event.category); setGender(event.gender || "N/A"); setDivision(event.division || "N/A");
                                  const isPhoto = event.icon?.startsWith('http'); setVisualType(isPhoto ? 'photo' : 'emoji'); setIcon(isPhoto ? "" : (event.icon || "")); setImagePreview(isPhoto ? (event.icon || null) : null);
                                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                }} className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all"><FaEdit /></button>
                                <button onClick={() => { setEventToDeleteId(event.id); setShowConfirmModal(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><FaTrash /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar p-2 h-full">
                  {filteredEvents.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-sm">No events found</div>
                  ) : filteredEvents.map((event) => (
                    <div key={event.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                       <div className="flex items-center gap-5">
                          <PhotoOrEmoji icon={event.icon} className="w-16 h-16 object-cover rounded-2xl shadow-md border-2 border-white dark:border-gray-700" emojiSize="text-4xl" />
                          <div className="flex-1 min-w-0">
                             <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight leading-tight truncate">{formatEventName(event)}</h4>
                             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{getCategoryName(event.category)}</p>
                          </div>
                       </div>
                       <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { 
                                  setEditingId(event.id); setEventName(event.name); setSelectedCategory(event.category); setGender(event.gender || "N/A"); setDivision(event.division || "N/A");
                                  const isPhoto = event.icon?.startsWith('http'); setVisualType(isPhoto ? 'photo' : 'emoji'); setIcon(isPhoto ? "" : (event.icon || "")); setImagePreview(isPhoto ? (event.icon || null) : null);
                                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                          }} className="w-8 h-8 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaEdit size={12}/></button>
                          <button onClick={() => { setEventToDeleteId(event.id); setShowConfirmModal(true); }} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaTrash size={12}/></button>
                       </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
