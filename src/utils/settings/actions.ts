"use server";

import { createClient, createReadOnlyClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Toggles the global mystery_mode setting in app_settings.
 * Uses the normal user client (which uses the ANON_KEY and respects RLS).
 * Requires the user to be an authenticated admin as per the SQL policy.
 */
export async function toggleMysteryMode(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient(); // Use regular client with user session

  const { error } = await supabase
    .from("app_settings")
    .upsert(
      { key: "mystery_mode", value: enabled ? "true" : "false" },
      { onConflict: "key" }
    );

  if (error) {
    console.error("Error toggling mystery_mode:", error);
    return { success: false, error: error.message };
  }

  // Revalidate everything so all public pages pick up the change
  revalidatePath("/");
  revalidatePath("/results");
  revalidatePath("/schedule");
  return { success: true };
}

/**
 * Reads the current mystery_mode setting.
 * Uses the read-only client (ANON_KEY). Returns false if not found.
 */
export async function getMysteryMode(): Promise<boolean> {
  try {
    const supabase = await createReadOnlyClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "mystery_mode")
      .single();

    if (error || !data) return false;
    return data.value === "true";
  } catch (err) {
    console.error("Critical error in getMysteryMode:", err);
    return false;
  }
}

