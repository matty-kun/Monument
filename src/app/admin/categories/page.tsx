"use client";

import { useState, useEffect, FormEvent, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FaTable, FaThLarge, FaSearch, FaPlus, FaTrash, FaEdit, FaTag } from "react-icons/fa";

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("categories").select("id, name").order("name", { ascending: true });
    if (!error) setCategories(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
    document.title = "Manage Categories | CITE FEST 2026";
  }, [fetchCategories]);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = editingCategory ? editingCategory.name : newCategoryName;
    if (!name.trim()) { toast.error("Name is required."); return; }

    if (editingCategory) {
      const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", editingCategory.id);
      if (error) toast.error(error.message);
      else { toast.success("Category updated!"); setEditingCategory(null); fetchCategories(); }
    } else {
      const { error } = await supabase.from("categories").insert([{ name: name.trim() }]);
      if (error) toast.error(error.message);
      else { toast.success("Category added!"); setNewCategoryName(""); fetchCategories(); }
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  if (loading) return <div className="flex justify-center items-center h-screen"><BouncingBallsLoader /></div>;

  return (
    <div className="w-full h-full dark:text-gray-200 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Categories' }]} />
      </div>
      
      <div className="mb-4 shrink-0">
        <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight">{editingCategory ? 'Edit Category' : 'Manage Categories'}</h1>
        <p className="text-sm text-gray-500 font-medium">Organize events into logical groups like Sports or Socio-Cultural</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-4 h-full flex flex-col min-h-0 pb-2">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-100">{editingCategory ? 'Update Category' : 'New Category'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative flex flex-col">
                <form onSubmit={handleFormSubmit} className="space-y-6 flex flex-col">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category Name</label>
                    <input 
                       type="text" 
                       value={editingCategory ? editingCategory.name : newCategoryName} 
                       onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, name: e.target.value }) : setNewCategoryName(e.target.value)}
                       className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner placeholder:text-gray-400 focus:ring-2 focus:ring-monument-primary transition-all" 
                       placeholder="e.g. Sports" 
                       required 
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button type="submit" className="w-full bg-monument-primary hover:bg-monument-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95">
                      {editingCategory ? 'UPDATE CATEGORY' : 'ADD CATEGORY'}
                    </button>
                    {editingCategory && (
                      <button type="button" onClick={() => setEditingCategory(null)} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold py-3 rounded-2xl hover:bg-gray-200 transition-colors">Cancel Edit</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
        </div>

        {/* RIGHT COLUMN: List */}
        <div className="lg:col-span-8 h-full flex flex-col min-h-0 pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm gap-4 shrink-0 mb-4">
               <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium" />
               </div>
               <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl">
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
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Name</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filteredCategories.length === 0 ? (
                          <tr><td colSpan={3} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No categories found</td></tr>
                        ) : filteredCategories.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                            <td className="px-8 py-5">
                              <span className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight">{c.name}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setEditingCategory(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all"><FaEdit /></button>
                                <button onClick={() => { setCategoryToDeleteId(c.id); setShowConfirmModal(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><FaTrash /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar p-2 h-full">
                  {filteredCategories.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-sm">No categories found</div>
                  ) : filteredCategories.map((c) => (
                    <div key={c.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all group relative items-center flex flex-row gap-5">
                       <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-monument-primary border border-gray-100 dark:border-gray-700 shadow-sm"><FaTag size={20} /></div>
                       <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight leading-tight flex-1 truncate">{c.name}</h4>
                       <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingCategory(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-8 h-8 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaEdit size={12}/></button>
                          <button onClick={() => { setCategoryToDeleteId(c.id); setShowConfirmModal(true); }} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaTrash size={12}/></button>
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
        onConfirm={async () => {
          if (!categoryToDeleteId) return;
          const { error } = await supabase.from("categories").delete().eq("id", categoryToDeleteId);
          if (error) toast.error("Error deleting category. It might be in use.");
          else { toast.success("Category deleted!"); fetchCategories(); }
          setShowConfirmModal(false); setCategoryToDeleteId(null);
        }}
        title="Confirm Deletion"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
      <Toaster />
    </div>
  );
}