"use client";

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// ✅ Accept `email` as a prop
interface AdminDashboardProps {
  email?: string;
}

export default function AdminDashboard({ email }: AdminDashboardProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout failed. Please try again.");
      return;
    }
    router.push("/admin/login");
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">
            ⚙️ Admin Dashboard
          </h1>
          {/* ✅ Display logged-in email */}
          <p className="text-gray-600 dark:text-gray-300">
            Welcome, <span className="font-semibold dark:text-gray-100">{email ?? "Admin"}</span>
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger">
          🚪 Logout
        </button>
      </div>

      {/* ✅ All your links stay the same */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/results"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">➕</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Add Results</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">
            Record competition results and award medals
          </p>
        </Link>

        <Link
          href="/admin/events"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏟️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Manage Events</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">Create and organize competition events</p>
        </Link>

        <Link
          href="/admin/schedule"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🗓️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Manage Schedule</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">Manage the schedule of events</p>
        </Link>

        <Link
          href="/admin/departments"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏫</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Manage Departments</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">
            Add and organize participating departments
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏷️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Manage Categories</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">
            Organize events into different categories
          </p>
        </Link>

        <Link
          href="/admin/venues"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Manage Venues</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">Add and organize event venues</p>
        </Link>
      </div>
    </div>
  );
}