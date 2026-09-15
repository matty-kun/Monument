"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";
import { FaTable, FaThLarge, FaSearch, FaPlus, FaTrash, FaEdit, FaTag } from "react-icons/fa";
import { useTournament } from "@/components/AdminTournamentProvider";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useCategoriesViewModel } from "@/features/admin/categories/viewModels/useCategoriesViewModel";
import { X } from "lucide-react";

export default function CategoriesPage() {
  const { selectedTournament } = useTournament();
  const {
    loading,
    filteredCategories,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    showFormModal,
    setShowFormModal,
    categoryName,
    setCategoryName,
    editingId,
    setEditingId,
    showConfirmModal,
    setShowConfirmModal,
    setCategoryToDeleteId,
    resetForm,
    handleAddOrUpdate,
    handleDelete,
  } = useCategoriesViewModel();

  if (!selectedTournament) return <EmptyTournamentState />;

  return (
    <div className="w-full h-full text-gray-900 dark:text-white flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Categories' }]} />
        <button 
          onClick={() => { resetForm(); setShowFormModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-[#269a7a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1b7359] active:scale-95"
        >
          <FaPlus size={10} /> Add New Category
        </button>
      </div>
      
      <div className="mb-4 shrink-0">
        <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight">Competition Categories</h1>
        <p className="text-sm text-gray-500 dark:text-white/60 font-medium">Organize events into logical groups like Sports or Socio-Cultural</p>
      </div>

      <div className="flex flex-col flex-1 min-h-0 pb-2">
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 mb-4">
           <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" />
              <input type="text" placeholder="Search categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-transparent focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 rounded-[16px] text-[13px] font-medium transition-all outline-none shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500" />
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
                      <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">Category Name</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {loading ? (
                       <tr><td colSpan={2} className="py-20 text-center text-gray-500 dark:text-white/40 font-bold uppercase tracking-widest text-xs">Loading...</td></tr>
                    ) : filteredCategories.length === 0 ? (
                      <tr><td colSpan={2} className="py-20 text-center text-gray-500 dark:text-white/40 font-bold uppercase tracking-widest text-xs">No categories found</td></tr>
                    ) : filteredCategories.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{c.name}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setCategoryName(c.name); setEditingId(c.id); setShowFormModal(true); }} className="p-2 bg-yellow-400/15 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/25 rounded-xl transition-all" title="Edit Category"><FaEdit /></button>
                            <button onClick={() => { setCategoryToDeleteId(c.id); setShowConfirmModal(true); }} className="p-2 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-xl transition-all" title="Delete Category"><FaTrash /></button>
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
                 <div className="col-span-full py-20 text-center text-gray-500 dark:text-white/40 font-bold uppercase tracking-widest text-sm">Loading Categories...</div>
              ) : filteredCategories.length === 0 ? (
                 <div className="col-span-full py-20 text-center text-gray-500 dark:text-white/40 font-bold uppercase tracking-widest text-sm">No categories found</div>
              ) : filteredCategories.map((c) => (
                <div key={c.id} className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[24px] shadow-sm border border-gray-200 dark:border-white/5 hover:shadow-xl hover:-translate-y-1 transition-all group relative items-center flex flex-row gap-5 h-fit">
                   <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-monument-primary border border-gray-200 dark:border-white/5 shadow-sm shrink-0"><FaTag size={20} /></div>
                   <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight flex-1 truncate">{c.name}</h4>
                   <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setCategoryName(c.name); setEditingId(c.id); setShowFormModal(true); }} className="w-8 h-8 bg-yellow-400/20 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/30 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaEdit size={12}/></button>
                      <button onClick={() => { setCategoryToDeleteId(c.id); setShowConfirmModal(true); }} className="w-8 h-8 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaTrash size={12}/></button>
                   </div>
                </div>
              ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showFormModal && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Close category form"
              onClick={() => { setShowFormModal(false); resetForm(); }}
            />
            <motion.form
              onSubmit={(event) => {
                event.preventDefault();
                handleAddOrUpdate();
              }}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#181818]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-white/10">
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">{editingId ? "Edit category" : "Add category"}</h2>
                  <p className="mt-1 text-[13px] leading-5 text-gray-500 dark:text-white/45">
                    Group related events so schedules and results stay easy to scan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowFormModal(false); resetForm(); }}
                  className="admin-icon-button shrink-0"
                  aria-label="Close category form"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div>
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Category details</h3>
                    <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/40">Use a short label like Sports, Academic, or Arts & Media.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-white/70">Category name</label>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[14px] font-medium text-gray-950 outline-none transition focus:border-[#269a7a] focus:ring-2 focus:ring-[#269a7a]/15 dark:border-white/10 dark:bg-[#111] dark:text-white dark:focus:border-[#33d6a6]"
                      placeholder="Sports"
                      required
                      autoFocus
                    />
                  </div>
                </section>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#181818]/95">
                <button
                  type="button"
                  onClick={() => { setShowFormModal(false); resetForm(); }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#269a7a] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1b7359] active:scale-[0.99]"
                >
                  {editingId ? "Save changes" : "Add category"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
      <Toaster />
    </div>
  );
}
