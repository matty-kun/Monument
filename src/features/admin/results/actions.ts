"use server";

import { AuthorizationError, requireAdminOrScorer } from "@/utils/supabase/authorization";
import { type ReplaceEventResultsInput, validateResultReplacement } from "./resultPolicy";

export async function replaceEventResultsAction(input: ReplaceEventResultsInput) {
  try {
    const { supabase } = await requireAdminOrScorer();

    const validationError = validateResultReplacement(input);
    if (validationError) return { success: false as const, error: validationError };

    const { error } = await supabase.rpc("replace_event_results", {
      p_event_id: input.eventId,
      p_tournament_id: input.tournamentId,
      p_results: input.assignments.map((assignment) => ({
        department_id: assignment.departmentId,
        medal_type: assignment.medalType,
      })),
    });

    if (error) {
      console.error("Result replacement failed:", error);
      return { success: false as const, error: "The results could not be saved." };
    }

    return { success: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { success: false as const, error: error.message };
    }

    console.error("Result action failed:", error);
    return { success: false as const, error: "The results could not be saved." };
  }
}
