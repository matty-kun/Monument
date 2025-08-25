"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Department {
  id: string;
  name: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    const { data, error } = await supabase.from("departments").select("*").order("name");
    if (!error && data) setDepartments(data);
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await supabase.from("departments").update({ name }).eq("id", editingId);
    } else {
      await supabase.from("departments").insert([{ name }]);
    }
    setName("");
    setEditingId(null);
    fetchDepartments();
  }

  async function handleDelete(id: string) {
    await supabase.from("departments").delete().eq("id", id);
    fetchDepartments();
  }

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Manage Departments</h1>

      <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {editingId ? "Update Department" : "Add Department"}
        </button>
      </form>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Department</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b">
                <td className="px-4 py-2">{dept.name}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(dept.id);
                      setName(dept.name);
                    }}
                    className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-4 text-gray-500">
                  No departments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
