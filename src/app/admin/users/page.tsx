export const dynamic = "force-dynamic";

import ManageUsersClient from "./ManageUsersClient";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { getUsers, UserProfile } from "@/utils/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Users | CITE FEST 2026",
};

export default async function ManageUsersPage() {
  let users: UserProfile[] = [];
  let currentUserId: string | null = null;

  try {
    const { users: fetchedUsers, currentUserId: fetchedUserId } = await getUsers();
    users = fetchedUsers;
    currentUserId = fetchedUserId;
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
