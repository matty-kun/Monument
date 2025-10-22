"use server";

import { createClient, createServiceClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserProfile {
  id: string;
  role: string;
  email: string;
}

/**
 * Verifies that the currently logged-in user is a super admin.
 */
async function verifySuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "super_admin") {
    throw new Error("Access Denied: You are not a super administrator.");
  }

  return { supabase, user };
}

/**
 * Fetches all users by combining auth.users and profiles.
 * Requires a valid super_admin session.
 */
export async function getUsers(): Promise<{ users: UserProfile[]; currentUserId: string }> {
  const { user } = await verifySuperAdmin();

  // Use the service role client for admin-level operations
  const adminSupabase = createServiceClient();

  // 1. Get all auth users (requires service role key)
  const { data: authUsers, error: authError } =
    await adminSupabase.auth.admin.listUsers();

  if (authError) {
    console.error("Error fetching auth users:", authError);
    return { users: [], currentUserId: user.id };
  }

  // 2. Get all profiles (role info)
  const { data: profiles, error: profilesError } = await adminSupabase
    .from("profiles")
    .select("id, role, email");

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return { users: [], currentUserId: user.id };
  }

  // 3. Create a lookup for profile roles
  const profileMap = new Map(profiles.map((p) => [p.id, p.role]));

  // 4. Merge auth users with profile roles
  const mergedUsers = authUsers.users.map((u) => ({
    id: u.id,
    email: u.email || "N/A",
    role: profileMap.get(u.id) || "user", // Default role
  }));

  return { users: mergedUsers, currentUserId: user.id };
}

/**
 * Updates a user's role in the profiles table.
 */
export async function updateUserRole(userId: string, newRole: string) {
  await verifySuperAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/users"); // Refresh the users page
  return { success: true, message: "Role updated successfully!" };
}

/**
 * Deletes a user from Supabase Auth.
 * Requires a valid super_admin session.
 */
export async function deleteUser(userId: string) {
  const { user: currentAdminUser } = await verifySuperAdmin();

  // Prevent a user from deleting their own account
  if (currentAdminUser.id === userId) {
    return { success: false, message: "You cannot delete your own account." };
  }

  // Use the service role client to delete the user from Supabase Auth
  const adminSupabase = createServiceClient();
  const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

  if (deleteError) {
    // The profile will cascade delete, but if it fails, we should log it.
    // The most common error is if the user doesn't exist.
    console.error("Error deleting user from auth:", deleteError.message);

    // Also attempt to delete the profile as a fallback.
    const { error: profileDeleteError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error("Error deleting user profile as fallback:", profileDeleteError.message);
      return { success: false, message: `Primary error: ${deleteError.message}. Fallback error: ${profileDeleteError.message}` };
    }

    // If only the auth deletion failed but profile deletion succeeded, it might be a partial success.
    return { success: false, message: deleteError.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "User deleted successfully." };
}


/**
 * Creates a new user (admin or user). Only super_admin can do this.
 */
export async function createUser(email: string, password: string, role: string = "user") {
  await verifySuperAdmin(); // Ensure only super admins can do this
  const supabase = createServiceClient();

  // 1. Create the user in Supabase Auth
  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip confirmation for admin-created accounts
  });

  if (createError || !createdUser.user) {
    console.error("Error creating user:", createError);
    return { success: false, message: createError?.message || "Failed to create user" };
  }

  // 2. The user's profile is created by a trigger. Update it with the specified role.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role, email }) // Also update the email field
    .eq("id", createdUser.user.id);

  if (profileError) {
    console.error("Error updating profile for new user:", profileError);
    return { success: false, message: `User created, but failed to set role: ${profileError.message}` };
  }

  revalidatePath("/admin/users");
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
  return { 
    success: true, 
    message: `${capitalizedRole} account created successfully!`,
    user: { id: createdUser.user.id, email, role } as UserProfile
  };
}
