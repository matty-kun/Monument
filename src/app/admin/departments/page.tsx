"use client";
import Image from 'next/image';


import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";

type DepartmentInsert = { name: string; abbreviation: string; image_url?: string };

interface Department {
  id: string;
  name: string;
  abbreviation?: string | null;
  image_url?: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [departmentToDeleteId, setDepartmentToDeleteId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchDepartments = useCallback(async () => {
    const { data, error } = await supabase.from("departments").select("id, name, abbreviation, image_url").order("name");
    if (!error && data) setDepartments(data);
  }, [supabase]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36)}.${fileExt}`;
    const filePath = `departments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('department-images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error(`Error uploading image: ${uploadError.message}`);
      return null;
    }

    const { data } = supabase.storage
      .from('department-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    let imageUrl = null;
    
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) {
        setUploading(false);
        return; // Stop if image upload failed
      }
    }

    try {
      if (editingId) {
        const updateData: DepartmentInsert = { name, abbreviation };
        if (imageUrl) updateData.image_url = imageUrl;
        const { error } = await supabase.from("departments").update(updateData).eq("id", editingId);
        if (error) throw error;
        toast.success("Department updated successfully!");
      } else {
        const insertData: DepartmentInsert = { name, abbreviation };
        if (imageUrl) insertData.image_url = imageUrl;
        const { error } = await supabase.from("departments").insert([insertData]);
        if (error) throw error;
        toast.success("Department added successfully!");
      }
      
      resetForm();
      fetchDepartments();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Error saving department: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setName("");
    setAbbreviation("");
    setEditingId(null);
    setSelectedImage(null);
    setImagePreview(null);
  }

  async function handleDelete(id: string) {
    setDepartmentToDeleteId(id);
    setShowConfirmModal(true);
  }

  async function handleConfirmDelete() {
    if (!departmentToDeleteId) return;

    try {
      const dept = departments.find(d => d.id === departmentToDeleteId);
      
      if (dept?.image_url) {
        const urlParts = dept.image_url.split('/');
        const filePath = `departments/${urlParts[urlParts.length - 1]}`;
        const { error: storageError } = await supabase.storage.from('department-images').remove([filePath]);
        if (storageError) throw storageError;
      }

      const { error } = await supabase.from("departments").delete().eq("id", departmentToDeleteId);
      if (error) throw error;
      toast.success("Department deleted successfully!");
      fetchDepartments();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Error deleting department: ${err.message}`);
    } finally {
      setShowConfirmModal(false);
      setDepartmentToDeleteId(null);
    }
  }

  function handleEdit(dept: Department) {
    setEditingId(dept.id);
    setName(dept.name);
    setAbbreviation(dept.abbreviation || "");
    setImagePreview(dept.image_url || null);
    setSelectedImage(null);
  }

  

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Departments' }]} />
      <h1 className="text-2xl font-bold mb-4">🏫 Manage Departments</h1>

      <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Name
            </label>
            <input
              type="text"
              placeholder="Enter department name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abbreviation
            </label>
            <input
              type="text"
              placeholder="e.g. Ccs"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          {imagePreview && (
            <div className="mt-2">
              <Image 
                src={imagePreview} 
                alt="Preview" 
                width={80}
                height={80}
                className="object-cover rounded border"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Saving..." : editingId ? "Update Department" : "Add Department"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="table-container">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left">Image</th>
                <th className="table-cell text-left">Department</th>
                <th className="table-cell text-left">Abbreviation</th>
                <th className="table-cell text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {departments.map((dept) => (
                <tr key={dept.id} className="table-row">
                  <td className="table-cell">
                  {dept.image_url ? (
                    <Image 
                      src={dept.image_url} 
                      alt={dept.name}
                      width={48}
                      height={48}
                      className="object-cover rounded border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No img</span>
                    </div>
                  )}
                </td>
                <td className="table-cell font-medium">{dept.name}</td>
                <td className="table-cell font-mono text-sm text-gray-600">{dept.abbreviation}</td>
                <td className="table-cell text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="btn-danger py-1 px-3 text-sm rounded"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="table-cell text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2">🏫</span>
                    <span>No departments yet. Add your first department!</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this department entry? This action cannot be undone."
      />
      <Toaster />
    </div>
  );
}