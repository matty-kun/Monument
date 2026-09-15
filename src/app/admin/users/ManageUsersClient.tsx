"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { UserProfile } from "../../../utils/actions";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Loading from "@/components/loading";
import ConfirmModal from "@/components/ConfirmModal";
import { FaEye, FaEyeSlash, FaSearch, FaUserPlus, FaTrash, FaLock } from "react-icons/fa";
import { useUsersViewModel } from "@/features/admin/users/viewModels/useUsersViewModel";

interface ManageUsersClientProps {
  initialUsers: UserProfile[];
  currentUserId?: string | null;
}

export default function ManageUsersClient({
  initialUsers,
  currentUserId,
}: ManageUsersClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    isLoading,
    showConfirmModal,
    setShowConfirmModal,
    userToDelete,
    newEmail,
    setNewEmail,
    newPassword,
    setNewPassword,
    newRole,
    setNewRole,
    showNewPassword,
    setShowNewPassword,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    handleRoleChange,
    handleCreateUser,
    handleDeleteClick,
    handleConfirmDelete,
  } = useUsersViewModel({ initialUsers, currentUserId });

  if (isLoading) return <Loading />;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* RIGHT COLUMN: User List */}
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
           <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" />
              <input type="text" placeholder="Search users by email or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-transparent focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 rounded-[16px] text-[13px] font-medium transition-all outline-none shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500" />
           </div>
           <button
             type="button"
             onClick={() => setShowCreateModal(true)}
             className="flex shrink-0 items-center gap-2 rounded-lg bg-[#269a7a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b7359] active:scale-95"
           >
             <FaUserPlus size={13} /> Add user
           </button>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden transition-all flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px] table-auto">
              <thead className="bg-gray-50 dark:bg-[#1c1c1e]/90 border-b border-gray-200 dark:border-white/5 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-8 py-5 text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">User Identity</th>
                  <th className="px-8 py-5 text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">Permissions</th>
                  <th className="px-8 py-5 text-right text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={3} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No users found</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-gray-900 dark:text-white tracking-tight">{user.email}</span>
                        {user.id === currentUserId && <span className="inline-flex w-fit mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-monument-primary text-white uppercase tracking-widest">Current Session</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <SingleSelectDropdown
                        selectedValue={user.role}
                        onChange={(newRole) => handleRoleChange(user.id, newRole)}
                        options={[
                          { id: "admin", name: "Admin", icon: "🛡️" },
                          { id: "super_admin", name: "Super Admin", icon: "👑" },
                          { id: "scorer", name: "Scorer", icon: "📝" },
                        ]}
                        disabled={user.id === currentUserId}
                      />
                    </td>
                    <td className="px-8 py-5 text-right">
                      {user.id !== currentUserId ? (
                        <button onClick={() => handleDeleteClick(user)} className="p-2 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-xl transition-all"><FaTrash size={14} /></button>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/45">
                          <FaLock size={11} /> Protected
                        </span>
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
          confirmLabel="Delete"
          variant="destructive"
        />
      )}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Close create user form"
              onClick={() => setShowCreateModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-md overflow-visible rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#181818]"
            >
              <div className="border-b border-gray-200 px-5 py-4 dark:border-white/10">
                <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">Create account</h2>
                <p className="mt-1 text-[13px] text-gray-500 dark:text-white/45">Add an admin, scorer, or super admin account.</p>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-5 p-5">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-white/70">Email address</label>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[14px] font-medium text-gray-950 outline-none transition focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/15 dark:border-white/10 dark:bg-[#111] dark:text-white dark:focus:border-[#33d6a6]" placeholder="name@example.com" required />
                </div>

                <div className="relative">
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-white/70">Password</label>
                  <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-11 text-[14px] font-medium text-gray-950 outline-none transition focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/15 dark:border-white/10 dark:bg-[#111] dark:text-white dark:focus:border-[#33d6a6]" placeholder="Password" required />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-[36px] text-gray-400 transition-colors hover:text-[#008060] dark:hover:text-[#33d6a6]">
                    {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-white/70">Role</label>
                  <SingleSelectDropdown 
                     selectedValue={newRole} 
                     onChange={setNewRole} 
                     options={[
                       { id: "admin", name: "Admin", icon: "🛡️" },
                       { id: "super_admin", name: "Super Admin", icon: "👑" },
                       { id: "scorer", name: "Scorer", icon: "📝" },
                     ]} 
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-white/10">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10">Cancel</button>
                  <button type="submit" className="rounded-lg bg-[#269a7a] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1b7359] active:scale-[0.99]">
                    Create account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toaster />
    </div>
  );
}
