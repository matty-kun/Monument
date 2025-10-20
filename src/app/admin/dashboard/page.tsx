'use client';

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumbs from "../../../components/Breadcrumbs";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    } else {
      console.error('Logout failed:', error);
    }
  }

  useEffect(() => {
    async function fetchUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Fetch role from your `profiles` or `users` table
      const { data, error } = await supabase
        .from("profiles") // make sure this is your table name
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching role:", error);
      } else {
        setRole(data?.role || "user");
      }

      setLoading(false);
    }

    fetchUserRole();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-monument-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-monument-green mb-2">
            ⚙️ Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your intramurals system
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger">
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
          <p className="text-gray-600 text-sm dark:text-gray-300">Record competition results and award medals</p>
        </Link>

        <Link
          href="/admin/events"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏟️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Events</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">Create and organize competition events</p>
        </Link>

        <Link
          href="/admin/schedule"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🗓️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Schedule</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">Manage the schedule of events</p>
        </Link>

        <Link
          href="/admin/departments"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏫</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Departments</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">Add and organize participating departments</p>
        </Link>

        <Link
          href="/admin/categories"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏷️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Categories</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">Organize events into different categories</p>
        </Link>

        <Link
          href="/admin/venues"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Venues</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">Add and organize event venues</p>
        </Link>

        {/* 👑 Only show this if user is a super_admin */}
        {role === "super_admin" && (
          <Link
            href="/admin/users"
            className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Manage Users</h3>
            <p className="text-gray-600 text-sm dark:text-gray-300">
              Promote users to admin roles (Super Admin Only)
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
