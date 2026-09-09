"use server";

import { createServiceClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { canVoteForDepartment, hasValidPredictionIds } from "./predictionPolicy";

export async function votePrediction(scheduleId: string, departmentId: string) {
  if (!hasValidPredictionIds(scheduleId, departmentId)) {
    return { success: false, error: "Invalid match or team." };
  }

  const supabase = createServiceClient();
  
  // Get IP address from headers
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  
  // Fallback IP for local dev if headers are missing
  const ip = forwardedFor?.split(",")[0] || realIp || "127.0.0.1";
  
  const hashSecret = process.env.PREDICTION_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hashSecret) {
    console.error("Prediction hashing secret is not configured.");
    return { success: false, error: "Predictions are temporarily unavailable." };
  }

  const ipHash = crypto.createHmac("sha256", hashSecret).update(ip).digest("hex");

  try {
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("tournament_id, status, departments")
      .eq("id", scheduleId)
      .single();

    if (scheduleError || !schedule) {
      return { success: false, error: "Match not found." };
    }

    const { data: department, error: departmentError } = await supabase
      .from("tournament_departments")
      .select("department_id, name")
      .eq("tournament_id", schedule.tournament_id)
      .eq("department_id", departmentId)
      .single();

    if (departmentError || !department || !canVoteForDepartment(schedule, department)) {
      return { success: false, error: "Voting is not available for this team." };
    }

    // Check existing vote
    const { data: existing, error: fetchError } = await supabase
      .from("match_predictions")
      .select("department_id")
      .eq("schedule_id", scheduleId)
      .eq("ip_hash", ipHash)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let action = "added";

    if (existing) {
      if (existing.department_id === departmentId) {
        // Toggle off
        const { error } = await supabase.from("match_predictions").delete().eq("schedule_id", scheduleId).eq("ip_hash", ipHash);
        if (error) throw error;
        action = "removed";
      } else {
        // Change vote
        const { error } = await supabase.from("match_predictions").update({ department_id: departmentId }).eq("schedule_id", scheduleId).eq("ip_hash", ipHash);
        if (error) throw error;
        action = "changed";
      }
    } else {
      // Insert new
      const { error } = await supabase.from("match_predictions").insert({
        schedule_id: scheduleId,
        department_id: departmentId,
        ip_hash: ipHash
      });
      if (error) throw error;
    }

    // Return fresh counts
    const { data } = await supabase.from('match_predictions').select('department_id').eq('schedule_id', scheduleId);
    const counts: Record<string, number> = {};
    if (data) {
      data.forEach((d: any) => {
        counts[d.department_id] = (counts[d.department_id] || 0) + 1;
      });
    }

    return { success: true, action, counts, userVote: action === "removed" ? null : departmentId };
  } catch (error) {
    console.error("Error updating prediction:", error);
    return { success: false, error: "Failed to submit vote." };
  }
}
