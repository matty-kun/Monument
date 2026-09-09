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
  assert.equal(canVoteForDepartment({ status: "scheduled", departments: ["Engineering"] }, department), true);
  assert.equal(canVoteForDepartment({ status: "finished", departments: ["Engineering"] }, department), false);
  assert.equal(canVoteForDepartment({ status: "scheduled", departments: ["Business"] }, department), false);
});
