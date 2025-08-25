"use client";

import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/results"
          className="bg-blue-100 hover:bg-blue-200 p-6 rounded-lg shadow text-center"
        >
          ➕ Add Result
        </Link>
        <Link
          href="/admin/events"
          className="bg-green-100 hover:bg-green-200 p-6 rounded-lg shadow text-center"
        >
          📅 Manage Events
        </Link>
        <Link
          href="/admin/departments"
          className="bg-yellow-100 hover:bg-yellow-200 p-6 rounded-lg shadow text-center"
        >
          🏫 Manage Departments
        </Link>
      </div>
    </div>
  );
}
