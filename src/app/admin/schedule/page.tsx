"use client";

import { Fragment } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Settings2,
  X,
  AlertCircle,
  ClipboardEdit,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { formatTime } from "@/lib/utils";
import SingleSelectDropdown from "@/components/SingleSelectDropdown";
import DatePickerDropdown from "@/components/DatePickerDropdown";
import TimePickerDropdown from "@/components/TimePickerDropdown";
import { useTournament } from "@/components/AdminTournamentProvider";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useScheduleViewModel } from "@/features/admin/schedule/viewModels/useScheduleViewModel";

const FaTrash = () => <Trash2 size={14} />;
const FaEdit = () => <Settings2 size={14} />;

export default function AdminSchedulePage() {
  const { selectedTournament } = useTournament();
  
  const {
    loading,
    searchQuery,
    setSearchQuery,
    showFormModal,
    setShowFormModal,
    isSubmitting,
    eventId,
    setEventId,
    venueId,
    setVenueId,
    date,
    setDate,
    endDate,
    setEndDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    selectedDepartments,
    setSelectedDepartments,
    isWholeDay,
    setIsWholeDay,
    showResultModal,
    setShowResultModal,
    resultMatch,
    winnerId,
    setWinnerId,
    scoreA,
    setScoreA,
    scoreB,
    setScoreB,
    isSubmittingResult,
    medalGoldId,
    setMedalGoldId,
    medalSilverId,
    setMedalSilverId,
    medalBronzeId,
    setMedalBronzeId,
    showConfirmModal,
    setShowConfirmModal,
    departmentMap,
    filteredSchedules,
    eventOptions,
    venueOptions,
    handleSaveSchedule,
    handleDeleteSchedule,
    handleResetMatch,
    handleSaveResult,
    openResultModal,
    getDynamicStatus,
    closeModal,
    formatDate,
    formatEventName,
    departments,
    editingId,
    setEditingId,
    setScheduleToDeleteId,
    categories
  } = useScheduleViewModel({ selectedTournament });

  if (!selectedTournament) return <EmptyTournamentState />;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Header / Search Area */}
      <div className="flex-none p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-[32px] font-black text-white tracking-tight leading-none mb-2">Admin Control Center</h1>
            <p className="text-[15px] text-white/50 font-semibold tracking-wide">Schedules & Competition Management</p>
          </div>
          <div className="flex items-center gap-2">
            {!selectedTournament?.is_archived && (
              <button
                onClick={() => { closeModal(); setShowFormModal(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-[#0A84FF] hover:bg-[#0070e0] text-white rounded-[16px] shadow-sm transition-all text-[13px] font-bold"
              >
                <Plus size={16} strokeWidth={3} />
                <span>Create Schedule</span>
              </button>
            )}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Quick find events, teams, or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 text-white border border-transparent focus:ring-1 focus:ring-white/20 rounded-[16px] text-[13px] font-medium transition-all outline-none shadow-sm placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-20 lg:pb-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <div className="w-12 h-12 border-4 border-monument-primary border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Tournament Data...</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
              {filteredSchedules.map((s) => {
                const dynStatus = getDynamicStatus(s);
                return (
                  <div key={s.id} className="h-fit bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white/5 overflow-hidden flex flex-col hover:border-white/20 transition-all duration-300 relative group">
                    <div className="px-5 py-3.5 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                      <div className="flex gap-2 items-center">
                        <div className={`w-3 h-3 rounded-full shadow-sm ${dynStatus.status === 'finished' ? 'bg-[#FF5F56]' : dynStatus.status === 'live' ? 'bg-[#27C93F]' : 'bg-[#FFBD2E]'}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-white flex items-center gap-2">
                        <span>{dynStatus.label}</span>
                        <span className="opacity-50">•</span>
                        <span>{s.end_date && s.end_date !== s.date ? `${formatDate(s.date)} — ${formatDate(s.end_date)}` : formatDate(s.date)}</span>
                      </span>
                    </div>

                    <div className="p-6 space-y-5 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-[12px] text-2xl drop-shadow-sm">{s.events?.icon || '🏅'}</div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-[18px] font-bold text-white tracking-tight truncate">{formatEventName(s.events)}</h3>
                          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                            {typeof s.events?.category === 'object' && s.events.category ? s.events.category.name : categories.find(c => c.id === s.events?.category)?.name || ''}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-[20px] p-4 border border-white/5">
                        <div className="flex items-center justify-around gap-2 relative min-h-[56px]">
                          {s.departments.length === 0 ? (
                            <div className="flex flex-col items-center py-2 opacity-50">
                               <div className="w-14 h-14 rounded-[16px] bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 shadow-inner">
                                  ?
                               </div>
                               <span className="text-[9px] font-bold uppercase text-white/40 tracking-[0.2em]">TBA Teams</span>
                            </div>
                          ) : s.departments.map((dName, i) => {
                            const d = departmentMap.get(dName);
                            const isWinner = d && s.winner_id === d.id;
                            return (
                              <Fragment key={i}>
                                <div className="flex flex-col items-center gap-2 relative">
                                  {isWinner && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-3 -right-2 z-10 text-[20px] drop-shadow-md">
                                      🏆
                                    </motion.div>
                                  )}
                                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border shadow-sm ${isWinner ? 'bg-yellow-400/20 text-yellow-500 border-yellow-400/30 scale-110' : 'bg-white/5 text-white/60 border-white/10'}`}>
                                    {d?.image_url ? (
                                      <img src={d.image_url} className="w-10 h-10 object-contain drop-shadow-sm" />
                                    ) : (
                                      <div className="w-full h-full rounded-full flex items-center justify-center">
                                        {dName?.slice(0, 3).toUpperCase() || "??"}
                                      </div>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isWinner ? 'text-yellow-500' : 'text-white/60'}`}>
                                    {d?.abbreviation || dName?.slice(0,3) || "??"}
                                  </span>
                                </div>
                                {i < s.departments.length - 1 && <span className="text-[10px] font-black text-white/20 italic">vs</span>}
                              </Fragment>
                            );
                          })}
                        </div>
                        
                        {s.status === 'finished' && (Number(s.score_a) > 0 || Number(s.score_b) > 0) && (
                          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-white/10 font-bold text-2xl text-white">
                            <span className={s.winner_id === (departmentMap.get(s.departments[0])?.id) ? 'text-[#34C759]' : 'text-white/40'}>{s.score_a || 0}</span>
                            <span className="text-white/20">—</span>
                            <span className={s.winner_id === (departmentMap.get(s.departments[1])?.id) ? 'text-[#34C759]' : 'text-white/40'}>{s.score_b || 0}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-1 px-1">
                        <div className="flex items-center gap-3 text-white/60">
                          <Clock size={14} className="shrink-0 opacity-70" />
                          <span className="text-[11px] font-bold uppercase tracking-widest">
                             {s.start_time.startsWith("00:00") && s.end_time?.startsWith("23:59") ? "All Day Event" : `${formatTime(s.start_time)}${s.end_time ? ` — ${formatTime(s.end_time)}` : ''}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60">
                          <MapPin size={14} className="shrink-0 opacity-70" />
                          <span className="text-[11px] font-bold uppercase tracking-widest truncate">{s.venues?.name || 'TBA'}</span>
                        </div>
                      </div>
                    </div>

                    {!selectedTournament?.is_archived && (
                      <div className="bg-[#1c1c1e] px-6 py-3 border-t border-white/5 flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         {dynStatus.status !== 'finished' ? (
                           s.departments.length > 0 ? (
                              <button onClick={() => openResultModal(s)} className="w-9 h-9 bg-[#34C759]/20 text-[#34C759] hover:bg-[#34C759]/30 rounded-[12px] flex items-center justify-center shadow-sm transition-all border border-[#34C759]/30" title="Finish Match & Pick Winner">
                                <CheckCircle2 size={14} />
                              </button>
                           ) : (
                              <div className="w-9 h-9 bg-white/5 text-white/30 rounded-[12px] flex items-center justify-center border border-dashed border-white/10 cursor-not-allowed" title="Assign teams to finish match">
                                 <CheckCircle2 size={14} />
                              </div>
                           )
                         ) : (
                           <button onClick={() => handleResetMatch(s.id)} className="w-9 h-9 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-[12px] flex items-center justify-center shadow-sm transition-all" title="Reset Match Status">
                             <span className="text-sm">🔄</span>
                           </button>
                         )}
                         {s.departments.length > 0 ? (
                          <button onClick={() => openResultModal(s)} className="w-9 h-9 bg-white/5 text-[#0A84FF] hover:bg-white/10 border border-white/10 rounded-[12px] flex items-center justify-center shadow-sm transition-all" title="Manage Result">
                            <ClipboardEdit size={16} />
                          </button>
                         ) : (
                          <div className="w-9 h-9 bg-white/5 text-white/30 rounded-[12px] flex items-center justify-center border border-dashed border-white/10 cursor-not-allowed" title="Assign teams first to manage results">
                             <ClipboardEdit size={16} />
                          </div>
                         )}
                         <button onClick={() => { 
                           setEditingId(s.id); setEventId(s.event_id); setVenueId(s.venue_id || ""); setDate(s.date); setEndDate(s.end_date || s.date); setStartTime(s.start_time); setEndTime(s.end_time || ""); setSelectedDepartments(s.departments);
                           setIsWholeDay(s.start_time.startsWith("00:00") && (s.end_time?.startsWith("23:59") || false)); setShowFormModal(true);
                         }} className="w-9 h-9 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-[12px] flex items-center justify-center shadow-sm transition-all">
                           <FaEdit />
                         </button>
                         <button onClick={() => { setScheduleToDeleteId(s.id); setShowConfirmModal(true); }} className="w-9 h-9 bg-white/5 text-white/60 hover:text-[#FF453A] hover:bg-white/10 border border-white/10 rounded-[12px] flex items-center justify-center shadow-sm transition-all">
                           <FaTrash />
                         </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Control Modal (Form) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-[#1c1c1e] rounded-[24px] shadow-2xl border border-white/5">
              <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-white/10">
                <div>
                  <h2 className="text-white font-bold text-xl uppercase tracking-tight">{editingId ? 'Edit Schedule' : 'Create New Schedule'}</h2>
                </div>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center bg-white/5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-95"><X size={16} strokeWidth={3} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Events</label>
                    <SingleSelectDropdown 
                      options={eventOptions}
                      selectedValue={eventId}
                      onChange={setEventId}
                      placeholder="SELECT EVENT"
                      dropDirection="down"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tournament Venue</label>
                    <SingleSelectDropdown 
                      options={venueOptions}
                      selectedValue={venueId}
                      onChange={setVenueId}
                      placeholder="SELECT VENUE"
                      dropDirection="down"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Competing Departments</label>
                    <div className="flex items-center gap-2">
                       {selectedDepartments.length > 0 && <button onClick={() => setSelectedDepartments([])} className="text-[9px] font-bold uppercase tracking-widest text-[#0A84FF] hover:bg-[#0A84FF]/10 px-2 py-0.5 rounded-full transition-all">Set to TBA</button>}
                       <span className={`text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full ${selectedDepartments.length >= 2 ? 'bg-[#0A84FF]/10 text-[#0A84FF]' : 'bg-white/5 text-white/40'}`}>{selectedDepartments.length}/3 selected</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {departments.map((d) => {
                      const isSelected = selectedDepartments.includes(d.name);
                      return (
                        <button key={d.id} onClick={() => { setSelectedDepartments(prev => isSelected ? prev.filter(x => x !== d.name) : (prev.length < 3 ? [...prev, d.name] : prev)); }} className={`flex flex-col items-center p-2 rounded-[16px] transition-all border ${isSelected ? 'border-[#0A84FF]/50 bg-[#0A84FF]/10 shadow-md scale-105' : selectedDepartments.length >= 3 ? 'border-transparent bg-white/5 grayscale opacity-30 cursor-not-allowed' : 'border-transparent bg-white/5 grayscale opacity-60 hover:opacity-100'}`}>
                          {d.image_url ? <img src={d.image_url} className="w-8 h-8 object-contain drop-shadow-sm mb-1" /> : <div className="w-8 h-8 bg-white/10 rounded-full mb-1" />}
                          <span className={`text-[10px] font-bold uppercase truncate w-full text-center mt-1 ${isSelected ? 'text-[#0A84FF]' : 'text-white'}`}>{d.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
                    <DatePickerDropdown value={date} onChange={setDate} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Date <span className="text-gray-300 normal-case font-medium">(optional)</span></label>
                    <DatePickerDropdown value={endDate || ''} onChange={(val) => setEndDate(val || null)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Window</label>
                    <button onClick={() => setIsWholeDay(!isWholeDay)} className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full transition-all ${isWholeDay ? 'bg-monument-primary text-white ring-2 ring-monument-primary/30' : 'bg-gray-100 text-gray-400'}`}>Whole Day</button>
                  </div>
                  {!isWholeDay ? (
                    <div className="flex items-center gap-2">
                       <div className="flex-1">
                        <TimePickerDropdown value={startTime} onChange={setStartTime} />
                      </div>
                      <span className="text-[9px] font-black text-gray-300">TO</span>
                      <div className="flex-1">
                        <TimePickerDropdown value={endTime} onChange={setEndTime} allowClear />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full py-3 bg-[#0A84FF]/10 border border-dashed border-[#0A84FF]/30 rounded-[16px] flex items-center justify-center text-[10px] font-bold text-[#0A84FF] uppercase tracking-widest">Whole Day Match Window</div>
                  )}
                </div>

                <div className="pt-4">
                  <button onClick={handleSaveSchedule} disabled={isSubmitting} className="w-full bg-[#0A84FF] text-white py-4 rounded-[20px] text-[13px] font-bold tracking-wide shadow-sm hover:bg-[#0070e0] active:scale-95 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editingId ? (<span>Update Record</span>) : (<span>Deploy Schedule</span>)}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result Recording Modal */}
      <AnimatePresence>
        {showResultModal && resultMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowResultModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">

              {resultMatch.departments.length >= 3 ? (
                /* ═══ 3-TEAM MEDAL ASSIGNMENT MODAL ═══ */
                <>
                  <div className="bg-monument-primary px-8 py-6 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute -top-4 -right-2 p-8 opacity-10 rotate-12 scale-150 pointer-events-none">
                      <Trophy size={100} />
                    </div>
                    <div className="flex flex-col relative z-10 w-full pr-8">
                      <span className="text-white/60 text-[9px] font-extrabold tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5">
                        <AlertCircle size={10} /> Auto-links to Results
                      </span>
                      <h2 className="text-white font-black text-xl uppercase tracking-tight leading-none mb-0.5 truncate">{resultMatch.events?.name}</h2>
                      <h3 className="text-white/90 font-bold text-xs uppercase tracking-widest">Assign Medals</h3>
                    </div>
                    <button onClick={() => setShowResultModal(false)} className="w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-all relative z-10 shrink-0"><X size={16} strokeWidth={3} /></button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-2xl border border-violet-100 dark:border-violet-900/30 flex items-center gap-3">
                      <AlertCircle className="text-monument-primary shrink-0" size={16} />
                      <span className="text-[9px] font-bold text-monument-primary dark:text-violet-300 uppercase tracking-tight">3-team match — medals will be auto-saved to the Results page & Podium.</span>
                    </div>

                    {(['gold', 'silver', 'bronze'] as const).map((medal) => {
                      const medalIcon = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉';
                      const medalLabel = medal === 'gold' ? 'Gold' : medal === 'silver' ? 'Silver' : 'Bronze';
                      const currentId = medal === 'gold' ? medalGoldId : medal === 'silver' ? medalSilverId : medalBronzeId;
                      const setter = medal === 'gold' ? setMedalGoldId : medal === 'silver' ? setMedalSilverId : setMedalBronzeId;
                      const otherIds = [medalGoldId, medalSilverId, medalBronzeId].filter((_, idx) => idx !== ['gold', 'silver', 'bronze'].indexOf(medal));

                      return (
                        <div key={medal} className="flex items-center gap-4">
                          <span className="text-3xl w-10 flex justify-center shrink-0">{medalIcon}</span>
                          <div className="flex-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">{medalLabel}</label>
                            <div className="flex gap-2 flex-wrap">
                              {/* No Team option */}
                              <button
                                onClick={() => setter(currentId === '' ? null : '')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${
                                  currentId === ''
                                    ? 'border-monument-primary bg-violet-50 dark:bg-violet-900/30 text-monument-primary scale-105 shadow-md'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-900/30 text-gray-400 hover:border-gray-200 hover:bg-white'
                                }`}
                              >
                                <span className="text-sm">✖️</span> No Team
                              </button>
                              {/* Awaiting option */}
                              <button
                                onClick={() => setter(currentId === 'awaiting' ? null : 'awaiting')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${
                                  currentId === 'awaiting'
                                    ? 'border-monument-primary bg-violet-50 dark:bg-violet-900/30 text-monument-primary scale-105 shadow-md'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-900/30 text-gray-400 hover:border-gray-200 hover:bg-white'
                                }`}
                              >
                                <span className="text-sm">⏳</span> Awaiting
                              </button>
                              {/* Team options */}
                              {resultMatch.departments.map((dName) => {
                                const d = departmentMap.get(dName);
                                if (!d) return null;
                                const isSelected = currentId === d.id;
                                const isTaken = otherIds.includes(d.id);
                                return (
                                  <button
                                    key={d.id}
                                    onClick={() => !isTaken && setter(isSelected ? null : d.id)}
                                    disabled={isTaken}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${
                                      isSelected
                                        ? 'border-monument-primary bg-violet-50 dark:bg-violet-900/30 text-monument-primary scale-105 shadow-md'
                                        : isTaken
                                        ? 'border-transparent bg-gray-50 dark:bg-gray-900/30 text-gray-300 opacity-40 cursor-not-allowed'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-900/30 text-gray-600 hover:border-gray-200 hover:bg-white'
                                    }`}
                                  >
                                    {d.image_url ? (
                                      <img src={d.image_url} className="w-6 h-6 object-contain" />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px]">{d.abbreviation?.slice(0,2)}</div>
                                    )}
                                    {d.abbreviation || dName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!medalGoldId && medalGoldId !== '' && medalGoldId !== 'awaiting' && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={16} />
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight">Assign at least Gold to finalize.</span>
                      </div>
                    )}

                    <div className="flex gap-4 pt-2">
                      <button onClick={() => setShowResultModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-all">Cancel</button>
                      <button onClick={handleSaveResult} disabled={isSubmittingResult || (medalGoldId === null)} className="flex-[2] py-4 bg-monument-primary text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-monument-primary/20 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale">
                        Finalize Medals
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* ═══ 2-TEAM WINNER PICKER MODAL ═══ */
                <>
                  <div className="bg-monument-primary px-8 py-5 flex justify-between items-center">
                    <div>
                      <h2 className="text-white font-black text-sm uppercase tracking-[0.1em]">Record Winner & Outcome</h2>
                      <p className="text-white/60 text-[10px] font-bold tracking-tight uppercase">{resultMatch.events?.name} - Final Score</p>
                    </div>
                    <button onClick={() => setShowResultModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                  </div>

                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-around gap-6">
                      {resultMatch.departments.map((dName, i) => {
                        const d = departmentMap.get(dName);
                        const isSelected = winnerId === d?.id;
                        return (
                          <div key={i} className="flex flex-col items-center gap-4">
                            <button onClick={() => d && setWinnerId(d.id)} className={`group relative w-24 h-24 rounded-2xl p-1 transition-all duration-500 ${isSelected ? 'ring-8 ring-monument-primary/20 scale-110' : 'ring-2 ring-gray-100 dark:ring-gray-700 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}>
                              <div className={`w-full h-full rounded-2xl overflow-hidden border-4 shadow-xl ${isSelected ? 'border-monument-primary' : 'border-white dark:border-gray-800'}`}>
                                {d?.image_url ? <img src={d.image_url} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center font-black text-xl">{dName.slice(0,2)}</div>}
                              </div>
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-monument-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-4 border-white font-black">
                                  🏆
                                </motion.div>
                              )}
                            </button>
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-monument-primary' : 'text-gray-400'}`}>{d?.abbreviation || dName}</span>
                              <input type="number" value={i === 0 ? scoreA : scoreB} onChange={(e) => i === 0 ? setScoreA(parseInt(e.target.value) || 0) : setScoreB(parseInt(e.target.value) || 0)} placeholder="SCORE" className="w-20 text-center bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl mt-3 font-black text-2xl py-2 focus:ring-2 focus:ring-monument-primary/30" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!winnerId && (
                      <div className="bg-yellow-400/10 p-4 rounded-[16px] border border-yellow-400/20 flex items-center gap-3">
                        <AlertCircle className="text-yellow-500 shrink-0" size={18} />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-tight">You must pick a championship winner to finalize the result.</span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button onClick={() => setShowResultModal(false)} className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest text-white/50 bg-white/5 hover:bg-white/10 hover:text-white rounded-[20px] transition-all">Cancel</button>
                      <button onClick={handleSaveResult} disabled={isSubmittingResult || !winnerId} className="flex-[2] py-4 bg-[#0A84FF] text-white rounded-[20px] text-[13px] font-bold tracking-wide shadow-sm hover:bg-[#0070e0] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale">
                        Deploy Final Result
                      </button>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl border border-white/5 space-y-6">
              <div className="w-16 h-16 bg-[#FF453A]/10 text-[#FF453A] rounded-full flex items-center justify-center mx-auto border border-[#FF453A]/20">
                <Trash2 size={28} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-white font-bold uppercase tracking-tight text-lg">Erase match record?</h3>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">This action is permanent and will remove the schedule from all views.</p>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-[11px] font-bold uppercase tracking-widest text-white/50 bg-white/5 hover:bg-white/10 hover:text-white rounded-[16px] transition-all">Abort</button>
                <button onClick={handleDeleteSchedule} className="flex-1 py-3 bg-[#FF453A] hover:bg-[#ff564c] text-white rounded-[16px] text-[11px] font-bold uppercase tracking-widest shadow-sm transition-all">Delete Forever</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
