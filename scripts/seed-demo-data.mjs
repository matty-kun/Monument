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

function fail(error) {
  console.error(error?.message || error);
  process.exit(1);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

async function queryOne(request, label) {
  const { data, error } = await request;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function getOrCreateByName(supabase, table, payload) {
  const existing = await queryOne(
    supabase.from(table).select("*").eq("name", payload.name).maybeSingle(),
    `Find ${table} ${payload.name}`,
  );

  if (existing) return existing;

  return queryOne(
    supabase.from(table).insert(payload).select("*").single(),
    `Create ${table} ${payload.name}`,
  );
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

try {
  const tournament =
    (await queryOne(
      supabase.from("tournaments").select("*").eq("slug", "test").maybeSingle(),
      "Find TEST tournament",
    )) ||
    (await queryOne(
      supabase.from("tournaments").select("*").ilike("name", "TEST").limit(1).maybeSingle(),
      "Find TEST tournament by name",
    )) ||
    (await queryOne(
      supabase.from("tournaments").select("*").eq("is_active", true).limit(1).maybeSingle(),
      "Find active tournament",
    ));

  if (!tournament) {
    throw new Error("No active tournament found. Create/select a tournament first.");
  }

  const categories = {};
  for (const name of ["Sports", "Arts & Media", "Academic", "E-Sports"]) {
    categories[name] = await getOrCreateByName(supabase, "categories", { name });
  }

  const venues = {};
  for (const name of ["GYM", "ETD Court", "JBB AVR", "Front of CITE Office"]) {
    venues[name] = await getOrCreateByName(supabase, "venues", { name });
  }

  const teamSeeds = [
    {
      name: "Blue Ethereum",
      abbreviation: "BETH",
      image_url: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=BlueEthereum",
      mascot_url: null,
    },
    {
      name: "Red Satoshi",
      abbreviation: "RSAT",
      image_url: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=RedSatoshi",
      mascot_url: null,
    },
    {
      name: "Silver Ripple",
      abbreviation: "SRIP",
      image_url: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=SilverRipple",
      mascot_url: null,
    },
    {
      name: "Green Solana",
      abbreviation: "GSOL",
      image_url: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=GreenSolana",
      mascot_url: null,
    },
  ];

  const teams = [];
  for (const seed of teamSeeds) {
    const department = await getOrCreateByName(supabase, "departments", seed);
    const snapshotPayload = {
      tournament_id: tournament.id,
      department_id: department.id,
      name: seed.name,
      abbreviation: seed.abbreviation,
      image_url: seed.image_url,
      mascot_url: seed.mascot_url,
    };

    await queryOne(
      supabase
        .from("tournament_departments")
        .upsert(snapshotPayload, { onConflict: "tournament_id,department_id" })
        .select("*")
        .single(),
      `Attach ${seed.name} to tournament`,
    );

    teams.push({ ...department, ...snapshotPayload });
  }

  const eventSeeds = [
    { name: "Basketball Finals", icon: "🏀", category: categories.Sports.id, gender: "Mixed", division: "Team" },
    { name: "Video Recap", icon: "🎬", category: categories["Arts & Media"].id, gender: null, division: "Team" },
    { name: "Quiz Bowl", icon: "🧠", category: categories.Academic.id, gender: null, division: "Team" },
    { name: "Mobile Legends Showmatch", icon: "🎮", category: categories["E-Sports"].id, gender: "Mixed", division: "Team" },
  ];

  const events = {};
  for (const seed of eventSeeds) {
    const existing = await queryOne(
      supabase
        .from("events")
        .select("*")
        .eq("tournament_id", tournament.id)
        .eq("name", seed.name)
        .maybeSingle(),
      `Find event ${seed.name}`,
    );

    events[seed.name] =
      existing ||
      (await queryOne(
        supabase.from("events").insert({ ...seed, tournament_id: tournament.id }).select("*").single(),
        `Create event ${seed.name}`,
      ));
  }

  await queryOne(
    supabase.from("schedules").delete().eq("tournament_id", tournament.id).eq("context", "Demo seed"),
    "Clear old demo schedules",
  );

  const today = new Date();
  const schedules = [
    {
      tournament_id: tournament.id,
      event_id: events["Basketball Finals"].id,
      venue_id: venues.GYM.id,
      date: dateOnly(today),
      start_time: "08:00:00",
      end_date: dateOnly(today),
      end_time: "09:30:00",
      departments: [teams[0].name, teams[1].name],
      status: "finished",
      winner_id: teams[0].department_id,
      score_a: 82,
      score_b: 76,
      stage: "Final",
      context: "Demo seed",
    },
    {
      tournament_id: tournament.id,
      event_id: events["Video Recap"].id,
      venue_id: venues["JBB AVR"].id,
      date: dateOnly(today),
      start_time: "13:00:00",
      end_date: dateOnly(today),
      end_time: "14:30:00",
      departments: [teams[0].name, teams[1].name, teams[2].name],
      status: "scheduled",
      stage: "Final",
      context: "Demo seed",
    },
    {
      tournament_id: tournament.id,
      event_id: events["Quiz Bowl"].id,
      venue_id: venues["Front of CITE Office"].id,
      date: dateOnly(addDays(today, 1)),
      start_time: "10:00:00",
      end_date: dateOnly(addDays(today, 1)),
      end_time: "11:30:00",
      departments: [teams[2].name, teams[3].name],
      status: "scheduled",
      stage: "Semi-final",
      context: "Demo seed",
    },
    {
      tournament_id: tournament.id,
      event_id: events["Mobile Legends Showmatch"].id,
      venue_id: venues["ETD Court"].id,
      date: dateOnly(addDays(today, 2)),
      start_time: "15:00:00",
      end_date: dateOnly(addDays(today, 2)),
      end_time: "16:30:00",
      departments: [teams[1].name, teams[3].name],
      status: "scheduled",
      stage: "Showmatch",
      context: "Demo seed",
    },
  ];

  await queryOne(
    supabase.from("schedules").insert(schedules).select("id"),
    "Create demo schedules",
  );

  const resultEvents = [events["Basketball Finals"], events["Video Recap"]];
  await queryOne(
    supabase
      .from("results")
      .delete()
      .eq("tournament_id", tournament.id)
      .in(
        "event_id",
        resultEvents.map((event) => event.id),
      ),
    "Clear old demo results",
  );

  await queryOne(
    supabase
      .from("results")
      .insert([
        {
          tournament_id: tournament.id,
          event_id: events["Basketball Finals"].id,
          department_id: teams[0].department_id,
          medal_type: "gold",
          points: 10,
          assigned_by_email: "demo-seed@monument.local",
          updated_by_email: "demo-seed@monument.local",
        },
        {
          tournament_id: tournament.id,
          event_id: events["Basketball Finals"].id,
          department_id: teams[1].department_id,
          medal_type: "silver",
          points: 7,
          assigned_by_email: "demo-seed@monument.local",
          updated_by_email: "demo-seed@monument.local",
        },
        {
          tournament_id: tournament.id,
          event_id: events["Video Recap"].id,
          department_id: teams[1].department_id,
          medal_type: "gold",
          points: 10,
          assigned_by_email: "demo-seed@monument.local",
          updated_by_email: "demo-seed@monument.local",
        },
        {
          tournament_id: tournament.id,
          event_id: events["Video Recap"].id,
          department_id: teams[0].department_id,
          medal_type: "silver",
          points: 7,
          assigned_by_email: "demo-seed@monument.local",
          updated_by_email: "demo-seed@monument.local",
        },
        {
          tournament_id: tournament.id,
          event_id: events["Video Recap"].id,
          department_id: teams[2].department_id,
          medal_type: "bronze",
          points: 5,
          assigned_by_email: "demo-seed@monument.local",
          updated_by_email: "demo-seed@monument.local",
        },
      ])
      .select("id"),
    "Create demo results",
  );

  console.log(`Seeded demo data for ${tournament.name}.`);
  console.log(`Teams: ${teams.length}`);
  console.log(`Events: ${Object.keys(events).length}`);
  console.log(`Schedules: ${schedules.length}`);
  console.log("Updates will appear from the new schedules and results.");
} catch (error) {
  fail(error);
}
