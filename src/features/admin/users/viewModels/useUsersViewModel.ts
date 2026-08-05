import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  updateUserRole,
  deleteUser,
  createUser,
  UserProfile,
} from "@/utils/actions";

interface UseUsersViewModelProps {
  initialUsers: UserProfile[];
  currentUserId?: string | null;
}

export const useUsersViewModel = ({ initialUsers, currentUserId }: UseUsersViewModelProps) => {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers || []);
  const [isLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  return {
    users,
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
  };
};
