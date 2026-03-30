'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import { Settings, LogOut, Medal, Flag, CalendarDays, Building2, Tags, MapPin, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCard, setLoadingCard] = useState("");

  const handleCardClick = (href: string) => {
    setLoadingCard(href);
    router.push(href);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    } else {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    async function fetchUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
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
        <BouncingBallsLoader />
      </div>
    );
  }

  // ✅ Helper for repeated dashboard cards
  const renderCard = (href: string, icon: React.ReactNode, title: string, desc: string) => (
    <div
      onClick={() => handleCardClick(href)}
      className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center group no-underline cursor-pointer dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {loadingCard === href ? (
        <div className="flex justify-center items-center h-full min-h-[150px]">
          <BouncingBallsLoader />
        </div>
      ) : (
        <>
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform flex justify-center">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">{title}</h3>
          <p className="text-gray-600 text-sm dark:text-gray-300">{desc}</p>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-bold text-monument-primary mb-2">
            <Settings className="w-10 h-10" /> Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            CITE SIDLAK Test Management
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger flex items-center gap-2">
          <LogOut className="w-5 h-5"/> Logout
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderCard(
          "/admin/results",
          <Medal className="w-12 h-12 text-yellow-500" />,
          "Add Results",
          "Record competition results and award medals"
        )}
        {renderCard(
          "/admin/events",
          <Flag className="w-12 h-12 text-blue-500" />,
          "Manage Events",
          "Create and organize competition events"
        )}
        {renderCard(
          "/admin/schedule",
          <CalendarDays className="w-12 h-12 text-green-500" />,
          "Manage Schedule",
          "Manage the schedule of events"
        )}
        {renderCard(
          "/admin/departments",
          <Building2 className="w-12 h-12 text-purple-500" />,
          "Manage Teams",
          "Add and organize participating teams"
        )}
        {renderCard(
          "/admin/categories",
          <Tags className="w-12 h-12 text-pink-500" />,
          "Manage Categories",
          "Organize events into different categories"
        )}
        {renderCard(
          "/admin/venues",
          <MapPin className="w-12 h-12 text-red-500" />,
          "Manage Venues",
          "Add and organize event venues"
        )}

        {/* 👑 Only show for super admins */}
        {role === "super_admin" &&
          renderCard(
            "/admin/users",
            <Users className="w-12 h-12 text-indigo-500" />,
            "Manage Users",
            "Promote users to admin roles (Super Admin Only)"
          )}
      </div>
    </div>
  );
}
