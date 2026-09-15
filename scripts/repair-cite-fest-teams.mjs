import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    process.env[key.trim()] ||= valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

async function run(request, label) {
  const { data, error } = await request;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const tournament = await run(
  supabase
    .from("tournaments")
    .select("id, name, slug")
    .eq("slug", "cite-fest-2026")
    .single(),
  "Find CITE FEST 2026",
);

const [schedules, results, existingSnapshots, departments] = await Promise.all([
  run(
    supabase.from("schedules").select("departments").eq("tournament_id", tournament.id),
    "Read CITE FEST schedules",
  ),
  run(
    supabase.from("results").select("department_id").eq("tournament_id", tournament.id).not("department_id", "is", null),
    "Read CITE FEST results",
  ),
  run(
    supabase
      .from("tournament_departments")
      .select("department_id, name")
      .eq("tournament_id", tournament.id),
    "Read existing CITE FEST teams",
  ),
  run(
    supabase
      .from("departments")
      .select("id, name, abbreviation, image_url, mascot_url"),
    "Read global teams",
  ),
]);

const existingIds = new Set((existingSnapshots || []).map((team) => team.department_id));
const globalById = new Map((departments || []).map((team) => [team.id, team]));
const globalByName = new Map((departments || []).map((team) => [team.name.toLowerCase(), team]));

const referencedNames = new Set();
for (const schedule of schedules || []) {
  for (const teamName of schedule.departments || []) {
    if (typeof teamName === "string" && teamName.trim()) referencedNames.add(teamName.trim());
  }
}

const referencedIds = new Set((results || []).map((result) => result.department_id).filter(Boolean));
const snapshots = [];

for (const teamId of referencedIds) {
  if (existingIds.has(teamId)) continue;
  const team = globalById.get(teamId);
  if (!team) continue;
  snapshots.push({
    tournament_id: tournament.id,
    department_id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    image_url: team.image_url,
    mascot_url: team.mascot_url,
  });
}

for (const teamName of referencedNames) {
  const team = globalByName.get(teamName.toLowerCase());
  if (!team || existingIds.has(team.id) || snapshots.some((snapshot) => snapshot.department_id === team.id)) continue;
  snapshots.push({
    tournament_id: tournament.id,
    department_id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    image_url: team.image_url,
    mascot_url: team.mascot_url,
  });
}

if (snapshots.length > 0) {
  await run(
    supabase
      .from("tournament_departments")
      .upsert(snapshots, { onConflict: "tournament_id,department_id" })
      .select("id"),
    "Restore CITE FEST team snapshots",
  );
}

const restored = await run(
  supabase
    .from("tournament_departments")
    .select("id", { count: "exact" })
    .eq("tournament_id", tournament.id),
  "Verify restored CITE FEST teams",
);

console.log(`Repaired ${tournament.name}.`);
console.log(`Added team snapshots: ${snapshots.length}`);
console.log(`Current team snapshots: ${restored?.length || 0}`);
