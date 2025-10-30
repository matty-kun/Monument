"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  updateUserRole,
  deleteUser,
  createUser,
  UserProfile,
} from "../../../utils/actions";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import ConfirmModal from "@/components/ConfirmModal";
import { FiShield, FiUser } from "react-icons/fi";
import { FaEye, FaEyeSlash, FaTable, FaThLarge } from "react-icons/fa";
import { Card } from "@/components/ui/Card";

// ✅ Add props interface
interface ManageUsersClientProps {
  initialUsers: UserProfile[];
  currentUserId?: string | null;
}

export default function ManageUsersClient({
  initialUsers,
  currentUserId,
}: ManageUsersClientProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper: Capitalize role names
  const capitalizeWords = (str: string): string =>
    str
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // 🔹 Role update
  const handleRoleChange = async (userId: string, newRole: string) => {
    const original = [...users];
    setUsers((u) =>
      u.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
    );

    const toastId = toast.loading("Updating role...");
    const result = await updateUserRole(userId, newRole);

    if (result.success) {
      toast.success(result.message, { id: toastId });
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
      setUsers(original); // revert
    }
  };

  // 🔹 Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    const toastId = toast.loading("Creating user...");
    const result = await createUser(newEmail, newPassword, newRole);

    if (result.success && result.user) {
      toast.success(result.message, { id: toastId });
      setUsers((prev) => [result.user!, ...prev]);
      setNewEmail("");
      setNewPassword("");
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
    }
  };

  // 🔹 Delete user
  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const toastId = toast.loading(`Deleting ${userToDelete.email}...`);
    const result = await deleteUser(userToDelete.id);

    if (result.success) {
      toast.success(result.message, { id: toastId });
      setUsers((u) => u.filter((user) => user.id !== userToDelete.id));
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
    }

    setShowConfirmModal(false);
    setUserToDelete(null);
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
          <h2 className="text-2xl font-bold text-red-700 mb-2 items-center">
            ⛔ Access Denied
          </h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* New User Form */}
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
              className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-500 hover:text-monument-green"
            >
              {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
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

          <button type="submit" className="btn btn-primary w-full md:w-auto h-12">
            🚀 Create
          </button>
        </form>
      </div>

      {/* Table or Card View */}
      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-monument-green to-green-600">
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
                    <th className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.email}{" "}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === "super_admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {user.role === "super_admin" ? <FiShield /> : <FiUser />}
                          {capitalizeWords(user.role.replace("_", " "))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <SingleSelectDropdown
                          selectedValue={user.role}
                          onChange={(newRole) => handleRoleChange(user.id, newRole)}
                          options={[
                            { id: "admin", name: "Admin", icon: "🛡️" },
                            { id: "super_admin", name: "Super Admin", icon: "👑" },
                          ]}
                          disabled={user.id === currentUserId}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="btn-danger py-1 px-3 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={user.id === currentUserId}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <p>Card View (coming soon)</p>
        )}
      </AnimatePresence>

      {userToDelete && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm Delete"
          message={
            <span>
              Are you sure you want to delete{" "}
              <strong>{userToDelete.email}</strong>?
            </span>
          }
        />
      )}

      <Toaster />
    </>
  );
}
