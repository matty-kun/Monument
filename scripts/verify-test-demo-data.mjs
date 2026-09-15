import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
  const [key, ...valueParts] = trimmed.split("=");
  process.env[key.trim()] ||= valueParts.join("=").trim().replace(/^["']|["']$/g, "");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: tournament, error } = await supabase
  .from("tournaments")
  .select("id, name")
  .ilike("name", "TEST")
  .limit(1)
  .maybeSingle();

if (error) throw error;
if (!tournament) {
  console.log("TEST not found.");
  process.exit(0);
}

const [teams, events, schedules, results] = await Promise.all([
  supabase.from("tournament_departments").select("id", { count: "exact", head: true }).eq("tournament_id", tournament.id),
  supabase.from("events").select("id", { count: "exact", head: true }).eq("tournament_id", tournament.id),
  supabase.from("schedules").select("id", { count: "exact", head: true }).eq("tournament_id", tournament.id),
  supabase.from("results").select("id", { count: "exact", head: true }).eq("tournament_id", tournament.id),
]);

console.log(`${tournament.name}: teams ${teams.count}, events ${events.count}, schedules ${schedules.count}, results ${results.count}`);
