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

const { data: testTournament, error: findError } = await supabase
  .from("tournaments")
  .select("id, name, slug")
  .or("slug.eq.test,slug.eq.test1,name.ilike.TEST")
  .limit(1)
  .single();

if (findError) throw new Error(`Find TEST tournament: ${findError.message}`);

const { error: deactivateError } = await supabase
  .from("tournaments")
  .update({ is_active: false })
  .neq("id", testTournament.id);

if (deactivateError) throw new Error(`Deactivate other tournaments: ${deactivateError.message}`);

const { error: activateError } = await supabase
  .from("tournaments")
  .update({ is_active: true })
  .eq("id", testTournament.id);

if (activateError) throw new Error(`Activate TEST tournament: ${activateError.message}`);

console.log(`Active tournament is now ${testTournament.name} (${testTournament.slug}).`);
