"use client";

import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();


  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Logout failed. Please try again.');
      return;
    }
    router.push("/admin/login");
  }

  

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-monument-green mb-2">⚙️ Admin Dashboard</h1>
          <p className="text-gray-600">Manage your intramurals system</p>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-danger"
        >
          🚪 Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/results"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">➕</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Add Results</h3>
          <p className="text-gray-600 text-sm">Record competition results and award medals</p>
        </Link>
        
        <Link
          href="/admin/events"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏟️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Events</h3>
          <p className="text-gray-600 text-sm">Create and organize competition events</p>
        </Link>

        <Link
          href="/admin/schedule"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🗓️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Schedule</h3>
          <p className="text-gray-600 text-sm">Manage the schedule of events</p>
        </Link>
        
        <Link
          href="/admin/departments"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏫</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Departments</h3>
          <p className="text-gray-600 text-sm">Add and organize participating departments</p>
        </Link>
        
        
      </div>
    </div>
  );
}
