"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { UserProfile } from "../../../utils/actions";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import ConfirmModal from "@/components/ConfirmModal";
import { FiShield, FiUser } from "react-icons/fi";
import { FaEye, FaEyeSlash, FaSearch, FaUserPlus, FaTrash, FaShieldAlt } from "react-icons/fa";
import { useUsersViewModel } from "@/features/admin/users/viewModels/useUsersViewModel";

interface ManageUsersClientProps {
  initialUsers: UserProfile[];
  currentUserId?: string | null;
}

export default function ManageUsersClient({
  initialUsers,
  currentUserId,
}: ManageUsersClientProps) {
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

  if (isLoading) return <div className="flex justify-center items-center h-64"><BouncingBallsLoader /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full h-full min-h-0">
      {/* LEFT COLUMN: Create User */}
      <div className="lg:col-span-4 space-y-8 h-full md:overflow-y-auto pr-1 custom-scrollbar pb-10 md:pb-0">
        <div className="bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white/5 overflow-visible transition-all flex flex-col">
          <div className="p-6 border-b border-white/5 bg-[#1c1c1e] shrink-0 z-10 rounded-t-[24px]">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-white/40">Create New Account</h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 dark:text-gray-500">Email Address</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full bg-white/5 text-white border border-white/5 rounded-2xl px-4 py-4 text-sm font-bold placeholder:text-gray-500 focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent transition-all outline-none" placeholder="name@example.com" required />
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 dark:text-gray-500">Access Password</label>
                <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-white/5 text-white border border-white/5 rounded-2xl pl-4 pr-12 py-4 text-sm font-bold placeholder:text-gray-500 focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent transition-all outline-none" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-[38px] text-gray-400 hover:text-[#0A84FF] transition-colors">
                  {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 dark:text-gray-500">System Role</label>
                <SingleSelectDropdown 
                   selectedValue={newRole} 
                   onChange={setNewRole} 
                   options={[
                     { id: "admin", name: "Admin", icon: "🛡️" },
                     { id: "super_admin", name: "Super Admin", icon: "👑" },
                   ]} 
                />
              </div>

              <button type="submit" className="w-full bg-[#0A84FF] hover:bg-[#0070e0] text-white font-bold py-4 rounded-[20px] transition-all shadow-lg text-[13px] tracking-wide active:scale-95 flex items-center justify-center">
                CREATE ACCOUNT
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: User List */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1c1c1e] p-2 rounded-[24px] border border-white/5 shadow-sm gap-4 mb-6">
           <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search users by email or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 text-white border-none rounded-[16px] pl-12 pr-4 py-3 text-sm font-medium outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-gray-500" />
           </div>
        </div>

        <div className="bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white/5 overflow-hidden transition-all flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px] table-auto">
              <thead className="bg-[#1c1c1e]/90 border-b border-white/5 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-8 py-5 text-[12px] font-bold uppercase tracking-widest text-white/40">User Identity</th>
                  <th className="px-8 py-5 text-[12px] font-bold uppercase tracking-widest text-white/40">Permissions</th>
                  <th className="px-8 py-5 text-right text-[12px] font-bold uppercase tracking-widest text-white/40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={3} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No users found</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-white tracking-tight">{user.email}</span>
                        {user.id === currentUserId && <span className="inline-flex w-fit mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#0A84FF] text-white uppercase tracking-widest">Current Session</span>}
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
                        <button onClick={() => handleDeleteClick(user)} className="p-2 text-white/40 hover:text-[#FF453A] hover:bg-white/5 rounded-xl transition-all"><FaTrash size={14} /></button>
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
