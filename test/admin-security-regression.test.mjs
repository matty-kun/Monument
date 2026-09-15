import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("security: every tournament-team mutation requires an admin", async () => {
  const source = await readFile(new URL("../src/app/admin/actions.ts", import.meta.url), "utf8");
  for (const action of [
    "saveTournamentTeamAction",
    "deleteTournamentTeamAction",
  ]) {
    const body = source.slice(source.indexOf(`export async function ${action}`));
    assert.ok(body.indexOf("await requireAdmin()") >= 0, `${action} must authenticate an admin`);
    assert.ok(
      body.indexOf("await requireAdmin()") < body.indexOf("createServiceClient()"),
      `${action} must authorize before using elevated database access`,
    );
  }
});

test("regression: team creation no longer uses an invalid name upsert", async () => {
  const source = await readFile(new URL("../src/app/admin/actions.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\.upsert\([\s\S]*?onConflict\s*:\s*["']name["']/);
});

test("acceptance: admin routes own their loading experience", async () => {
  const source = await readFile(new URL("../src/app/admin/loading.tsx", import.meta.url), "utf8");
  assert.match(source, /Loading admin workspace/);
  assert.doesNotMatch(source, /Loading standings|PodiumSkeleton/);
});
