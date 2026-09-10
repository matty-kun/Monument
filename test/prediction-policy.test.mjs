import assert from "node:assert/strict";
import test from "node:test";
import {
  canVoteForDepartment,
  hasValidPredictionIds,
} from "../src/features/schedule/actions/predictionPolicy.ts";

test("prediction policy rejects invalid IDs, finished matches, and non-participants", () => {
  const scheduleId = "550e8400-e29b-41d4-a716-446655440000";
  const departmentId = "2c1f4d38-a256-4d38-a9da-719053347001";
  assert.equal(hasValidPredictionIds(scheduleId, departmentId), true);
  assert.equal(hasValidPredictionIds("not-a-uuid", departmentId), false);

  const department = { department_id: departmentId, name: "Engineering" };
  const beforeMatchEnds = new Date("2026-04-08T04:00:00.000Z");
  const afterMatchEnds = new Date("2026-04-08T06:00:00.000Z");
  const scheduledMatch = {
    status: "scheduled",
    departments: ["Engineering"],
    date: "2026-04-08",
    end_time: "13:00:00",
  };

  assert.equal(canVoteForDepartment(scheduledMatch, department, beforeMatchEnds), true);
  assert.equal(canVoteForDepartment(scheduledMatch, department, afterMatchEnds), false);
  assert.equal(canVoteForDepartment({ status: "finished", departments: ["Engineering"] }, department), false);
  assert.equal(canVoteForDepartment({ status: "scheduled", departments: ["Business"] }, department), false);
});
