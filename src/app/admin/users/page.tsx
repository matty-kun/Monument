export const dynamic = "force-dynamic";

import ManageUsersClient from "./ManageUsersClient";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { createReadOnlyClient, createServiceClient } from "@/utils/supabase/server";
import { UserProfile } from "@/utils/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Users | MONUMENT 2026",
};

export default async function ManageUsersPage() {
  let users: UserProfile[] = [];
  let currentUserId: string | null = null;

  try {
    const supabase = await createReadOnlyClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      currentUserId = user.id;
      const adminSupabase = createServiceClient();
      
      const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers();
      if (!authError && authUsers) {
        const { data: profiles, error: profilesError } = await adminSupabase
          .from("profiles")
          .select("id, role, email");
          
        if (!profilesError && profiles) {
          const profileMap = new Map(profiles.map((p) => [p.id, p.role]));
          users = authUsers.users.map((u) => ({
            id: u.id,
            email: u.email || "N/A",
            role: profileMap.get(u.id) || "user",
          }));
        }
      }
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-6 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/admin/dashboard", label: "Dashboard" },
            { label: "Manage Users" },
          ]}
        />

        <div className="mb-6">
          <h1 className="flex items-center gap-3 text-[32px] font-black text-white tracking-tight leading-none mb-2">
            Manage Users
          </h1>
          <p className="text-[15px] text-white/50 font-semibold tracking-wide">
            Create new accounts and assign roles securely.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-6 md:px-8 overflow-hidden">
        {/* ✅ Pass both initialUsers and currentUserId */}
        <ManageUsersClient initialUsers={users} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
