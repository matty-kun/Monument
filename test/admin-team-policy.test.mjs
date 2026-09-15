import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTournamentTeamPayload,
  validateTournamentTeamInput,
} from "../src/features/admin/departments/teamPolicy.ts";

const tournamentId = "550e8400-e29b-41d4-a716-446655440000";

test("unit: validates a team independently", () => {
  assert.equal(validateTournamentTeamInput({
    tournamentId,
    name: " Blue Ethereum ",
    abbreviation: "BSIT",
    imageUrl: null,
  }), null);
  assert.match(validateTournamentTeamInput({
    tournamentId: "not-an-id",
    name: "Team",
    abbreviation: "",
    imageUrl: null,
  }) || "", /valid tournament/i);
});

test("regression: a new tournament team does not require a unique department name", () => {
  const payload = buildTournamentTeamPayload({
    tournamentId,
    name: " New Team ",
    abbreviation: " NT ",
    imageUrl: null,
  });
  assert.deepEqual(payload, { name: "New Team", abbreviation: "NT", image_url: null });
  assert.equal(Object.hasOwn(payload, "tournament_id"), false);
});

test("contract: team payload matches the Supabase column names", () => {
  assert.deepEqual(Object.keys(buildTournamentTeamPayload({
    tournamentId,
    name: "Team",
    abbreviation: "T",
    imageUrl: "https://example.com/team.png",
  })).sort(), ["abbreviation", "image_url", "name"]);
});

test("snapshot: normalized team payload remains stable", () => {
  const serialized = JSON.stringify(buildTournamentTeamPayload({
    tournamentId,
    name: "  Silver Ripple  ",
    abbreviation: "  SR  ",
    imageUrl: "  https://example.com/silver.png  ",
  }), null, 2);
  assert.equal(serialized, `{
  "name": "Silver Ripple",
  "abbreviation": "SR",
  "image_url": "https://example.com/silver.png"
}`);
});
