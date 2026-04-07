"use server";

import { createServiceClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Toggles the global mystery_mode setting in app_settings.
 * Uses an upsert so the row is created on first use.
 */
export async function toggleMysteryMode(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

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

  // Revalidate the public leaderboard so the next SSR pick picks it up too
  revalidatePath("/");
  return { success: true };
}

/**
 * Reads the current mystery_mode setting.
 * Returns false if the setting doesn't exist yet.
 */
export async function getMysteryMode(): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "mystery_mode")
    .single();

  if (error || !data) return false;
  return data.value === "true";
}
