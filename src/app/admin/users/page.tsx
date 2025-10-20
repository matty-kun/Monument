"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { getUsers, updateUserRole, UserProfile } from "../../../utils/actions";
import Breadcrumbs from "../../../components/Breadcrumbs";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import { FiUsers, FiShield, FiUser } from "react-icons/fi";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { users: fetchedUsers, currentUserId } = await getUsers();

      // Filter out the current user from the list
      const filteredUsers = fetchedUsers.filter(user => user.id !== currentUserId);

      // Define allowed roles and their order
      const roleOrder: Record<"super_admin" | "admin" | "user", number> = {
        super_admin: 0,
        admin: 1,
        user: 2,
      };

      // Sort users to show super_admins and admins first
      filteredUsers.sort((a, b) => {
        const aRole = (a.role as keyof typeof roleOrder) || "user";
        const bRole = (b.role as keyof typeof roleOrder) || "user";
        return roleOrder[aRole] - roleOrder[bRole];
      });

      setUsers(filteredUsers);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const originalUsers = [...users];

    // Optimistically update the UI
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

    const toastId = toast.loading("Updating role...");
    const result = await updateUserRole(userId, newRole);

    if (result.success) {
      toast.success(result.message, { id: toastId });
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
      // Revert UI on failure
      setUsers(originalUsers);
    }
  };

  const capitalizeWords = (str: string): string => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-monument-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            ⛔ Access Denied
          </h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <Breadcrumbs
        items={[
          { href: "/admin/dashboard", label: "📊 Dashboard" },
          { label: "Manage Users" },
        ]}
      />
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-bold text-monument-green mb-2 dark:text-green-400">
          👥 Manage Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Assign roles and manage access for all registered users.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-monument-green to-green-600 dark:from-green-700 dark:to-green-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === "super_admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : user.role === "admin"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {user.role === "super_admin" ? <FiShield /> : <FiUser />}
                      {capitalizeWords(user.role.replace("_", " "))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SingleSelectDropdown
                      selectedValue={user.role}
                      onChange={(newRole) => handleRoleChange(user.id, newRole)}
                      options={[
                        { id: "user", name: "User", icon: "👤" },
                        { id: "admin", name: "Admin", icon: "🛡️" },
                        {
                          id: "super_admin",
                          name: "Super Admin",
                          icon: "👑",
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
