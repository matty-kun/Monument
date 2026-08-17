"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { FaTable, FaThLarge, FaSearch, FaMapMarkerAlt, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useTournament } from "@/components/AdminTournamentProvider";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useVenuesViewModel } from "@/features/admin/venues/viewModels/useVenuesViewModel";

export default function VenuesPage() {
  const { selectedTournament } = useTournament();
  const {
    loading,
    filteredVenues,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    showFormModal,
    setShowFormModal,
    venueName,
    setVenueName,
    editingId,
    setEditingId,
    showConfirmModal,
    setShowConfirmModal,
    setVenueToDeleteId,
    resetForm,
    handleAddOrUpdate,
    handleDelete,
  } = useVenuesViewModel();

  if (!selectedTournament) return <EmptyTournamentState />;

  return (
    <div className="w-full h-full text-white flex flex-col overflow-hidden max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: "/admin/dashboard", label: "Dashboard" }, { label: "Manage Venues" }]} />
        <button 
          onClick={() => { resetForm(); setShowFormModal(true); }}
          className="flex items-center gap-2 bg-[#0A84FF] hover:bg-[#0070e0] text-white px-6 py-3 rounded-[20px] font-bold transition-all shadow-lg active:scale-95 text-[13px] tracking-wide"
        >
          <FaPlus size={10} /> Add New Venue
        </button>
      </div>
      
      <div className="mb-4 shrink-0">
        <h1 className="text-[32px] font-black text-white tracking-tight leading-none mb-2">Competition Venues</h1>
        <p className="text-[15px] text-white/50 font-semibold tracking-wide">Define locations where competitions and events will take place</p>
      </div>

      <div className="flex flex-col flex-1 min-h-0 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1c1c1e] p-4 rounded-[24px] border border-white/5 shadow-sm gap-4 shrink-0 mb-4">
           <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="text" placeholder="Search venues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border-none rounded-[16px] pl-12 pr-4 py-3 text-[14px] font-semibold text-white placeholder-white/40 focus:ring-2 focus:ring-[#0A84FF]/50 transition-all" />
           </div>
           <div className="flex bg-white/5 p-1 rounded-xl">
              <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#1c1c1e] shadow-sm text-[#0A84FF] border border-white/10' : 'text-white/40 hover:text-white'}`}><FaTable size={18}/></button>
              <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-[#1c1c1e] shadow-sm text-[#0A84FF] border border-white/10' : 'text-white/40 hover:text-white'}`}><FaThLarge size={18}/></button>
           </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {viewMode === 'table' ? (
              <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#1c1c1e] rounded-[24px] shadow-lg border border-white/5 flex flex-col h-full overflow-hidden transition-all hover:border-white/10">
                <div className="overflow-y-auto custom-scrollbar overflow-x-auto relative flex-1">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-[#1c1c1e]/90 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-8 py-5 text-left text-[12px] font-bold text-white/40 uppercase tracking-widest">Venue Name</th>
                      <th className="px-8 py-5 text-right text-[12px] font-bold text-white/40 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                       <tr><td colSpan={2} className="py-20 text-center text-white/40 font-bold uppercase tracking-widest text-xs">Loading...</td></tr>
                    ) : filteredVenues.length === 0 ? (
                      <tr><td colSpan={2} className="py-20 text-center text-white/40 font-bold uppercase tracking-widest text-xs">No venues found</td></tr>
                    ) : filteredVenues.map((v) => (
                      <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="text-[15px] font-bold text-white tracking-wide">{v.name}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setVenueName(v.name); setEditingId(v.id); setShowFormModal(true); }} className="p-2 text-white/40 hover:text-[#0A84FF] hover:bg-[#0A84FF]/10 rounded-xl transition-all" title="Edit Venue"><FaEdit /></button>
                            <button onClick={() => { setVenueToDeleteId(v.id); setShowConfirmModal(true); }} className="p-2 text-white/40 hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-xl transition-all" title="Delete Venue"><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </motion.div>
            ) : (
              <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-2 h-full items-start pb-10">
              {loading ? (
                 <div className="col-span-full py-20 text-center text-white/40 font-bold uppercase tracking-widest text-sm">Loading Venues...</div>
              ) : filteredVenues.length === 0 ? (
                 <div className="col-span-full py-20 text-center text-white/40 font-bold uppercase tracking-widest text-sm">No venues found</div>
              ) : filteredVenues.map((v) => (
                <div key={v.id} className="bg-[#1c1c1e] p-6 rounded-[24px] shadow-sm border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all group relative items-center flex flex-row gap-5 h-fit">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#0A84FF] shrink-0"><FaMapMarkerAlt size={20} /></div>
                   <h4 className="text-[16px] font-bold text-white tracking-wide flex-1 truncate">{v.name}</h4>
                   <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setVenueName(v.name); setEditingId(v.id); setShowFormModal(true); }} className="w-8 h-8 bg-white/10 text-white hover:text-[#0A84FF] rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaEdit size={12}/></button>
                      <button onClick={() => { setVenueToDeleteId(v.id); setShowConfirmModal(true); }} className="w-8 h-8 bg-white/10 text-white hover:text-[#FF453A] rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaTrash size={12}/></button>
                   </div>
                </div>
              ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Entry Form Modal */}
      <ConfirmModal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); resetForm(); }}
        onConfirm={handleAddOrUpdate}
        title={editingId ? "Update Venue" : "Create New Venue"}
        message={
          <div className="space-y-6 pt-4 text-left">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 italic">Venue Name</label>
              <input 
                 type="text" 
                 value={venueName} 
                 onChange={(e) => setVenueName(e.target.value)}
                 className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner placeholder:text-gray-400 focus:ring-2 focus:ring-monument-primary transition-all" 
                 placeholder="e.g. University Gym" 
                 required 
                 autoFocus
              />
            </div>
          </div>
        }
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this venue? This action cannot be undone."
      />
      <Toaster />
    </div>
  );
}
