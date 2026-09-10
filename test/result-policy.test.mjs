import assert from "node:assert/strict";
import test from "node:test";
import { validateResultReplacement } from "../src/features/admin/results/resultPolicy.ts";

const eventId = "1f4c9f87-ec0c-4fc1-9f7a-7c890f97d3f2";
const tournamentId = "74af0159-67e2-4a49-a1d1-7dbd6aa029ee";
const firstTeam = "15c46f71-f0e5-4fb7-9a6c-c006578f6a8f";
const secondTeam = "f8765e29-6865-40d5-8c55-fe0386e073e8";

test("result replacement policy accepts a valid podium", () => {
  assert.equal(validateResultReplacement({
    eventId,
    tournamentId,
    assignments: [
      { departmentId: firstTeam, medalType: "gold" },
      { departmentId: secondTeam, medalType: "silver" },
    ],
  }), null);
});

test("result replacement policy rejects duplicate medals and teams", () => {
  assert.match(validateResultReplacement({
    eventId,
    tournamentId,
    assignments: [
      { departmentId: firstTeam, medalType: "gold" },
      { departmentId: secondTeam, medalType: "gold" },
    ],
  }) || "", /medal/i);

  assert.match(validateResultReplacement({
    eventId,
    tournamentId,
    assignments: [
      { departmentId: firstTeam, medalType: "gold" },
      { departmentId: firstTeam, medalType: "silver" },
    ],
  }) || "", /team/i);
});
