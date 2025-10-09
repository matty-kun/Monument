'use client';

import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no user is found, redirect to the login page.
        router.replace('/login');
      } else {
        // If a user is found, stop loading and render the page.
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/login");
    } else {
      console.error('Logout failed:', error);
    }
  }

  // While checking for the user, show a loading screen to prevent flicker
  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />
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

        <Link
          href="/admin/categories"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏷️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Categories</h3>
          <p className="text-gray-600 text-sm">Organize events into different categories</p>
        </Link>

        <Link
          href="/admin/locations"
          className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Locations</h3>
          <p className="text-gray-600 text-sm">Add and organize event locations</p>
        </Link>
      </div>
    </div>
  );
}