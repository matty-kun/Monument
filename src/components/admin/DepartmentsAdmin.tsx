"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Department {
  id: string;
  name: string;
}

export function DepartmentsAdmin() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDept, setNewDept] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    const { data } = await supabase.from("departments").select("*").order("name");
    if (data) setDepartments(data);
  }

  async function addDepartment() {
    if (!newDept.trim()) return;
    await supabase.from("departments").insert([{ name: newDept }]);
    setNewDept("");
    fetchDepartments();
  }

  async function deleteDepartment(id: string) {
    await supabase.from("departments").delete().eq("id", id);
    fetchDepartments();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Departments</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Department Name"
          value={newDept}
          onChange={(e) => setNewDept(e.target.value)}
          className="border rounded p-2 flex-1"
        />
        <Button onClick={addDepartment}>Add</Button>
      </div>

      <ul>
        {departments.map((d) => (
          <li key={d.id} className="flex justify-between items-center bg-gray-100 p-3 rounded mb-2">
            {d.name}
            <Button variant="destructive" onClick={() => deleteDepartment(d.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
