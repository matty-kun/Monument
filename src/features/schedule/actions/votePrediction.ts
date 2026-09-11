"use server";

import { createServiceClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { canVoteForDepartment, hasValidPredictionIds } from "./predictionPolicy";

const VOTER_COOKIE = "monument_prediction_voter";

export async function votePrediction(scheduleId: string, departmentId: string) {
  if (!hasValidPredictionIds(scheduleId, departmentId)) {
    return { success: false, error: "Invalid match or team." };
  }

  const supabase = createServiceClient();
  const cookieStore = await cookies();
  let voterId = cookieStore.get(VOTER_COOKIE)?.value;

  if (!voterId || !hasValidPredictionIds(voterId, departmentId)) {
    voterId = crypto.randomUUID();
    cookieStore.set(VOTER_COOKIE, voterId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  
  const hashSecret = process.env.PREDICTION_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hashSecret) {
    console.error("Prediction hashing secret is not configured.");
    return { success: false, error: "Predictions are temporarily unavailable." };
  }

  const voterHash = crypto.createHmac("sha256", hashSecret).update(voterId).digest("hex");

  try {
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("tournament_id, status, departments, date, end_date, end_time")
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
      .eq("ip_hash", voterHash)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { data, error: countError } = await supabase
        .from("match_predictions")
        .select("department_id")
        .eq("schedule_id", scheduleId);
      if (countError) throw countError;

      const counts: Record<string, number> = {};
      data?.forEach((prediction: { department_id: string }) => {
        counts[prediction.department_id] = (counts[prediction.department_id] || 0) + 1;
      });

      return { success: true, action: "unchanged", counts, userVote: existing.department_id };
    } else {
      const { error } = await supabase.from("match_predictions").insert({
        schedule_id: scheduleId,
        department_id: departmentId,
        ip_hash: voterHash
      });
      if (error) throw error;
    }

    // Return fresh counts
    const { data, error: countError } = await supabase.from('match_predictions').select('department_id').eq('schedule_id', scheduleId);
    if (countError) throw countError;
    const counts: Record<string, number> = {};
    if (data) {
      data.forEach((d: any) => {
        counts[d.department_id] = (counts[d.department_id] || 0) + 1;
      });
    }

    return { success: true, action: "added", counts, userVote: departmentId };
  } catch (error) {
    console.error("Error updating prediction:", error);
    return { success: false, error: "Failed to submit vote." };
  }
}
