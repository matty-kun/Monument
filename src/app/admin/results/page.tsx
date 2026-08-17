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

  if (!selectedTournament) return <EmptyTournamentState />;

  return (
    <div className="w-full h-full text-white flex flex-col overflow-hidden max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Add Result' }]} />
      </div>

      <div className="mb-4 shrink-0">
        <h1 className="text-[32px] font-black text-white tracking-tight leading-none mb-2">{isEditing ? 'Edit Result' : 'Add Results'}</h1>
        <p className="text-[15px] text-white/50 font-semibold tracking-wide">{isEditing ? 'Modify medal standings for this event' : 'Record competition winners and points'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-4 h-fit flex flex-col pb-2">
          {selectedTournament?.is_archived ? (
            <div className="bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white/5 overflow-hidden flex flex-col items-center justify-center p-12 text-center h-[400px]">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl opacity-50">🔒</span>
              </div>
              <h2 className="text-[18px] font-bold text-white mb-2">Season Archived</h2>
              <p className="text-[14px] text-white/50 font-semibold tracking-wide max-w-[250px] leading-relaxed">
                This tournament has been archived. Results can no longer be modified.
              </p>
            </div>
          ) : (
            <div className="bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white/5 overflow-visible transition-all flex flex-col">
              <div className="p-6 border-b border-white/5 bg-[#1c1c1e] shrink-0 z-10 rounded-t-[24px]">
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-white/40">{isEditing ? 'Edit Result' : 'Medal Entry Form'}</h2>
              </div>
              
              <div className="p-6 relative flex flex-col pt-4">
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
                      onClick={handleSubmit}
                      disabled={isSubmitting || !eventId || (!goldId && !silverId && !bronzeId)}
                      className={`w-full font-bold py-4 rounded-[20px] transition-all shadow-lg text-[13px] tracking-wide active:scale-95 flex items-center justify-center gap-3 ${
                        (isSubmitting || !eventId || (!goldId && !silverId && !bronzeId))
                        ? "bg-white/5 text-white/40 cursor-not-allowed shadow-none"
                        : "bg-[#0A84FF] hover:bg-[#0070e0] text-white"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          RECORDING...
                        </>
                      ) : isEditing ? 'UPDATE RESULTS' : 'RECORD EVENT RESULTS'}
                    </button>
                    <p className="text-[12px] text-center text-white/40 font-medium leading-tight">
                      {!eventId 
                        ? 'Select an event to enable result recording.' 
                        : (!goldId && !silverId && !bronzeId)
                        ? 'Assign at least one medal to record results.'
                        : 'Review and synchronize records with the database.'}
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: History */}
          <div className="lg:col-span-8 flex flex-col h-fit lg:max-h-[calc(100vh-180px)] overflow-hidden">
            <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
              <div>
                <h3 className="text-[18px] font-bold text-white uppercase tracking-wide">Results History</h3>
                <p className="text-[12px] text-white/50 font-semibold tracking-wide">Full log of all competition records</p>
              </div>
              <div className="flex items-center gap-3 bg-[#1c1c1e] p-2 rounded-[16px] shadow-sm border border-white/5">
                 <div className="relative flex-1 sm:w-64">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">🔍</div>
                   <input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border-none rounded-xl pl-9 pr-4 py-2 text-[14px] font-semibold text-white placeholder-white/40 focus:ring-2 focus:ring-[#0A84FF]/50 outline-none transition-all shadow-inner" />
                 </div>
                 <div className="bg-[#1c1c1e] border border-white/5 px-3 py-2 rounded-xl shrink-0">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{groupedRecentResults.length} Competitions</span>
                 </div>
                 <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl shadow-inner ml-1">
                    <button 
                      onClick={() => setViewMode('cards')} 
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-[#1c1c1e] shadow-sm text-[#0A84FF] border border-white/10' : 'text-white/40 hover:text-white'}`}
                      title="Card View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                    </button>
                    <button 
                      onClick={() => setViewMode('table')} 
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#1c1c1e] shadow-sm text-[#0A84FF] border border-white/10' : 'text-white/40 hover:text-white'}`}
                      title="Table View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                 </div>
              </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
              {groupedRecentResults.length === 0 ? (
                <div className="p-12 bg-[#1c1c1e] rounded-[24px] border border-white/5 shadow-sm text-center">
                  <div className="text-5xl mb-4 opacity-50">🏆</div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {searchQuery ? "No results match your search" : "No results recorded yet"}
                  </h3>
                  <p className="text-sm text-white/50">
                    {searchQuery ? "Try a different search term." : "Use the form to start awarding medals!"}
                  </p>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                  {groupedRecentResults.map(({ eventId, items, event }, index) => {
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={eventId} 
                        className="bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white/5 overflow-hidden flex flex-col group hover:border-white/10 transition-all"
                      >
                        <div className="p-5 border-b border-white/5 bg-[#1c1c1e]/50">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl">
                                {event?.icon || '🏆'}
                             </div>
                             <h4 className="text-[14px] font-bold text-white tracking-wide flex-1">{event?.name || 'Unknown Event'}</h4>
                          </div>
                        </div>

                        <div className="p-5 flex-1 bg-transparent">
                          <div className="flex flex-col gap-3">
                             {(["gold", "silver", "bronze"] as const).map(medal => {
                               const item = items.find(i => i.medal_type === medal);
                               const department = item ? (Array.isArray(item.departments) ? item.departments[0] : item.departments) : null;
                               const { icon } = getMedalStyles(medal);

                               return (
                                 <div key={medal} className={`flex items-center gap-3 p-2 rounded-xl ${department ? 'bg-white/5' : ''}`}>
                                    <span className="text-xl w-6 flex justify-center drop-shadow-sm">{icon}</span>
                                     {item && !department ? (
                                       <div className="flex items-center gap-2 flex-1 min-w-0" title="No Team">
                                         <span className="text-xs font-semibold italic text-white/40 truncate pr-2">No Team</span>
                                       </div>
                                     ) : department ? (
                                       <div className="flex items-center gap-2 flex-1 min-w-0" title={department.name}>
                                         {department.image_url ? (
                                           <Image src={department.image_url} alt="" width={24} height={24} className="object-contain drop-shadow-sm shrink-0" />
                                         ) : (
                                           <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">
                                             {department.name?.substring(0, 2).toUpperCase() || "??"}
                                           </div>
                                         )}
                                         <span className="text-[13px] font-bold text-white truncate pr-2">{department.name}</span>
                                       </div>
                                     ) : (
                                       <span className="text-[10px] font-bold italic text-[#0A84FF]/70 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                                         <div className="w-1 h-1 bg-[#0A84FF] rounded-full animate-pulse" />
                                         Awaiting...
                                       </span>
                                     )}
                                 </div>
                               );
                             })}
                          </div>
                        </div>

                        {!selectedTournament?.is_archived && (
                          <div className="p-3 border-t border-white/5 flex justify-end gap-2 bg-transparent">
                             <button onClick={() => handleEditByEvent(eventId)} className="px-4 py-2 text-white/40 hover:text-[#0A84FF] hover:bg-white/5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase">
                              ✏️ Edit
                             </button>
                             <button onClick={() => handleDeleteEventResults(eventId)} className="px-4 py-2 text-white/40 hover:text-[#FF453A] hover:bg-white/5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase">
                              🗑️ Delete
                             </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#1c1c1e] rounded-[24px] border border-white/5 shadow-sm overflow-hidden mb-20">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px] table-auto">
                      <thead>
                        <tr className="bg-[#1c1c1e]/90 border-b border-white/5">
                          <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white/40">Event</th>
                          <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white/40">🥇 GOLD</th>
                          <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white/40">🥈 SILVER</th>
                          <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white/40">🥉 BRONZE</th>
                          {!selectedTournament?.is_archived && <th className="px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white/40 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {groupedRecentResults.map(({ eventId, items, event }) => (
                          <tr key={eventId} className="group hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs">
                                  {event?.icon || '🏆'}
                                </div>
                                <span className="text-[13px] font-bold text-white leading-tight truncate max-w-[100px]">{event?.name || 'Unknown Event'}</span>
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
                                         <span className="text-[10px] font-semibold italic text-white/40 truncate">No Team</span>
                                       </div>
                                     ) : dept ? (
                                       <div className="flex items-center gap-1.5 overflow-hidden">
                                         {dept.image_url ? (
                                           <Image src={dept.image_url} alt="" width={18} height={18} className="object-contain drop-shadow-sm shrink-0" />
                                         ) : (
                                           <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/50 shrink-0">
                                             {dept.name?.substring(0, 2).toUpperCase() || "??"}
                                           </div>
                                         )}
                                         <span className="text-[11px] font-bold text-white truncate">{dept.name}</span>
                                       </div>
                                     ) : (
                                       <span className="text-[9px] font-bold italic text-[#0A84FF]/70 uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                                         <div className="w-1 h-1 bg-[#0A84FF] rounded-full animate-pulse" />
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
                                  <button onClick={() => handleEditByEvent(eventId)} className="p-1.5 text-white/40 hover:text-[#0A84FF] hover:bg-white/5 rounded-lg transition-all" title="Edit">
                                    <span className="text-xs">✏️</span>
                                  </button>
                                  <button onClick={() => handleDeleteEventResults(eventId)} className="p-1.5 text-white/40 hover:text-[#FF453A] hover:bg-white/5 rounded-lg transition-all" title="Delete">
                                    <span className="text-xs">🗑️</span>
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