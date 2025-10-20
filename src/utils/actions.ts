"use server";

import { createClient, createServiceClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserProfile {
  id: string;
  role: string;
  email: string;
}

interface Profile {
  id: string;
  role: string;
  email?: string | null;
}

interface AuthUser {
  id: string;
  email?: string | null;
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
 * Creates a new user (admin or user). Only super_admin can do this.
 */
export async function createUser(email: string, password: string, role: string = "user") {
  const { user } = await verifySuperAdmin(); // Ensure only super admins can do this
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

  // 2. Create a profile entry
  const { error: profileError } = await supabase
    .from("profiles")
    .insert([{ id: createdUser.user.id, email, role }]);

  if (profileError) {
    console.error("Error creating profile:", profileError);
    return { success: false, message: profileError.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: `${role} account created successfully!` };
}
