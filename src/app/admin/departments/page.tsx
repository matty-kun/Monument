"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";
import { FaTable, FaThLarge, FaSearch, FaTrash, FaEdit, FaShieldAlt, FaPlus, FaLink, FaUpload } from "react-icons/fa";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useTournament } from "@/components/AdminTournamentProvider";
import { useDepartmentsViewModel } from "@/features/admin/departments/viewModels/useDepartmentsViewModel";
import { X } from "lucide-react";

export default function DepartmentsPage() {
  const { selectedTournament } = useTournament();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const {
    name,
    setName,
    courses,
    setCourses,
    editingId,
    setEditingId,
    logos,
    setLogos,
    uploading,
    showConfirmModal,
    setShowConfirmModal,
    departmentToDeleteId,
    setDepartmentToDeleteId,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    handleAddLogo,
    handleUpdateLogoUrl,
    handleRemoveLogo,
    handleAddEmptyLogo,
    handleAddOrUpdate,
    resetForm,
    handleConfirmDelete,
    filteredDepartments,
  } = useDepartmentsViewModel({ selectedTournament });

  if (!selectedTournament) return <EmptyTournamentState />;

  return (
    <div className="w-full h-full text-gray-900 dark:text-white flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Teams' }]} />
      </div>

      <div className="mb-4 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight">{editingId ? 'Edit Team' : 'Manage Teams'}</h1>
          <p className="text-sm text-gray-500 font-medium">Manage departmental representatives and team profiles</p>
        </div>
        {!selectedTournament?.is_archived && (
          <button 
            onClick={() => {
              resetForm();
              setShowTeamModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#269a7a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b7359] active:scale-95"
          >
            <FaPlus size={12} /> Add team
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        {!selectedTournament?.is_archived && showTeamModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <button className="absolute inset-0 cursor-default" aria-label="Close add team form" onClick={() => setShowTeamModal(false)} />
            <div className="relative max-h-[90vh] w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-white/10 dark:bg-[#181818]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">{editingId ? 'Edit team' : 'Add team'}</h2>
                    <p className="mt-1 text-[13px] leading-5 text-gray-500 dark:text-white/45">
                      Create the team profile used across schedules, results, and public standings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowTeamModal(false);
                    }}
                    className="admin-icon-button shrink-0"
                    aria-label="Close team form"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
              
              <div className="max-h-full overflow-y-auto custom-scrollbar">
                <form onSubmit={handleAddOrUpdate} className="flex flex-col">
                  <div className="space-y-5 p-5">
                    <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Team details</h3>
                        <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/40">Keep names short so they fit cleanly on public match cards.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-medium text-gray-700 dark:text-white/70">Team name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[14px] font-medium text-gray-950 outline-none transition focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/15 dark:border-white/10 dark:bg-[#111] dark:text-white dark:focus:border-[#33d6a6]"
                          placeholder="CITE Department"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-medium text-gray-700 dark:text-white/70">Courses or abbreviation</label>
                        <input
                          type="text"
                          value={courses}
                          onChange={(e) => setCourses(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[14px] font-medium text-gray-950 outline-none transition focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/15 dark:border-white/10 dark:bg-[#111] dark:text-white dark:focus:border-[#33d6a6]"
                          placeholder="BSCS, BSIS"
                        />
                      </div>
                    </section>

                    <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Media</h3>
                          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/40">Add one clean logo or mascot image.</p>
                        </div>
                        <div className="flex gap-1.5">
                          <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10">
                            <FaUpload size={11} /> Upload
                            <input type="file" className="hidden" accept="image/*" onChange={handleAddLogo} />
                          </label>
                          <button
                            type="button"
                            onClick={handleAddEmptyLogo}
                            className="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                          >
                            <FaLink size={11} /> URL
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {logos.length === 0 ? (
                          <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-3 dark:border-white/10 dark:bg-[#111]">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5">
                              <FaShieldAlt size={18} className="text-gray-400 dark:text-white/25" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-gray-800 dark:text-white/80">No logo selected</p>
                              <p className="text-[12px] text-gray-500 dark:text-white/40">Upload an image or paste a direct image URL.</p>
                            </div>
                          </div>
                        ) : logos.map((logo, index) => (
                          <div key={index} className="group rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#111]">
                            <div className="flex items-center gap-3">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                                {logo.url ? <img src={logo.url} className="h-full w-full object-contain" alt="Team logo preview"/> : <FaShieldAlt size={18} className="text-gray-300 dark:text-white/25" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                {logo.file ? (
                                  <div>
                                    <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">Ready to upload</p>
                                    <p className="truncate text-[12px] text-gray-500 dark:text-white/40">{logo.file.name}</p>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="https://example.com/logo.png"
                                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-950 outline-none transition focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-[#33d6a6]"
                                    value={logo.url || ''}
                                    onChange={(e) => handleUpdateLogoUrl(index, e.target.value)}
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveLogo(index)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                aria-label="Remove logo"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#181818]/95">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setShowTeamModal(false);
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="rounded-lg bg-[#269a7a] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1b7359] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading ? "Saving..." : editingId ? "Save changes" : "Add team"}
                    </button>
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
                  <input type="text" placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-transparent focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 rounded-[16px] text-[13px] font-medium transition-all outline-none shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500" />
               </div>
               <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                  <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-[#1c1c1e] shadow-sm text-monument-primary border border-gray-200 dark:border-white/10' : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'}`}><FaTable size={18}/></button>
                  <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-[#1c1c1e] shadow-sm text-monument-primary border border-gray-200 dark:border-white/10' : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'}`}><FaThLarge size={18}/></button>
               </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                  <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-sm border border-gray-200 dark:border-white/5 flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
                    <div className="overflow-y-auto custom-scrollbar overflow-x-auto relative flex-1">
                      <table className="min-w-full divide-y divide-gray-100 dark:divide-white/5">
                        <thead className="bg-gray-50 dark:bg-[#1c1c1e]/90 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">Logo</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">Team Name</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">Abbr / Courses</th>
                          {!selectedTournament?.is_archived && <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredDepartments.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center text-gray-400 dark:text-white/40 font-bold uppercase tracking-widest text-xs">No teams found</td></tr>
                        ) : filteredDepartments.map((dept) => (
                          <tr key={dept.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-5">
                              {dept.image_url ? <img src={dept.image_url} className="w-10 h-10 object-contain drop-shadow-sm border-2 border-white dark:border-white/5 shadow-sm rounded-full bg-white dark:bg-[#1c1c1e]" /> : <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center"><FaShieldAlt className="text-gray-300 dark:text-white/20" /></div>}
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{dept.name}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-xs font-bold text-gray-500 dark:text-white/60 uppercase">{dept.courses || '--'}</span>
                            </td>
                            {!selectedTournament?.is_archived && (
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => { 
                                    setEditingId(dept.id); 
                                    setName(dept.name); 
                                    setCourses(dept.courses || ""); 
                                    setLogos(dept.image_url ? dept.image_url.split(',').map(url => ({ url: url.trim(), file: null })) : []);
                                    setShowTeamModal(true);
                                  }} className="p-2 bg-yellow-400/15 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/25 rounded-xl transition-all"><FaEdit /></button>
                                  <button onClick={() => { setDepartmentToDeleteId(dept.id); setShowConfirmModal(true); }} className="p-2 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-xl transition-all"><FaTrash /></button>
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
                  <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar p-2 h-full">
                  {filteredDepartments.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 dark:text-white/40 font-bold uppercase tracking-widest text-sm">No teams found</div>
                  ) : filteredDepartments.map((dept) => (
                    <div key={dept.id} className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[24px] shadow-sm border border-gray-200 dark:border-white/5 hover:shadow-xl transition-all group relative items-center text-center flex flex-col">
                       <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 mb-4 shadow-inner border-2 border-white dark:border-white/5 flex items-center justify-center">
                          {dept.image_url ? <img src={dept.image_url} className="w-full h-full object-contain" /> : <FaShieldAlt size={32} className="text-gray-200 dark:text-white/20" />}
                       </div>
                       <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">{dept.name}</h4>
                       <p className="text-[10px] text-gray-400 dark:text-white/40 font-bold uppercase tracking-widest mt-1">{dept.courses || 'No Courses Listed'}</p>
                       
                       {!selectedTournament?.is_archived && (
                         <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { 
                              setEditingId(dept.id); 
                              setName(dept.name); 
                              setCourses(dept.courses || ""); 
                              setLogos(dept.image_url ? dept.image_url.split(',').map(url => ({ url: url.trim(), file: null })) : []);
                              setShowTeamModal(true);
                            }} className="w-8 h-8 bg-yellow-400/20 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/30 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaEdit size={12}/></button>
                            <button onClick={() => { setDepartmentToDeleteId(dept.id); setShowConfirmModal(true); }} className="w-8 h-8 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaTrash size={12}/></button>
                         </div>
                       )}
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
        message="Are you sure you want to delete this team? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
      <Toaster />
    </div>
  );
}
