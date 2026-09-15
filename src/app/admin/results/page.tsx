"use client";

import { motion, AnimatePresence } from "framer-motion";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useTournament } from "@/components/AdminTournamentProvider";
import { useResultsViewModel } from "@/features/admin/results/viewModels/useResultsViewModel";
import { Pencil, Plus, Search, Trash2, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function AddResultPage() {
  const { selectedTournament } = useTournament();

  const {
    competingDepartments,
    eventId,
    setEventId,
    goldId,
    setGoldId,
    silverId,
    setSilverId,
    bronzeId,
    setBronzeId,
    showConfirmModal,
    setShowConfirmModal,
    isEditing,
    setIsEditing,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    isDeleting,
    isSubmitting,
    groupedRecentResults,
    groupedEvents,
    handleSubmit,
    handleConfirmDelete,
    handleDeleteEventResults,
    handleEditByEvent,
    getMedalStyles,
  } = useResultsViewModel({ selectedTournament });
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const closeResultModal = useCallback(() => {
    setIsResultModalOpen(false);
    setIsEditing(false);
    setEventId("");
    setGoldId("awaiting");
    setSilverId("awaiting");
    setBronzeId("awaiting");
  }, [setBronzeId, setEventId, setGoldId, setIsEditing, setSilverId]);

  const submitResults = async () => {
    const saved = await handleSubmit();
    if (saved) closeResultModal();
  };

  const openResultForEditing = async (selectedEventId: string) => {
    setIsResultModalOpen(true);
    await handleEditByEvent(selectedEventId);
  };

  useEffect(() => {
    if (!isResultModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) closeResultModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeResultModal, isResultModalOpen, isSubmitting]);

  if (!selectedTournament) return <EmptyTournamentState />;

  return (
    <div className="w-full h-full text-gray-900 dark:text-white flex flex-col overflow-hidden max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Results' }]} />
      </div>

      <div className="mb-4 flex shrink-0 items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-[32px] font-black leading-none tracking-tight text-gray-900 dark:text-white">Results</h1>
          <p className="text-[15px] font-semibold tracking-wide text-gray-500 dark:text-white/50">Review competition winners and recorded points</p>
        </div>
        {!selectedTournament.is_archived && (
          <button
            type="button"
            onClick={() => setIsResultModalOpen(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#269a7a] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1b7359]"
          >
            <Plus size={17} />
            Add results
          </button>
        )}
      </div>

      <div className="flex flex-1 min-h-0 pb-2">
        <AnimatePresence>
          {isResultModalOpen && !selectedTournament.is_archived && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="result-modal-title"
            >
              <button
                type="button"
                className="absolute inset-0 cursor-default"
                onClick={() => !isSubmitting && closeResultModal()}
                aria-label="Close results form"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="relative z-10 flex max-h-[calc(100vh-32px)] w-full max-w-[520px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1c1c1e]"
              >
              <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-white/10 dark:bg-[#1c1c1e]">
                <div>
                  <h2 id="result-modal-title" className="text-sm font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit event results' : 'Add event results'}</h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-white/45">Select the event, then assign its medal placements.</p>
                </div>
                <button type="button" onClick={closeResultModal} disabled={isSubmitting} className="admin-icon-button shrink-0" aria-label="Close results form">
                  <X size={17} />
                </button>
              </div>
              
              <div className="relative flex flex-col overflow-y-auto p-5 custom-scrollbar">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 dark:text-gray-500">Step 1: Select Event</label>
                    <SingleSelectDropdown
                      options={groupedEvents}
                      selectedValue={eventId}
                      onChange={(id) => {
                        setEventId(id);
                        setGoldId("awaiting");
                        setSilverId("awaiting");
                        setBronzeId("awaiting");
                        if (!id) setIsEditing(false);
                      }}
                      placeholder="Pick a competition"
                    />
                  </div>



                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 dark:text-gray-500">Step 2: Assign Medals</label>
                    <div className="space-y-4 font-bold">
                      {/* Gold */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">🥇</span>
                        <div className="flex-1">
                          <SingleSelectDropdown
                            options={[
                              { id: "", name: "No Team", icon: "✖️" },
                              { id: "awaiting", name: "Awaiting Result...", icon: "⏳" },
                              ...competingDepartments.filter(d => d.id !== silverId && d.id !== bronzeId)
                            ]}
                            selectedValue={goldId}
                            onChange={(id) => {
                              setGoldId(id);
                              if (id !== "" && id !== "awaiting" && id === silverId) setSilverId("");
                              if (id !== "" && id !== "awaiting" && id === bronzeId) setBronzeId("");
                            }}
                            placeholder="Select Gold Team"
                            disabled={!eventId}
                          />
                        </div>
                      </div>

                      {/* Silver */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">🥈</span>
                        <div className="flex-1">
                          <SingleSelectDropdown
                            options={[
                              { id: "", name: "No Team", icon: "✖️" },
                              { id: "awaiting", name: "Awaiting Result...", icon: "⏳" },
                              ...competingDepartments.filter(d => d.id !== goldId && d.id !== bronzeId)
                            ]}
                            selectedValue={silverId}
                            onChange={(id) => {
                              setSilverId(id);
                              if (id !== "" && id !== "awaiting" && id === goldId) setGoldId("");
                              if (id !== "" && id !== "awaiting" && id === bronzeId) setBronzeId("");
                            }}
                            placeholder="Select Silver Team"
                            disabled={!eventId}
                          />
                        </div>
                      </div>

                      {/* Bronze */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">🥉</span>
                        <div className="flex-1">
                          <SingleSelectDropdown
                            options={[
                              { id: "", name: "No Team", icon: "✖️" },
                              { id: "awaiting", name: "Awaiting Result...", icon: "⏳" },
                              ...competingDepartments.filter(d => d.id !== goldId && d.id !== silverId)
                            ]}
                            selectedValue={bronzeId}
                            onChange={(id) => {
                              setBronzeId(id);
                              if (id !== "" && id !== "awaiting" && id === goldId) setGoldId("");
                              if (id !== "" && id !== "awaiting" && id === silverId) setSilverId("");
                            }}
                            placeholder="Select Bronze Team"
                            disabled={!eventId}
                            dropDirection="up"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-4"
                  >
                    <button
                      onClick={submitResults}
                      disabled={isSubmitting || !eventId || (!goldId && !silverId && !bronzeId)}
                      className={`w-full font-bold py-4 rounded-[20px] transition-all shadow-lg text-[13px] tracking-wide active:scale-95 flex items-center justify-center gap-3 ${
                        (isSubmitting || !eventId || (!goldId && !silverId && !bronzeId))
                        ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 cursor-not-allowed shadow-none"
                        : "bg-[#269a7a] hover:bg-[#1b7359] text-white"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          RECORDING...
                        </>
                      ) : isEditing ? 'UPDATE RESULTS' : 'RECORD EVENT RESULTS'}
                    </button>
                    <p className="text-[12px] text-center text-gray-500 dark:text-white/40 font-medium leading-tight">
                      {!eventId 
                        ? 'Select an event to enable result recording.' 
                        : (!goldId && !silverId && !bronzeId)
                        ? 'Assign at least one medal to record results.'
                        : 'Review and synchronize records with the database.'}
                    </p>
                  </motion.div>
                </div>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex h-fit w-full flex-col overflow-hidden lg:max-h-[calc(100vh-180px)]">
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="flex w-full items-center gap-3">
                 <div className="relative flex-1">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" />
                   <input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-transparent focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 rounded-[16px] text-[13px] font-medium transition-all outline-none shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                 </div>
                 <div className="bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/5 px-3 py-2 rounded-xl shrink-0">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">{groupedRecentResults.length} Competitions</span>
                 </div>
                 <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1 rounded-xl shadow-inner ml-1">
                    <button 
                      onClick={() => setViewMode('cards')} 
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-[#1c1c1e] shadow-sm text-monument-primary border border-gray-200 dark:border-white/10' : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'}`}
                      title="Card View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                    </button>
                    <button 
                      onClick={() => setViewMode('table')} 
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-[#1c1c1e] shadow-sm text-monument-primary border border-gray-200 dark:border-white/10' : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'}`}
                      title="Table View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                 </div>
              </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
              {groupedRecentResults.length === 0 ? (
                <div className="p-12 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-gray-200 dark:border-white/5 shadow-sm text-center">
                  <Trophy size={34} strokeWidth={1.5} className="mx-auto mb-4 text-gray-400 dark:text-white/25" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {searchQuery ? "No results match your search" : "No results recorded yet"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    {searchQuery ? "Try a different search term." : "Add results to start the tournament record."}
                  </p>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                  {groupedRecentResults.map(({ eventId, items, event }, index) => {
                    const attributedResult = items.find((item) => item.assigned_by_email) || items[0];
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={eventId} 
                        className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col group hover:border-gray-300 dark:hover:border-white/10 transition-all"
                      >
                        <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1c1c1e]/50">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-white/5 flex items-center justify-center text-xl">
                                {event?.icon || '🏆'}
                             </div>
                             <h4 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide flex-1">{event?.name || 'Unknown Event'}</h4>
                          </div>
                        </div>

                        <div className="p-5 flex-1 bg-transparent">
                          <div className="flex flex-col gap-3">
                             {(["gold", "silver", "bronze"] as const).map(medal => {
                               const item = items.find(i => i.medal_type === medal);
                               const department = item ? (Array.isArray(item.departments) ? item.departments[0] : item.departments) : null;
                               const { icon } = getMedalStyles(medal);

                               return (
                                 <div key={medal} className={`flex items-center gap-3 p-2 rounded-xl ${department ? 'bg-gray-50 dark:bg-white/5' : ''}`}>
                                    <span className="text-xl w-6 flex justify-center drop-shadow-sm">{icon}</span>
                                     {item && !department ? (
                                       <div className="flex items-center gap-2 flex-1 min-w-0" title="No Team">
                                         <span className="text-xs font-semibold italic text-gray-400 dark:text-white/40 truncate pr-2">No Team</span>
                                       </div>
                                     ) : department ? (
                                       <div className="flex items-center gap-2 flex-1 min-w-0" title={department.name}>
                                         {department.image_url ? (
                                           <Image src={department.image_url} alt="" width={24} height={24} className="object-contain drop-shadow-sm shrink-0" />
                                         ) : (
                                           <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-white/50">
                                             {department.name?.substring(0, 2).toUpperCase() || "??"}
                                           </div>
                                         )}
                                         <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate pr-2">{department.name}</span>
                                       </div>
                                     ) : (
                                       <span className="text-[10px] font-bold italic text-monument-primary/70 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                                         <div className="w-1 h-1 bg-monument-primary rounded-full animate-pulse" />
                                         Awaiting...
                                       </span>
                                     )}
                                 </div>
                               );
                             })}
                          </div>
                        </div>

                        <div className="p-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-3 bg-transparent">
                          <p className="min-w-0 truncate text-[10px] text-gray-500 dark:text-white/40" title={attributedResult?.assigned_by_email || "Legacy result"}>
                            Assigned by <span className="font-semibold text-gray-700 dark:text-white/65">{attributedResult?.assigned_by_email || "Unknown (legacy)"}</span>
                          </p>
                          {!selectedTournament?.is_archived && (
                            <div className="flex shrink-0 gap-2">
                             <button onClick={() => openResultForEditing(eventId)} className="px-4 py-2 bg-yellow-400/15 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/25 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase">
                              <Pencil size={13} /> Edit
                             </button>
                             <button onClick={() => handleDeleteEventResults(eventId)} className="px-4 py-2 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase">
                              <Trash2 size={13} /> Delete
                             </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden mb-20">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px] table-auto">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-[#1c1c1e]/90 border-b border-gray-200 dark:border-white/5">
                          <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">Event</th>
                          <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">🥇 GOLD</th>
                          <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">🥈 SILVER</th>
                          <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">🥉 BRONZE</th>
                          {!selectedTournament?.is_archived && <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {groupedRecentResults.map(({ eventId, items, event }) => (
                          <tr key={eventId} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs">
                                  {event?.icon || '🏆'}
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-[13px] font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[130px]">{event?.name || 'Unknown Event'}</span>
                                  <span className="block max-w-[130px] truncate text-[9px] text-gray-400 dark:text-white/35">by {items.find((item) => item.assigned_by_email)?.assigned_by_email || 'Unknown (legacy)'}</span>
                                </div>
                              </div>
                            </td>
                            {(['gold', 'silver', 'bronze'] as const).map(medal => {
                              const item = items.find(i => i.medal_type === medal);
                              const dept = item ? (Array.isArray(item.departments) ? item.departments[0] : item.departments) : null;
                              const { icon } = getMedalStyles(medal);
                              return (
                                <td key={medal} className="px-3 py-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm w-4 flex justify-center opacity-80 shrink-0">{icon}</span>
                                     {item && !dept ? (
                                       <div className="flex items-center gap-1.5 overflow-hidden">
                                         <span className="text-[10px] font-semibold italic text-gray-500 dark:text-white/40 truncate">No Team</span>
                                       </div>
                                     ) : dept ? (
                                       <div className="flex items-center gap-1.5 overflow-hidden">
                                         {dept.image_url ? (
                                           <Image src={dept.image_url} alt="" width={18} height={18} className="object-contain drop-shadow-sm shrink-0" />
                                         ) : (
                                           <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[7px] font-bold text-gray-500 dark:text-white/50 shrink-0">
                                             {dept.name?.substring(0, 2).toUpperCase() || "??"}
                                           </div>
                                         )}
                                         <span className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{dept.name}</span>
                                       </div>
                                     ) : (
                                       <span className="text-[9px] font-bold italic text-monument-primary/70 uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                                         <div className="w-1 h-1 bg-monument-primary rounded-full animate-pulse" />
                                         Awaiting...
                                       </span>
                                     )}
                                  </div>
                                </td>
                              );
                            })}
                            {!selectedTournament?.is_archived && (
                              <td className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end">
                                  <button onClick={() => openResultForEditing(eventId)} className="p-1.5 bg-yellow-400/15 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/25 rounded-lg transition-all" title="Edit">
                                    <Pencil size={13} />
                                  </button>
                                  <button onClick={() => handleDeleteEventResults(eventId)} className="p-1.5 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-lg transition-all" title="Delete">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this result entry? This action cannot be undone."
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
              <div className="w-20 h-20 border-4 border-[#FF453A] border-t-white rounded-full animate-spin mb-8 shadow-2xl" />
              <h2 className="text-3xl font-black uppercase tracking-[0.2em] mb-2 leading-none text-white">Deleting</h2>
              <div className="h-1 w-12 bg-[#FF453A] rounded-full mb-4" />
              <p className="text-white/50 font-bold uppercase tracking-widest text-[10px]">Processing Database Permanent Directive</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
