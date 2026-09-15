import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    process.env[key.trim()] ||= value;
  }
}

async function run(request, label) {
  const { data, error, count } = await request;
  if (error) throw new Error(`${label}: ${error.message}`);
  return { data, count };
}

function fail(error) {
  console.error(error?.message || error);
  process.exit(1);
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const demoEventNames = ["Basketball Finals", "Video Recap", "Quiz Bowl", "Mobile Legends Showmatch"];
const demoTeamNames = ["Blue Ethereum", "Red Satoshi", "Silver Ripple", "Green Solana"];

try {
  const { data: tournament } = await run(
    supabase.from("tournaments").select("id, name").eq("slug", "cite-fest-2026").maybeSingle(),
    "Find CITE FEST 2026",
  );

  if (!tournament) {
    console.log("CITE FEST 2026 was not found. Nothing to clean.");
    process.exit(0);
  }

  const { data: demoEvents } = await run(
    supabase
      .from("events")
      .select("id")
      .eq("tournament_id", tournament.id)
      .in("name", demoEventNames),
    "Find CITE FEST demo events",
  );
  const demoEventIds = (demoEvents || []).map((event) => event.id);

  const scheduleResult = await run(
    supabase
      .from("schedules")
      .delete({ count: "exact" })
      .eq("tournament_id", tournament.id)
      .eq("context", "Demo seed"),
    "Delete CITE FEST demo schedules",
  );

  let resultCount = 0;
  if (demoEventIds.length > 0) {
    const resultsResult = await run(
      supabase
        .from("results")
        .delete({ count: "exact" })
        .eq("tournament_id", tournament.id)
        .in("event_id", demoEventIds)
        .eq("assigned_by_email", "demo-seed@monument.local"),
      "Delete CITE FEST demo results",
    );
    resultCount = resultsResult.count || 0;
  }

  let eventCount = 0;
  if (demoEventIds.length > 0) {
    const eventsResult = await run(
      supabase
        .from("events")
        .delete({ count: "exact" })
        .eq("tournament_id", tournament.id)
        .in("id", demoEventIds),
      "Delete CITE FEST demo events",
    );
    eventCount = eventsResult.count || 0;
  }

  const teamResult = await run(
    supabase
      .from("tournament_departments")
      .delete({ count: "exact" })
      .eq("tournament_id", tournament.id)
      .in("name", demoTeamNames),
    "Delete CITE FEST demo team snapshots",
  );

  console.log(`Cleaned demo data from ${tournament.name}.`);
  console.log(`Schedules removed: ${scheduleResult.count || 0}`);
  console.log(`Results removed: ${resultCount}`);
  console.log(`Events removed: ${eventCount}`);
  console.log(`Team snapshots removed: ${teamResult.count || 0}`);
  console.log("TEST tournament demo data was left untouched.");
} catch (error) {
  fail(error);
}
