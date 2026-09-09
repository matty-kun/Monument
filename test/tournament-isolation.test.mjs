import assert from "node:assert/strict";
import test from "node:test";
import {
  getTournamentDataFilter,
  getTournamentRealtimeFilter,
  readMysteryMode,
} from "../src/utils/tournamentRealtime.ts";

test("tournament data and mystery-mode subscriptions remain tournament-scoped", () => {
  const tournamentId = "550e8400-e29b-41d4-a716-446655440000";
  assert.equal(getTournamentDataFilter(tournamentId), `tournament_id=eq.${tournamentId}`);
  assert.equal(getTournamentRealtimeFilter(tournamentId), `id=eq.${tournamentId}`);
  assert.equal(readMysteryMode({ mystery_mode: true }), true);
  assert.equal(readMysteryMode({ mystery_mode: false }), false);
  assert.equal(readMysteryMode({ value: "true" }), false);
});
