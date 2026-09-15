import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
for (const line of env.split(/\r?\n/)) {
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

const { data: tournament, error: tournamentError } = await supabase
  .from("tournaments")
  .select("id, name, slug")
  .eq("slug", "cite-fest-2026")
  .single();

if (tournamentError) throw tournamentError;

const [schedules, results, teams] = await Promise.all([
  supabase.from("schedules").select("id", { count: "exact", head: true }).eq("tournament_id", tournament.id),
  supabase.from("results").select("id", { count: "exact", head: true }).eq("tournament_id", tournament.id),
  supabase.from("tournament_departments").select("id", { count: "exact", head: true }).eq("tournament_id", tournament.id),
]);

console.log(`${tournament.name}: schedules:${schedules.count || 0} results:${results.count || 0} teams:${teams.count || 0}`);
