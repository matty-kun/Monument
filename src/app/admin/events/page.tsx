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
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: "/admin/dashboard", label: "Dashboard" }, { label: "Manage Events" }]} />
      </div>

      <div className="mb-4 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-[32px] font-black text-white tracking-tight leading-none mb-2">
            {editingId ? 'Edit Event' : 'Manage Events'}
          </h1>
          <p className="text-[15px] text-white/50 font-semibold tracking-wide">
            Configure competitions, sports, and technical events
          </p>
        </div>
        {!selectedTournament?.is_archived && (
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-[#1c1c1e] border border-white/10 px-5 py-2.5 rounded-[16px] text-sm font-bold text-white hover:bg-white/5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <FaDownload size={14} /> Import from Past
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        {!selectedTournament?.is_archived && (
        <div className="lg:col-span-4 h-full flex flex-col min-h-0 pb-2">
            <div className="bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white/5 overflow-hidden transition-all flex flex-col h-full">
              <div className="p-6 border-b border-white/5 bg-[#1c1c1e] shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-white/40">{editingId ? 'Update Event' : 'Add New Event'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                <form onSubmit={handleAddOrUpdate} className="space-y-6">
                  {/* Visual Picker */}
                  <div className="space-y-4">
                    <div className="flex bg-white/5 p-1 rounded-2xl">
                      <button type="button" onClick={() => setVisualType('emoji')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${visualType === 'emoji' ? 'bg-white/10 shadow-sm text-white' : 'text-gray-500'}`}>Emoji</button>
                      <button type="button" onClick={() => setVisualType('photo')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${visualType === 'photo' ? 'bg-white/10 shadow-sm text-white' : 'text-gray-500'}`}>Photo</button>
                    </div>

                    <div className="flex flex-col items-center gap-4 bg-[#1c1c1e] p-6 rounded-[20px] border border-dashed border-white/10">
                        <div className="relative group w-20 h-20">
                          {visualType === 'photo' ? (
                            imagePreview ? <img src={imagePreview} className="w-full h-full object-contain rounded-[16px] shadow-md border border-white/5" alt="Preview"/> :
                            <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-[16px] text-3xl">🖼️</div>
                          ) : <div className="w-full h-full flex items-center justify-center text-4xl bg-white/5 rounded-[16px] shadow-inner border border-white/5">{icon || '🏆'}</div>}
                        </div>
                        
                        {visualType === 'photo' ? (
                          <div className="flex flex-col gap-2 w-full">
                            <label className="w-full cursor-pointer bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-center py-3 rounded-[16px] hover:border-[#0A84FF] transition-colors text-white/50 shadow-sm active:scale-95">
                              Choose Image File
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                                 <span className="text-[10px] font-bold uppercase">URL:</span>
                              </div>
                              <input 
                                type="text" 
                                placeholder="...or paste image link" 
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-[16px] text-[10px] font-bold text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent transition-all outline-none"
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
                          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-full py-3 bg-white/5 border border-white/10 rounded-[16px] text-[10px] font-bold uppercase hover:bg-white/10 transition-all text-gray-400">Pick Emoji</button>
                        )}

                        {showEmojiPicker && visualType === 'emoji' && (
                          <div className="absolute z-[80] mt-48 shadow-2xl">
                            <EmojiPicker theme={Theme.DARK} onEmojiClick={(d) => { setIcon(d.emoji); setShowEmojiPicker(false); }} />
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Event Title</label>
                      <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm font-bold text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent transition-all outline-none" placeholder="e.g. Basketball Men" required />
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
                    <button type="submit" disabled={uploading} className="w-full bg-[#0A84FF] hover:bg-[#0070e0] text-white font-bold py-4 rounded-[20px] transition-all shadow-lg text-[13px] tracking-wide active:scale-95 flex items-center justify-center disabled:opacity-50">
                      {uploading ? "SAVING..." : editingId ? "UPDATE EVENT" : "CREATE EVENT"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm} className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-[16px] hover:bg-white/10 transition-colors">Cancel Edit</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
        </div>
        )}

        {/* RIGHT COLUMN: List */}
        <div className={`${selectedTournament?.is_archived ? 'lg:col-span-12' : 'lg:col-span-8'} h-full flex flex-col min-h-0 pb-2`}>
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1c1c1e] p-2 rounded-[24px] border border-white/5 shadow-sm gap-4 shrink-0 mb-4">
               <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search events or categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 text-white border-none rounded-[16px] pl-12 pr-4 py-3 text-sm font-medium outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-gray-500" />
               </div>
               <div className="flex bg-white/5 p-1 rounded-xl shrink-0">
                  <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white/10 shadow-sm text-white' : 'text-gray-500'}`}><FaTable size={18}/></button>
                  <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white/10 shadow-sm text-white' : 'text-gray-500'}`}><FaThLarge size={18}/></button>
               </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                  <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white/5 flex flex-col h-full overflow-hidden transition-all">
                    <div className="overflow-y-auto custom-scrollbar overflow-x-auto relative flex-1">
                    <table className="w-full text-left border-collapse min-w-[600px] table-auto">
                      <thead className="bg-[#1c1c1e]/90 border-b border-white/5 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-8 py-5 text-left text-[12px] font-bold text-white/40 uppercase tracking-widest">Icon</th>
                          <th className="px-8 py-5 text-left text-[12px] font-bold text-white/40 uppercase tracking-widest">Event Name</th>
                          <th className="px-8 py-5 text-left text-[12px] font-bold text-white/40 uppercase tracking-widest">Category</th>
                          {!selectedTournament?.is_archived && <th className="px-8 py-5 text-right text-[12px] font-bold text-white/40 uppercase tracking-widest">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredEvents.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No events found</td></tr>
                        ) : filteredEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-5">
                              <PhotoOrEmoji icon={event.icon} className="w-10 h-10 object-cover rounded-xl border border-white/10 shadow-sm" />
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[14px] font-bold text-white tracking-tight">{formatEventName(event)}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="inline-flex px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-white/70 uppercase">{getCategoryName(event.category)}</span>
                            </td>
                            {!selectedTournament?.is_archived && (
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => { 
                                    setEditingId(event.id); setEventName(event.name); setSelectedCategory(event.category); setGender(event.gender || "N/A"); setDivision(event.division || "N/A");
                                    setIcon(event.icon || ""); setVisualType(event.icon?.startsWith('http') || event.icon?.startsWith('data:') ? 'photo' : 'emoji'); setImagePreview(event.icon?.startsWith('http') || event.icon?.startsWith('data:') ? event.icon : null); window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }} className="p-2 text-white/40 hover:text-[#0A84FF] hover:bg-white/5 rounded-xl transition-all"><FaEdit size={14} /></button>
                                  <button onClick={() => { setEventToDeleteId(event.id); setShowConfirmModal(true); }} className="p-2 text-white/40 hover:text-[#FF453A] hover:bg-white/5 rounded-xl transition-all"><FaTrash size={14} /></button>
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
                    <div key={event.id} className="bg-[#1c1c1e] p-5 rounded-[24px] shadow-sm border border-white/5 hover:border-white/20 transition-all group flex flex-col gap-3 relative">
                       <div className="flex items-center justify-between">
                          <PhotoOrEmoji icon={event.icon} className="w-12 h-12 object-cover rounded-2xl shadow-sm border border-white/5 bg-white/5" />
                          {!selectedTournament?.is_archived && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => { 
                                       setEditingId(event.id); setEventName(event.name); setSelectedCategory(event.category); setGender(event.gender || "N/A"); setDivision(event.division || "N/A");
                                       const isPhoto = event.icon?.startsWith('http'); setVisualType(isPhoto ? 'photo' : 'emoji'); setIcon(isPhoto ? "" : (event.icon || "")); setImagePreview(isPhoto ? (event.icon || null) : null);
                                       window.scrollTo({ top: 0, behavior: 'smooth' }); 
                               }} className="p-2 bg-white/5 border border-white/10 text-white/70 hover:text-[#0A84FF] hover:bg-white/10 rounded-[12px] shadow-sm transition-all"><FaEdit size={12}/></button>
                               <button onClick={() => { setEventToDeleteId(event.id); setShowConfirmModal(true); }} className="p-2 bg-white/5 border border-white/10 text-white/70 hover:text-[#FF453A] hover:bg-white/10 rounded-[12px] shadow-sm transition-all"><FaTrash size={12}/></button>
                            </div>
                          )}
                       </div>
                       <div className="flex-1">
                          <h4 className="text-[16px] font-bold text-white uppercase tracking-tight leading-tight mb-2">{formatEventName(event)}</h4>
                          <div className="flex flex-wrap items-center gap-2">
                             <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-white/70 uppercase tracking-widest">{getCategoryName(event.category)}</span>
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
