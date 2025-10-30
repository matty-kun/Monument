"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  getUsers,
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

export default function ManageUsersClient() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // For new user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { users: fetchedUsers, currentUserId } = await getUsers();

      const filteredUsers = fetchedUsers.filter(
        (user) =>
          user.id !== currentUserId &&
          (user.role === "admin" || user.role === "super_admin")
      );

      const roleOrder: Record<"super_admin" | "admin", number> = {
        super_admin: 0,
        admin: 1,
      };

      filteredUsers.sort((a, b) => {
        const aRole = (a.role as keyof typeof roleOrder) || "admin";
        const bRole = (b.role as keyof typeof roleOrder) || "admin";
        return roleOrder[aRole] - roleOrder[bRole];
      });

      setUsers(filteredUsers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
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
      // Re-sort the list to reflect the new role order
      setUsers((currentUsers) =>
        [...currentUsers].sort((a, b) => {
          const roleOrder: Record<string, number> = {
            super_admin: 0,
            admin: 1,
          };
          const aRole = roleOrder[a.role] ?? 2;
          const bRole = roleOrder[b.role] ?? 2;
          return aRole - bRole;
        })
      );
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
      if (result.user) {
        setUsers((prevUsers) =>
          [result.user!, ...prevUsers].sort((a, b) => {
            const roleOrder: Record<string, number> = {
              super_admin: 0,
              admin: 1,
            };
            const aRole = roleOrder[a.role] ?? 2;
            const bRole = roleOrder[b.role] ?? 2;
            return aRole - bRole;
          })
        );
      }
      setNewEmail("");
      setNewPassword("");
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
    }
  };

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const toastId = toast.loading(`Deleting user ${userToDelete.email}...`);
    const result = await deleteUser(userToDelete.id);

    if (result.success) {
      toast.success(result.message, { id: toastId });
      setUsers(users.filter((u) => u.id !== userToDelete.id));
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
    }

    setShowConfirmModal(false);
    setUserToDelete(null);
  };

  const capitalizeWords = (str: string): string => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return users;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(lowercasedQuery) ||
        user.role.toLowerCase().includes(lowercasedQuery)
    );
  }, [users, searchQuery]);

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

      {/* Search and View Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-1/2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input type="text" placeholder="Search by email or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10 w-full" />
        </div>
        <div className="inline-flex rounded-md shadow-sm bg-white dark:bg-gray-800 self-end">
          <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm font-medium rounded-l-lg flex items-center gap-2 ${viewMode === 'table' ? 'bg-monument-green text-white dark:bg-green-600' : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <FaTable /> Table
          </button>
          <button onClick={() => setViewMode('card')} className={`px-3 py-2 text-sm font-medium rounded-r-lg flex items-center gap-2 ${viewMode === 'card' ? 'bg-monument-green text-white dark:bg-green-600' : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <FaThLarge /> Cards
          </button>
        </div>
      </div>

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
                <thead className="bg-gradient-to-r from-monument-green to-green-600 dark:from-green-700 dark:to-green-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase dark:text-white tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Current Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Change Role</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${user.role === "super_admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : user.role === "admin" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                          {user.role === "super_admin" ? <FiShield /> : <FiUser />}
                          {capitalizeWords(user.role.replace("_", " "))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SingleSelectDropdown selectedValue={user.role} onChange={(newRole) => handleRoleChange(user.id, newRole)} options={[{ id: "admin", name: "Admin", icon: "🛡️" }, { id: "super_admin", name: "Super Admin", icon: "👑" }]} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button onClick={() => handleDeleteClick(user)} className="btn-danger py-1 px-3 text-sm rounded inline-flex items-center gap-1">🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (<tr><td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">{searchQuery ? "No users match your search." : "No users found."}</td></tr>)}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="p-0 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md text-2xl">
                      {user.role === "super_admin" ? (
                        <FiShield className="text-purple-500" />
                      ) : (
                        <FiUser className="text-blue-500" />
                      )}
                    </div>
                    <div className="truncate">
                      <h3
                        className="font-bold text-base text-gray-800 dark:text-gray-100 truncate"
                        title={user.email}
                      >
                        {user.email}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "super_admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {capitalizeWords(user.role.replace("_", " "))}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Change Role
                    </label>
                    <SingleSelectDropdown
                      selectedValue={user.role}
                      onChange={(newRole) => handleRoleChange(user.id, newRole)}
                      options={[
                        { id: "admin", name: "Admin", icon: "🛡️" },
                        { id: "super_admin", name: "Super Admin", icon: "👑" },
                      ]}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-2 flex justify-end rounded-b-lg">
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="btn-danger py-1 px-2 text-xs rounded inline-flex items-center gap-1"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </Card>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">{searchQuery ? "No Users Match Your Search" : "No Users Found"}</h3>
                <p className="text-gray-500 dark:text-gray-400">{searchQuery ? "Try a different search term." : "Create a new user using the form above."}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {userToDelete && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm User Deletion"
          message={
            <span>
              Are you sure you want to permanently delete the user{" "}
              <strong className="text-red-500">{userToDelete.email}</strong>?
              This action cannot be undone.
            </span>
          }
        />
      )}

      <Toaster />
    </>
  );
}
