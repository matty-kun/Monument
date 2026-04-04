"use client";
import Image from 'next/image';

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { uploadImageAction, deleteImageAction } from "../actions";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { FaTable, FaThLarge, FaSearch, FaPlus, FaTrash, FaEdit, FaShieldAlt } from "react-icons/fa";

interface Department {
  id: string;
  name: string;
  courses?: string | null;
  image_url?: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [courses, setCourses] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [departmentToDeleteId, setDepartmentToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  const fetchDepartments = useCallback(async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, courses:abbreviation, image_url")
      .not("name", "ilike", "No Team")
      .not("name", "ilike", "No Participant")
      .order("name");
    if (!error && data) setDepartments(data);
  }, [supabase]);

  useEffect(() => {
    fetchDepartments();
    document.title = "Manage Teams | CITE FEST 2026";
  }, [fetchDepartments]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImageAction(formData, 'department-images', 'departments');
    return result.success ? result.publicUrl || null : null;
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    let imageUrl = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) { setUploading(false); return; }
    }

    try {
      const payload: any = { name, abbreviation: courses };
      if (imageUrl) payload.image_url = imageUrl;
      else if (photoRemoved) payload.image_url = null;

      if (editingId) {
        const { error } = await supabase.from("departments").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Team updated!");
      } else {
        const { error } = await supabase.from("departments").insert([payload]);
        if (error) throw error;
        toast.success("Team added!");
      }
      resetForm();
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setName(""); setCourses(""); setEditingId(null); setSelectedImage(null); setImagePreview(null); setPhotoRemoved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleConfirmDelete() {
    if (!departmentToDeleteId) return;
    try {
      const dept = departments.find(d => d.id === departmentToDeleteId);
      if (dept?.image_url) {
        const urlParts = dept.image_url.split('/');
        await deleteImageAction('department-images', `departments/${urlParts[urlParts.length - 1]}`);
      }
      const { error } = await supabase.from("departments").delete().eq("id", departmentToDeleteId);
      if (error) throw error;
      toast.success("Team deleted!");
      fetchDepartments();
    } catch (error: any) { toast.error(error.message); }
    setShowConfirmModal(false);
    setDepartmentToDeleteId(null);
  }

  const filteredDepartments = useMemo(() => {
    if (!searchQuery) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(d => d.name.toLowerCase().includes(q) || d.courses?.toLowerCase().includes(q));
  }, [departments, searchQuery]);

  return (
    <div className="w-full h-full dark:text-gray-200 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Teams' }]} />
      </div>

      <div className="mb-4 shrink-0">
        <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight">{editingId ? 'Edit Team' : 'Manage Teams'}</h1>
        <p className="text-sm text-gray-500 font-medium">Manage departmental representatives and team profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0 pb-2">
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-4 h-full flex flex-col min-h-0 pb-2">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-100">{editingId ? 'Update Team' : 'Team Entry Form'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative flex flex-col">
                <form onSubmit={handleAddOrUpdate} className="space-y-6 flex flex-col">
                  <div className="flex flex-col items-center gap-4 bg-gray-50/50 dark:bg-gray-900/30 p-8 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 group relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-white dark:bg-gray-800 shadow-xl border-4 border-white dark:border-gray-700 flex items-center justify-center relative">
                        {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="Preview"/> : <FaShieldAlt size={40} className="text-gray-200 dark:text-gray-700" />}
                        {imagePreview && (
                            <button type="button" onClick={() => { setImagePreview(null); setSelectedImage(null); setPhotoRemoved(true); }} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <FaTrash className="text-white" />
                            </button>
                        )}
                      </div>
                      <label className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-500">
                        Upload Logo
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                      </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Team Name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-4 text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-monument-primary transition-all" placeholder="e.g. CITE Department" required />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Courses / Abbreviation</label>
                      <input type="text" value={courses} onChange={(e) => setCourses(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-4 text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-monument-primary transition-all" placeholder="e.g. BSCS, BSIS" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button type="submit" disabled={uploading} className="w-full bg-monument-primary hover:bg-monument-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-50">
                      {uploading ? "SAVING..." : editingId ? "UPDATE TEAM" : "CREATE TEAM"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold py-3 rounded-2xl hover:bg-gray-200 transition-colors">Cancel Edit</button>
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
                  <input type="text" placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium" />
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
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Name</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Abbr / Courses</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filteredDepartments.length === 0 ? (
                          <tr><td colSpan={2} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No teams found</td></tr>
                        ) : filteredDepartments.map((dept) => (
                          <tr key={dept.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                            <td className="px-8 py-5">
                              {dept.image_url ? <img src={dept.image_url} className="w-10 h-10 object-cover rounded-full border-2 border-white dark:border-gray-700 shadow-sm" /> : <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><FaShieldAlt className="text-gray-300" /></div>}
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight">{dept.name}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{dept.courses || '--'}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setEditingId(dept.id); setName(dept.name); setCourses(dept.courses || ""); setImagePreview(dept.image_url || null); setSelectedImage(null); setPhotoRemoved(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all"><FaEdit /></button>
                                <button onClick={() => { setDepartmentToDeleteId(dept.id); setShowConfirmModal(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><FaTrash /></button>
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
                  {filteredDepartments.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-sm">No teams found</div>
                  ) : filteredDepartments.map((dept) => (
                    <div key={dept.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group relative items-center text-center flex flex-col">
                       <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-900 mb-4 shadow-inner border-2 border-white dark:border-gray-700 flex items-center justify-center">
                          {dept.image_url ? <img src={dept.image_url} className="w-full h-full object-cover" /> : <FaShieldAlt size={32} className="text-gray-200 dark:text-gray-700" />}
                       </div>
                       <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight leading-tight">{dept.name}</h4>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{dept.courses || 'No Courses Listed'}</p>
                       
                       <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(dept.id); setName(dept.name); setCourses(dept.courses || ""); setImagePreview(dept.image_url || null); setSelectedImage(null); setPhotoRemoved(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-8 h-8 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaEdit size={12}/></button>
                          <button onClick={() => { setDepartmentToDeleteId(dept.id); setShowConfirmModal(true); }} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"><FaTrash size={12}/></button>
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
        message="Are you sure you want to delete this team? This action cannot be undone."
      />
      <Toaster />
    </div>
  );
}