"use server";

import { createClient, createServiceClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserProfile {
  id: string;
  role: string;
  email: string;
}

/**
 * Safely verifies if the logged-in user is a super admin.
 */
export async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { authorized: false, reason: "not_authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "super_admin") {
    return { authorized: false, reason: "not_super_admin" };
  }

  return { authorized: true, supabase, user };
}

/**
 * Fetches all users.
 */
export async function getUsers(): Promise<UserProfile[]> {
  const { authorized, user: currentUser } = await verifySuperAdmin();
  if (!authorized || !currentUser) return [];

  const adminSupabase = createServiceClient();

  const { data: authUsers, error: authError } =
    await adminSupabase.auth.admin.listUsers();
  if (authError) return [];

  const { data: profiles, error: profilesError } = await adminSupabase
    .from("profiles")
    .select("id, role");
  if (profilesError) return [];

  const profileMap = new Map(profiles.map((p) => [p.id, p.role]));

  return authUsers.users
    .filter((user) => user.id !== currentUser.id)
    .map((user) => ({
      id: user.id,
      email: user.email || "N/A",
      role: profileMap.get(user.id) || "user",
    }));
}

/**
 * Updates a user's role.
 */
export async function updateUserRole(userId: string, newRole: string) {
  const { authorized, user: currentUser } = await verifySuperAdmin();
  if (!authorized || !currentUser)
    return { success: false, message: "Access denied." };

  if (userId === currentUser.id) {
    return { success: false, message: "You cannot change your own role." };
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "Role updated successfully!" };
}
