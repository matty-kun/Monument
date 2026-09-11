"use client";
import Image from 'next/image';

import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { FaTable, FaThLarge, FaSearch, FaPlus, FaTrash, FaEdit, FaShieldAlt, FaDownload } from "react-icons/fa";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useTournament } from "@/components/AdminTournamentProvider";
import ImportFromTournamentModal from "../../../components/ImportFromTournamentModal";
import { useDepartmentsViewModel } from "@/features/admin/departments/viewModels/useDepartmentsViewModel";

export default function DepartmentsPage() {
  const { selectedTournament } = useTournament();
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
    showImportModal,
    setShowImportModal,
    handleAddLogo,
    handleUpdateLogoUrl,
    handleRemoveLogo,
    handleAddEmptyLogo,
    handleAddOrUpdate,
    resetForm,
    handleConfirmDelete,
    handleImportTeams,
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
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-white hover:text-monument-primary hover:border-monument-primary dark:hover:text-monument-primary dark:hover:border-monument-primary transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <FaDownload size={14} /> Import from Past
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        {!selectedTournament?.is_archived && (
        <div className="lg:col-span-4 h-full flex flex-col min-h-0 pb-2">
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
              <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#1c1c1e] shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">{editingId ? 'Update Team' : 'Team Entry Form'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative flex flex-col">
                <form onSubmit={handleAddOrUpdate} className="space-y-6 flex flex-col">
                  <div className="flex flex-col gap-4 bg-gray-50 dark:bg-white/5 p-8 rounded-[24px] border border-dashed border-gray-200 dark:border-white/5 relative w-full">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 absolute top-3 left-4">Logo Visuals</label>
                      <div className="flex flex-col gap-6 mt-4 w-full">
                        {logos.map((logo, index) => (
                          <div key={index} className="flex gap-4 items-center p-4 bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative group">
                            <button type="button" onClick={() => handleRemoveLogo(index)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md">
                              <FaTrash size={10} />
                            </button>
                            <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/5 flex items-center justify-center">
                              {logo.url ? <img src={logo.url} className="w-full h-full object-contain" alt="Preview"/> : <FaShieldAlt size={24} className="text-gray-200 dark:text-white/20" />}
                            </div>
                            <div className="flex flex-col gap-2 w-full">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-white/40">
                                   <span className="text-[10px] font-bold">URL:</span>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="External image link" 
                                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-xs font-medium text-gray-900 dark:text-white outline-none"
                                  value={logo.file ? '' : (logo.url || '')}
                                  onChange={(e) => handleUpdateLogoUrl(index, e.target.value)}
                                  disabled={!!logo.file}
                                />
                              </div>
                              {logo.file && <div className="text-[10px] text-green-500 font-bold px-2">Local file selected for upload</div>}
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-white/40 flex items-center justify-center gap-2 shadow-sm active:scale-95">
                            <FaPlus size={10} /> Upload File
                            <input type="file" className="hidden" accept="image/*" onChange={handleAddLogo} />
                          </label>
                          <button type="button" onClick={handleAddEmptyLogo} className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-white/40 flex items-center justify-center gap-2 shadow-sm active:scale-95">
                            <FaPlus size={10} /> Add URL
                          </button>
                        </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">Team Name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:ring-2 focus:ring-monument-primary transition-all outline-none" placeholder="e.g. CITE Department" required />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">Courses / Abbreviation</label>
                      <input type="text" value={courses} onChange={(e) => setCourses(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:ring-2 focus:ring-monument-primary transition-all outline-none" placeholder="e.g. BSCS, BSIS" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button type="submit" disabled={uploading} className="w-full bg-monument-primary hover:bg-monument-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-50">
                      {uploading ? "SAVING..." : editingId ? "UPDATE TEAM" : "CREATE TEAM"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm} className="w-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/60 font-bold py-3 rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel Edit</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
        </div>
        )}

        {/* RIGHT COLUMN: List */}
        <div className={`${selectedTournament?.is_archived ? 'lg:col-span-12' : 'lg:col-span-8'} h-full flex flex-col min-h-0 pb-2`}>
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-[#1c1c1e] p-4 rounded-[24px] border border-gray-200 dark:border-white/5 shadow-sm gap-4 shrink-0 mb-4">
               <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                  <input type="text" placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border-none rounded-[16px] pl-12 pr-4 py-3 text-sm font-medium outline-none placeholder:text-gray-400 dark:placeholder:text-white/40 focus:ring-2 focus:ring-[#0A84FF]/50 transition-all" />
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
                                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                  }} className="p-2 text-gray-400 dark:text-white/40 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 rounded-xl transition-all"><FaEdit /></button>
                                  <button onClick={() => { setDepartmentToDeleteId(dept.id); setShowConfirmModal(true); }} className="p-2 text-gray-400 dark:text-white/40 hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-xl transition-all"><FaTrash /></button>
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
                              window.scrollTo({ top: 0, behavior: 'smooth' }); 
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
      />
      <ImportFromTournamentModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportTeams}
        currentTournamentId={selectedTournament?.id || ""}
        title="Import Teams"
        description="Select a past tournament to instantly copy all its participating teams into the current season. Duplicates will be skipped."
      />
      <Toaster />
    </div>
  );
}