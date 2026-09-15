"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { FaTable, FaThLarge, FaSearch, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { useTournament } from "@/components/AdminTournamentProvider";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useEventsViewModel } from "@/features/admin/events/viewModels/useEventsViewModel";
import { X } from "lucide-react";

export default function ManageEventsPage() {
  const { resolvedTheme } = useTheme();
  const { selectedTournament } = useTournament();
  const [showEventModal, setShowEventModal] = useState(false);

  const {
    events,
    categories,
    eventName,
    setEventName,
    selectedCategory,
    setSelectedCategory,
    gender,
    setGender,
    division,
    setDivision,
    icon,
    setIcon,
    showEmojiPicker,
    setShowEmojiPicker,
    editingId,
    setEditingId,
    showConfirmModal,
    setShowConfirmModal,
    eventToDeleteId,
    setEventToDeleteId,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    visualType,
    setVisualType,
    selectedImage,
    setSelectedImage,
    imagePreview,
    setImagePreview,
    uploading,
    setUploading,
    isDeleting,
    setIsDeleting,
    handleImageSelect,
    handleAddOrUpdate,
    resetForm,
    handleConfirmDelete,
    formatEventName,
    genderOptions,
    divisionOptions,
    getCategoryName,
    filteredEvents,
  } = useEventsViewModel({ selectedTournament });

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowEmojiPicker(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEmojiPicker, setShowEmojiPicker]);

  const PhotoOrEmoji = ({ icon, className, emojiSize = "text-2xl" }: { icon?: string | null, className: string, emojiSize?: string }) => {
    const [isError, setIsError] = useState(false);
    if (!icon || isError) {
      return <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg ${className}`}>
        <span className={emojiSize}>🏆</span>
      </div>;
    }
    const isImage = icon.startsWith('http') || icon.startsWith('data:image');
    if (isImage) return <img src={icon} className={`${className} object-contain`} alt="" onError={() => setIsError(true)} />;
    return <div className={`flex items-center justify-center ${className}`}><span className={emojiSize}>{icon}</span></div>;
  };

  if (!selectedTournament) return <EmptyTournamentState />;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: "/admin/dashboard", label: "Dashboard" }, { label: "Manage Events" }]} />
      </div>

      <div className="mb-4 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-[32px] font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
            {editingId ? 'Edit Event' : 'Manage Events'}
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-white/50 font-semibold tracking-wide">
            Configure competitions, sports, and technical events
          </p>
        </div>
        {!selectedTournament?.is_archived && (
          <button 
            onClick={() => {
              resetForm();
              setShowEventModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#269a7a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b7359] active:scale-95"
          >
            <FaPlus size={12} /> Add event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        {!selectedTournament?.is_archived && showEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <button className="absolute inset-0 cursor-default" aria-label="Close add event form" onClick={() => setShowEventModal(false)} />
            <div className="relative max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[24px] bg-white shadow-2xl border border-gray-200 dark:bg-[#1c1c1e] dark:border-white/5 transition-all flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#1c1c1e] shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">{editingId ? 'Update Event' : 'Add New Event'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                <form onSubmit={handleAddOrUpdate} className="space-y-6">
                  {/* Visual Picker */}
                  <div className="space-y-4">
                    <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
                      <button type="button" onClick={() => setVisualType('emoji')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${visualType === 'emoji' ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Emoji</button>
                      <button type="button" onClick={() => { setVisualType('photo'); setShowEmojiPicker(false); }} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${visualType === 'photo' ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Photo</button>
                    </div>

                    <div className="flex flex-col items-center gap-4 bg-gray-50 dark:bg-[#1c1c1e] p-6 rounded-[20px] border border-dashed border-gray-300 dark:border-white/10">
                        <div className="relative group w-20 h-20">
                          {visualType === 'photo' ? (
                            imagePreview ? <img src={imagePreview} className="w-full h-full object-contain rounded-[16px] shadow-md border border-gray-200 dark:border-white/5" alt="Preview"/> :
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-[16px] text-3xl">🖼️</div>
                          ) : <div className="w-full h-full flex items-center justify-center text-4xl bg-white dark:bg-white/5 rounded-[16px] shadow-inner border border-gray-200 dark:border-white/5">{icon || '🏆'}</div>}
                        </div>
                        
                        {visualType === 'photo' ? (
                          <div className="flex flex-col gap-2 w-full">
                            <label className="w-full cursor-pointer bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-center py-3 rounded-[16px] hover:border-monument-primary transition-colors text-gray-500 dark:text-white/50 shadow-sm active:scale-95">
                              Choose Image File
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                 <span className="text-[10px] font-bold uppercase">URL:</span>
                              </div>
                              <input 
                                type="text" 
                                placeholder="...or paste image link" 
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-[16px] text-[10px] font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-monument-primary focus:border-transparent transition-all outline-none"
                                value={imagePreview && !selectedImage && (typeof imagePreview === 'string') && imagePreview.startsWith('http') ? imagePreview : ''}
                                onChange={(e) => {
                                   const val = e.target.value;
                                   setImagePreview(val);
                                   if (val) {
                                      setSelectedImage(null);
                                   }
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setShowEmojiPicker(true)} className="w-full py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[16px] text-[10px] font-bold uppercase hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-gray-400">Choose Emoji</button>
                        )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Event Title</label>
                      <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-monument-primary focus:border-transparent transition-all outline-none" placeholder="e.g. Basketball Men" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Gender</label>
                        <SingleSelectDropdown options={genderOptions} selectedValue={gender || "N/A"} onChange={setGender} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Division</label>
                        <SingleSelectDropdown options={divisionOptions} selectedValue={division || "N/A"} onChange={setDivision} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Category</label>
                      <SingleSelectDropdown options={categories.map(c => ({ id: c.id, name: c.name }))} selectedValue={selectedCategory} onChange={setSelectedCategory} placeholder="Select category" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button type="submit" disabled={uploading} className="w-full bg-[#269a7a] hover:bg-[#1b7359] text-white font-bold py-4 rounded-[20px] transition-all shadow-sm text-[13px] tracking-wide active:scale-95 flex items-center justify-center disabled:opacity-50">
                      {uploading ? "SAVING..." : editingId ? "UPDATE EVENT" : "CREATE EVENT"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white font-bold py-3 rounded-[16px] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel Edit</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
        </div>
        )}

        {/* RIGHT COLUMN: List */}
        <div className="lg:col-span-12 h-full flex flex-col min-h-0 pb-2">
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 mb-4">
               <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" />
                  <input type="text" placeholder="Search events or categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-transparent focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 rounded-[16px] text-[13px] font-medium transition-all outline-none shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500" />
               </div>
               <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl shrink-0">
                  <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><FaTable size={18}/></button>
                  <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><FaThLarge size={18}/></button>
               </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                  <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-sm border border-gray-200 dark:border-white/5 flex flex-col h-full overflow-hidden transition-all">
                    <div className="overflow-y-auto custom-scrollbar overflow-x-auto relative flex-1">
                    <table className="w-full text-left border-collapse min-w-[600px] table-auto">
                      <thead className="bg-gray-50 dark:bg-[#1c1c1e]/90 border-b border-gray-200 dark:border-white/5 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-8 py-5 text-left text-[12px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">Icon</th>
                          <th className="px-8 py-5 text-left text-[12px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">Event Name</th>
                          <th className="px-8 py-5 text-left text-[12px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">Category</th>
                          {!selectedTournament?.is_archived && <th className="px-8 py-5 text-right text-[12px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredEvents.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No events found</td></tr>
                        ) : filteredEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-5">
                              <PhotoOrEmoji icon={event.icon} className="w-10 h-10 object-cover rounded-xl border border-gray-200 dark:border-white/10 shadow-sm bg-white dark:bg-transparent" />
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[14px] font-bold text-gray-900 dark:text-white tracking-tight">{formatEventName(event)}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="inline-flex px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-full text-[10px] font-bold text-gray-600 dark:text-white/70 uppercase">{getCategoryName(event.category)}</span>
                            </td>
                            {!selectedTournament?.is_archived && (
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => { 
                                    setEditingId(event.id); setEventName(event.name); setSelectedCategory(event.category); setGender(event.gender || "N/A"); setDivision(event.division || "N/A");
                                    setIcon(event.icon || ""); setVisualType(event.icon?.startsWith('http') || event.icon?.startsWith('data:') ? 'photo' : 'emoji'); setImagePreview(event.icon?.startsWith('http') || event.icon?.startsWith('data:') ? event.icon : null); setShowEventModal(true);
                                  }} className="p-2 bg-yellow-400/15 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/25 rounded-xl transition-all"><FaEdit size={14} /></button>
                                  <button onClick={() => { setEventToDeleteId(event.id); setShowConfirmModal(true); }} className="p-2 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-xl transition-all"><FaTrash size={14} /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar p-2 h-full">
                  {filteredEvents.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-sm">No events found</div>
                  ) : filteredEvents.map((event) => (
                    <div key={event.id} className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] shadow-sm border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-all group flex flex-col gap-3 relative">
                       <div className="flex items-center justify-between">
                          <PhotoOrEmoji icon={event.icon} className="w-12 h-12 object-cover rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5" />
                          {!selectedTournament?.is_archived && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => { 
                                       setEditingId(event.id); setEventName(event.name); setSelectedCategory(event.category); setGender(event.gender || "N/A"); setDivision(event.division || "N/A");
                                       const isPhoto = event.icon?.startsWith('http'); setVisualType(isPhoto ? 'photo' : 'emoji'); setIcon(isPhoto ? "" : (event.icon || "")); setImagePreview(isPhoto ? (event.icon || null) : null);
                                       setShowEventModal(true);
                               }} className="p-2 bg-yellow-400/20 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/30 rounded-[12px] shadow-sm transition-all"><FaEdit size={12}/></button>
                               <button onClick={() => { setEventToDeleteId(event.id); setShowConfirmModal(true); }} className="p-2 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-[12px] shadow-sm transition-all"><FaTrash size={12}/></button>
                            </div>
                          )}
                       </div>
                       <div className="flex-1">
                          <h4 className="text-[16px] font-bold text-gray-900 dark:text-white uppercase tracking-tight leading-tight mb-2">{formatEventName(event)}</h4>
                          <div className="flex flex-wrap items-center gap-2">
                             <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-full text-[9px] font-bold text-gray-600 dark:text-white/70 uppercase tracking-widest">{getCategoryName(event.category)}</span>
                             {(event.gender && event.gender !== "N/A") || (event.division && event.division !== "N/A") ? (
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                  {event.gender !== "N/A" ? event.gender : ''} 
                                  {event.division !== "N/A" ? ` • ${event.division}` : ''}
                                </span>
                             ) : null}
                          </div>
                       </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEmojiPicker && visualType === 'emoji' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="emoji-picker-title"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() => setShowEmojiPicker(false)}
              aria-label="Close emoji picker"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#171a18]"
            >
              <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-white/10">
                <div className="min-w-0">
                  <h2 id="emoji-picker-title" className="text-sm font-semibold text-gray-900 dark:text-white">Choose an event icon</h2>
                  <p className="truncate text-xs text-gray-500 dark:text-white/45">{eventName || "New event"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="admin-icon-button shrink-0"
                  aria-label="Close emoji picker"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="p-2">
                <EmojiPicker
                  theme={resolvedTheme === "light" ? Theme.LIGHT : Theme.DARK}
                  width="100%"
                  height={430}
                  searchPlaceholder="Search icons"
                  previewConfig={{ showPreview: false }}
                  onEmojiClick={(detail) => {
                    setIcon(detail.emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
      
      <Toaster />

      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[10000] flex flex-col items-center justify-center text-white text-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 border-4 border-monument-primary border-t-white rounded-full animate-spin mb-8 shadow-2xl shadow-violet-500/20" />
              <h2 className="text-3xl font-black uppercase tracking-[0.2em] mb-2 leading-none">Deleting</h2>
              <div className="h-1 w-12 bg-monument-primary rounded-full mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Processing Database Permanent Directive</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
