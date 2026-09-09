"use server";

import { createReadOnlyClient } from "@/utils/supabase/server";
import { AuthorizationError, requireAdmin } from "@/utils/supabase/authorization";
import { revalidatePath } from "next/cache";

export async function toggleMysteryMode(
  tournamentId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("tournaments")
      .update({ mystery_mode: enabled })
      .eq("id", tournamentId)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error toggling tournament mystery mode:", error);
      return { success: false, error: "Mystery mode could not be updated." };
    }
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    console.error("Unexpected mystery mode error:", error);
    return { success: false, error: "Mystery mode could not be updated." };
  }

  revalidatePath("/");
  revalidatePath("/results");
  revalidatePath("/schedule");
  return { success: true };
}

export async function getMysteryMode(tournamentId?: string): Promise<boolean> {
  try {
    const supabase = await createReadOnlyClient();
    let query = supabase
      .from("tournaments")
      .select("mystery_mode");

    query = tournamentId
      ? query.eq("id", tournamentId)
      : query.eq("is_active", true);

    const { data, error } = await query
      .single();

    if (error || !data) return false;
    return data.mystery_mode === true;
  } catch (err) {
    console.error("Critical error in getMysteryMode:", err);
    return false;
  }
}
