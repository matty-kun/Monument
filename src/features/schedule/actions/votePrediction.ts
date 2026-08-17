"use server";

import { createServiceClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";

export async function votePrediction(scheduleId: string, departmentId: string) {
  const supabase = createServiceClient();
  
  // Get IP address from headers
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  
  // Fallback IP for local dev if headers are missing
  const ip = forwardedFor?.split(",")[0] || realIp || "127.0.0.1";
  
  // Hash the IP to maintain privacy
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

  try {
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
