"use client";

import { useState, useMemo } from "react";
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
import { FaEye, FaEyeSlash, FaSearch, FaUserPlus, FaTrash, FaShieldAlt } from "react-icons/fa";

interface ManageUsersClientProps {
  initialUsers: UserProfile[];
  currentUserId?: string | null;
}

export default function ManageUsersClient({
  initialUsers,
  currentUserId,
}: ManageUsersClientProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers || []);
  const [isLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const capitalizeWords = (str: string): string =>
    str.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const original = [...users];
    setUsers(u => u.map(user => (user.id === userId ? { ...user, role: newRole } : user)));
    const toastId = toast.loading("Updating role...");
    const result = await updateUserRole(userId, newRole);
    if (result.success) toast.success(result.message, { id: toastId });
    else { toast.error(`Failed: ${result.message}`, { id: toastId }); setUsers(original); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    const toastId = toast.loading("Creating user account...");
    const result = await createUser(newEmail, newPassword, newRole);
    if (result.success && result.user) {
      toast.success(result.message, { id: toastId });
      setUsers(prev => [result.user!, ...prev]);
      setNewEmail(""); setNewPassword("");
    } else toast.error(`Failed: ${result.message}`, { id: toastId });
  };

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const toastId = toast.loading(`Deleting account...`);
    const result = await deleteUser(userToDelete.id);
    if (result.success) {
      toast.success(result.message, { id: toastId });
      setUsers(u => u.filter(user => user.id !== userToDelete.id));
    } else toast.error(`Failed: ${result.message}`, { id: toastId });
    setShowConfirmModal(false); setUserToDelete(null);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><BouncingBallsLoader /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full h-full min-h-0">
      {/* LEFT COLUMN: Create User */}
      <div className="lg:col-span-4 space-y-8 h-full md:overflow-y-auto pr-1 custom-scrollbar pb-10 md:pb-0">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-100">Create New Account</h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-4 py-4 text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-monument-primary transition-all" placeholder="name@example.com" required />
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Access Password</label>
                <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl pl-4 pr-12 py-4 text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-monument-primary transition-all" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-[38px] text-gray-400 hover:text-monument-primary transition-colors">
                  {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">System Role</label>
                <SingleSelectDropdown 
                   selectedValue={newRole} 
                   onChange={setNewRole} 
                   options={[
                     { id: "admin", name: "Admin", icon: "🛡️" },
                     { id: "super_admin", name: "Super Admin", icon: "👑" },
                   ]} 
                />
              </div>

              <button type="submit" className="w-full bg-monument-primary hover:bg-monument-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95">
                CREATE ACCOUNT
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: User List */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm gap-4 mb-6">
           <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search users by email or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium" />
           </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1 overflow-y-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700">
              <thead className="bg-gray-50/80 dark:bg-gray-900/40 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Identity</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Permissions</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={3} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No users found</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight">{user.email}</span>
                        {user.id === currentUserId && <span className="inline-flex w-fit mt-1 px-2 py-0.5 rounded-md text-[8px] font-black bg-monument-primary text-white uppercase tracking-tighter">Current Session</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
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
                    <td className="px-8 py-5 text-right">
                      {user.id !== currentUserId && (
                        <button onClick={() => handleDeleteClick(user)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><FaTrash /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {userToDelete && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Account"
          message={<span>Are you sure you want to permanently delete <strong>{userToDelete.email}</strong>?</span>}
        />
      )}
      <Toaster />
    </div>
  );
}
