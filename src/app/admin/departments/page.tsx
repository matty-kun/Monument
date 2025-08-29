"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Department {
  id: string;
  name: string;
  image_url?: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    const { data, error } = await supabase.from("departments").select("*").order("name");
    if (!error && data) setDepartments(data);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
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
      console.error('Error uploading image:', uploadError);
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
    
    // Upload image if selected
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
    }

    try {
      if (editingId) {
        const updateData: any = { name };
        if (imageUrl) updateData.image_url = imageUrl;
        
        await supabase.from("departments").update(updateData).eq("id", editingId);
      } else {
        const insertData: any = { name };
        if (imageUrl) insertData.image_url = imageUrl;
        
        await supabase.from("departments").insert([insertData]);
      }
      
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setName("");
    setEditingId(null);
    setSelectedImage(null);
    setImagePreview(null);
  }

  async function handleDelete(id: string) {
    // Get the department to delete its image from storage
    const dept = departments.find(d => d.id === id);
    
    if (dept?.image_url) {
      // Extract file path from URL and delete from storage
      const urlParts = dept.image_url.split('/');
      const filePath = `departments/${urlParts[urlParts.length - 1]}`;
      await supabase.storage.from('department-images').remove([filePath]);
    }

    await supabase.from("departments").delete().eq("id", id);
    fetchDepartments();
  }

  function handleEdit(dept: Department) {
    setEditingId(dept.id);
    setName(dept.name);
    setImagePreview(dept.image_url || null);
    setSelectedImage(null);
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">🏫 Manage Departments</h1>

      <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow">
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
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded border"
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
        <table className="min-w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Image</th>
              <th className="px-4 py-2 text-left">Department</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  {dept.image_url ? (
                    <img 
                      src={dept.image_url} 
                      alt={dept.name}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No img</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 font-medium">{dept.name}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="px-3 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${dept.name}?`)) {
                          handleDelete(dept.id);
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
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
  );
}