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

const demoEventNames = ["Basketball Finals", "Video Recap", "Quiz Bowl", "Mobile Legends Showmatch"];
const demoTeamNames = ["Blue Ethereum", "Red Satoshi", "Silver Ripple", "Green Solana"];

const { data: tournaments, error } = await supabase.from("tournaments").select("id, name, slug").order("name");
if (error) throw error;

for (const tournament of tournaments || []) {
  const [schedules, events, teams, results] = await Promise.all([
    supabase
      .from("schedules")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournament.id)
      .eq("context", "Demo seed"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournament.id)
      .in("name", demoEventNames),
    supabase
      .from("tournament_departments")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournament.id)
      .in("name", demoTeamNames),
    supabase
      .from("results")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournament.id)
      .in(
        "event_id",
        (
          await supabase
            .from("events")
            .select("id")
            .eq("tournament_id", tournament.id)
            .in("name", demoEventNames)
        ).data?.map((event) => event.id) || [],
      ),
  ]);

  console.log(
    `${tournament.name} (${tournament.slug}) -> schedules:${schedules.count || 0} events:${events.count || 0} teams:${teams.count || 0} results:${results.count || 0}`,
  );
}
