"use client";

import { useState, useEffect, FormEvent, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FaTable, FaThLarge } from "react-icons/fa";

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
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredCategories = useMemo(() => {
    if (!searchQuery) {
      return categories;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [categories, searchQuery]);

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

      {/* Search and View Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-1/2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="inline-flex rounded-md shadow-sm bg-white dark:bg-gray-800 self-end">
          <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm font-medium rounded-l-lg flex items-center gap-2 ${viewMode === 'table' ? 'bg-monument-green text-white dark:bg-green-600' : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <FaTable /> Table
          </button>
          <button onClick={() => setViewMode('card')} className={`px-3 py-2 text-sm font-medium rounded-r-lg flex items-center gap-2 ${viewMode === 'card' ? 'bg-monument-green text-white dark:bg-green-600' : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <FaThLarge /> Cards
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <BouncingBallsLoader />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div key="table" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="table-container">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                  <thead className="table-header bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="table-cell text-left text-xs font-medium uppercase tracking-wider dark:text-gray-300">Category Name</th>
                      <th className="table-cell text-center text-xs font-medium uppercase tracking-wider dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="table-row dark:hover:bg-gray-700/50">
                        <td className="table-cell font-medium text-gray-900 dark:text-gray-100">{category.name}</td>
                        <td className="table-cell text-center text-sm font-medium">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => setEditingCategory(category)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors">✏️ Edit</button>
                            <button onClick={() => handleDeleteClick(category.id)} className="btn-danger py-1 px-3 text-sm rounded">🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCategories.length === 0 && (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          {searchQuery ? "No categories match your search." : "No categories yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div key="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🏷️</span>
                      <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate" title={category.name}>
                        {category.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 flex gap-2 justify-end rounded-b-lg mt-auto">
                    <button onClick={() => { setEditingCategory(category); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors">✏️ Edit</button>
                    <button onClick={() => handleDeleteClick(category.id)} className="btn-danger py-1 px-3 text-sm rounded">🗑️ Delete</button>
                  </div>
                </Card>
              ))}
              {filteredCategories.length === 0 && (
                <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="text-6xl mb-4">🏷️</div>
                  <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">{searchQuery ? "No Categories Match Your Search" : "No Categories Yet"}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{searchQuery ? "Try a different search term." : "Add a new category using the form above."}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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