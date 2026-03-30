export const dynamic = "force-dynamic";

import ManageUsersClient from "./ManageUsersClient";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { getUsers, UserProfile } from "@/utils/actions";

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
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <Breadcrumbs
        items={[
          { href: "/admin/dashboard", label: "Dashboard" },
          { label: "Manage Users" },
        ]}
      />

      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-bold text-monument-primary mb-2">
          👥 Manage Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create new accounts and assign roles securely.
        </p>
      </div>

      {/* ✅ Pass both initialUsers and currentUserId */}
      <ManageUsersClient initialUsers={users} currentUserId={currentUserId} />
    </div>
  );
}
