"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";

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

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Error fetching categories.");
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nameToSubmit = editingCategory ? editingCategory.name : newCategoryName;

    if (!nameToSubmit.trim()) {
      toast.error("Category name cannot be empty.");
      return;
    }

    if (editingCategory) {
      // Update existing category
      const { error } = await supabase
        .from("categories")
        .update({ name: nameToSubmit.trim() })
        .eq("id", editingCategory.id);

      if (error) {
        toast.error(`Error updating category: ${error.message}`);
      } else {
        toast.success("Category updated successfully!");
        setEditingCategory(null);
        fetchCategories();
      }
    } else {
      // Add new category
      const { error } = await supabase
        .from("categories")
        .insert([{ name: nameToSubmit.trim() }]);

      if (error) {
        toast.error(`Error adding category: ${error.message}`);
      } else {
        toast.success("Category added successfully!");
        setNewCategoryName("");
        fetchCategories();
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDeleteId) return;

    const { error } = await supabase.from("categories").delete().eq("id", categoryToDeleteId);

    if (error) {
      toast.error("Error deleting category. It might be in use by some events.");
    } else {
      toast.success("Category deleted successfully!");
      fetchCategories();
    }
    setShowConfirmModal(false);
    setCategoryToDeleteId(null);
  };

  return (
    <div className="max-w-4xl mx-auto dark:text-gray-200">
      <Toaster position="top-center" />
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Categories' }]} />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">🏷️ Manage Categories</h1>
        <p className="text-gray-600 dark:text-gray-400">Add, edit, or delete event categories.</p>
      </div>

      <div className="card mb-8 dark:bg-gray-800">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {editingCategory ? "Edit Category Name" : "New Category Name"}
            </label>
            <input
              id="category-name"
              type="text"
              placeholder="e.g., Sports, Socio-Cultural"
              className="input dark:bg-gray-700 dark:border-gray-600"
              value={editingCategory ? editingCategory.name : newCategoryName}
              onChange={(e) =>
                editingCategory
                  ? setEditingCategory({ ...editingCategory, name: e.target.value })
                  : setNewCategoryName(e.target.value)
              }
              required
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {editingCategory && (
              <button type="button" onClick={() => setEditingCategory(null)} className="btn btn-secondary w-1/2 sm:w-auto">
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              {editingCategory ? "💾 Save" : "➕ Add"}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <BouncingBallsLoader />
        </div>
      ) : (
        <div className="table-container bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="table-cell text-left text-xs font-medium uppercase tracking-wider dark:text-gray-300">Category Name</th>
                <th className="table-cell text-center text-xs font-medium uppercase tracking-wider dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
              {categories.map((category) => (
                <tr key={category.id} className="table-row dark:hover:bg-gray-700/50">
                  <td className="table-cell font-medium text-gray-900 dark:text-gray-100">{category.name}</td>                  
                  <td className="table-cell text-center text-sm font-medium">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => setEditingCategory(category)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDeleteClick(category.id)} className="btn-danger py-1 px-3 text-sm rounded">
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
    </div>
  );
}