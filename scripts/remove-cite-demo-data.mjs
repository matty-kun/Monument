import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    process.env[key.trim()] ||= valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

async function run(label, request) {
  const { data, error, count } = await request;
  if (error) throw new Error(`${label}: ${error.message}`);
  return { data, count };
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const demoEventNames = [
  "Basketball Finals",
  "Video Recap",
  "Quiz Bowl",
  "Mobile Legends Showmatch",
];

const demoTeamNames = [
  "Blue Ethereum",
  "Red Satoshi",
  "Silver Ripple",
  "Green Solana",
];

const { data: tournament } = await run(
  "Find CITE FEST 2026",
  supabase.from("tournaments").select("id, name").eq("slug", "cite-fest-2026").maybeSingle(),
);

if (!tournament) {
  console.log("CITE FEST 2026 was not found. Nothing to remove.");
  process.exit(0);
}

const { data: events } = await run(
  "Find demo events",
  supabase.from("events").select("id").eq("tournament_id", tournament.id).in("name", demoEventNames),
);

const eventIds = (events || []).map((event) => event.id);

if (eventIds.length > 0) {
  await run(
    "Remove demo results",
    supabase.from("results").delete().eq("tournament_id", tournament.id).in("event_id", eventIds),
  );
}

await run(
  "Remove demo schedules",
  supabase.from("schedules").delete().eq("tournament_id", tournament.id).eq("context", "Demo seed"),
);

if (eventIds.length > 0) {
  await run(
    "Remove demo events",
    supabase.from("events").delete().eq("tournament_id", tournament.id).in("id", eventIds),
  );
}

await run(
  "Remove demo tournament teams",
  supabase.from("tournament_departments").delete().eq("tournament_id", tournament.id).in("name", demoTeamNames),
);

const { data: remaining } = await run(
  "Verify CITE demo data",
  supabase
    .from("events")
    .select("id")
    .eq("tournament_id", tournament.id)
    .in("name", demoEventNames),
);

console.log(`Removed demo seed data from ${tournament.name}.`);
console.log(`Remaining demo events in CITE FEST 2026: ${remaining?.length || 0}`);
