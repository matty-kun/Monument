import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import { Category } from "../models/categoryTypes";

export const useCategoriesViewModel = () => {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("categories").select("id, name").order("name", { ascending: true });
    if (!error) setCategories(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
    document.title = "Manage Categories | CITE FEST 2026";
  }, [fetchCategories]);

  const resetForm = () => {
    setCategoryName("");
    setEditingId(null);
  };

  const handleAddOrUpdate = async () => {
    if (!categoryName.trim()) { toast.error("Name is required."); return; }

    try {
      if (editingId) {
        const { error } = await supabase.from("categories").update({ name: categoryName.trim() }).eq("id", editingId);
        if (error) throw error;
        toast.success("Category updated!");
      } else {
        const { error } = await supabase.from("categories").insert([{ name: categoryName.trim() }]);
        if (error) throw error;
        toast.success("Category added!");
      }
      resetForm();
      setShowFormModal(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDeleteId) return;
    const { error } = await supabase.from("categories").delete().eq("id", categoryToDeleteId);
    if (error) {
      toast.error("Error deleting category. It might be in use.");
    } else { 
      toast.success("Category deleted!"); 
      fetchCategories(); 
    }
    setShowConfirmModal(false); 
    setCategoryToDeleteId(null);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  return {
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
  };
};
