"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getUsers,
  updateUserRole,
  createUser,
  UserProfile,
} from "../../../utils/actions";
import Breadcrumbs from "../../../components/Breadcrumbs";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import { FiShield, FiUser } from 'react-icons/fi';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For new user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { users: fetchedUsers, currentUserId } = await getUsers();

      const filteredUsers = fetchedUsers.filter(
        (user) => user.id !== currentUserId
      );

      const roleOrder: Record<"super_admin" | "admin" | "user", number> = {
        super_admin: 0,
        admin: 1,
        user: 2,
      };

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

    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

    const toastId = toast.loading("Updating role...");
    const result = await updateUserRole(userId, newRole);

    if (result.success) {
      toast.success(result.message, { id: toastId });
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
      setUsers(originalUsers);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    const toastId = toast.loading("Creating new user...");
    const result = await createUser(newEmail, newPassword, newRole);

    if (result.success) {
      toast.success(result.message, { id: toastId });
      setNewEmail("");
      setNewPassword("");
      setNewRole("admin");
      fetchUsers();
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
    }
  };

  const capitalizeWords = (str: string): string => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <BouncingBallsLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2 items-center">
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
          Create new accounts and assign roles securely.
        </p>
      </div>

      {/* Add New User Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-monument-green mb-4">
          ➕ Add New User
        </h2>
        <form
          onSubmit={handleCreateUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
              Email
            </label>
            <input
              type="email"
              className="input w-full"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
              Password
            </label>
            <input
              type={showNewPassword ? "text" : "password"}
              className="input w-full pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-500 hover:text-monument-green dark:text-gray-400 dark:hover:text-green-400"
              tabIndex={-1}
            >
              {showNewPassword ? (
                <FaEyeSlash size={18} />
              ) : (
                <FaEye size={18} />
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
              Role
            </label>
            <SingleSelectDropdown
              selectedValue={newRole}
              onChange={(role) => setNewRole(role)}
              options={[
                { id: "admin", name: "Admin", icon: "🛡️" },
                { id: "super_admin", name: "Super Admin", icon: "👑" },
              ]}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full md:w-auto h-12"
          >
            🚀 Create
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-monument-green to-green-600 dark:from-green-700 dark:to-green-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase dark:text-white tracking-wider">
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
                      onChange={(newRole) =>
                        handleRoleChange(user.id, newRole)
                      }
                      options={[
                        { id: "user", name: "User", icon: "👤" },
                        { id: "admin", name: "Admin", icon: "🛡️" },
                        { id: "super_admin", name: "Super Admin", icon: "👑" },
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
