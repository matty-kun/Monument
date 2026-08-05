"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { FaTable, FaThLarge, FaSearch, FaPlus, FaTrash, FaEdit, FaDownload } from "react-icons/fa";
import { useTournament } from "@/components/AdminTournamentProvider";
import ImportFromTournamentModal from "../../../components/ImportFromTournamentModal";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useEventsViewModel } from "@/features/admin/events/viewModels/useEventsViewModel";

export default function ManageEventsPage() {
  const { resolvedTheme } = useTheme();
  const { selectedTournament } = useTournament();

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
    showImportModal,
    setShowImportModal,
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
    handleImportEvents,
    formatEventName,
    genderOptions,
    divisionOptions,
    getCategoryName,
    filteredEvents,
  } = useEventsViewModel({ selectedTournament });

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
    <div className="w-full h-full dark:text-gray-200 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: "/admin/dashboard", label: "Dashboard" }, { label: "Manage Events" }]} />
      </div>

      <div className="mb-4 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight">{editingId ? 'Edit Event' : 'Manage Events'}</h1>
          <p className="text-sm text-gray-500 font-medium">Configure competitions, sports, and technical events</p>
        </div>
        {!selectedTournament?.is_archived && (
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-monument-primary hover:border-monument-primary dark:hover:text-violet-400 dark:hover:border-violet-500 transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <FaDownload size={14} /> Import from Past
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        {!selectedTournament?.is_archived && (
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
                            imagePreview ? <img src={imagePreview} className="w-full h-full object-contain rounded-2xl shadow-md border-2 border-white dark:border-gray-600" alt="Preview"/> :
                            <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl text-3xl">🖼️</div>
                          ) : <div className="w-full h-full flex items-center justify-center text-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-inner">{icon || '🏆'}</div>}
                        </div>
                        
                        {visualType === 'photo' ? (
                          <div className="flex flex-col gap-2 w-full">
                            <label className="w-full cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-center py-3 rounded-xl hover:border-monument-primary transition-colors text-gray-500 shadow-sm active:scale-95">
                              Choose Image File
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                 <span className="text-[10px] font-bold uppercase">URL:</span>
                              </div>
                              <input 
                                type="text" 
                                placeholder="...or paste image link" 
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-monument-primary transition-all outline-none"
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
        )}

        {/* RIGHT COLUMN: List */}
        <div className={`${selectedTournament?.is_archived ? 'lg:col-span-12' : 'lg:col-span-8'} h-full flex flex-col min-h-0 pb-2`}>
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
                          {!selectedTournament?.is_archived && <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>}
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
                            {!selectedTournament?.is_archived && (
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
                    <div key={event.id} className="bg-white dark:bg-gray-700 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-xl transition-all group flex flex-col gap-3 relative">
                       <div className="flex items-center justify-between">
                          <PhotoOrEmoji icon={event.icon} className="w-12 h-12 object-cover rounded-2xl shadow-md border border-gray-100 dark:border-gray-600" />
                          {!selectedTournament?.is_archived && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => { 
                                       setEditingId(event.id); setEventName(event.name); setSelectedCategory(event.category); setGender(event.gender || "N/A"); setDivision(event.division || "N/A");
                                       const isPhoto = event.icon?.startsWith('http'); setVisualType(isPhoto ? 'photo' : 'emoji'); setIcon(isPhoto ? "" : (event.icon || "")); setImagePreview(isPhoto ? (event.icon || null) : null);
                                       window.scrollTo({ top: 0, behavior: 'smooth' }); 
                               }} className="p-2 bg-yellow-400 text-yellow-900 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"><FaEdit size={12}/></button>
                               <button onClick={() => { setEventToDeleteId(event.id); setShowConfirmModal(true); }} className="p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"><FaTrash size={12}/></button>
                            </div>
                          )}
                       </div>
                       <div className="flex-1">
                          <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight mb-2">{formatEventName(event)}</h4>
                          <div className="flex flex-wrap items-center gap-2">
                             <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded-full text-[9px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-tighter">{getCategoryName(event.category)}</span>
                             {(event.gender && event.gender !== "N/A") || (event.division && event.division !== "N/A") ? (
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tighter">
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

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />
      
      <ImportFromTournamentModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportEvents}
        currentTournamentId={selectedTournament?.id || ""}
        title="Clone Events"
        description="Select a past tournament to instantly clone its entire list of sports and events into the current season. Duplicates will be skipped."
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
