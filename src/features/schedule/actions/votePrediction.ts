"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";

export async function votePrediction(scheduleId: string, departmentId: string) {
  const supabase = createClient();
  
  // Get IP address from headers
  const headersList = headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  
  // Fallback IP for local dev if headers are missing
  const ip = forwardedFor?.split(",")[0] || realIp || "127.0.0.1";
  
  // Hash the IP to maintain privacy
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

  // Insert the vote
  const { error } = await supabase
    .from("match_predictions")
    .insert({
      schedule_id: scheduleId,
      department_id: departmentId,
      ip_hash: ipHash
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: "You have already voted on this match." };
    }
    console.error("Error inserting prediction:", error);
    return { success: false, error: "Failed to submit vote." };
  }

  return { success: true };
}
