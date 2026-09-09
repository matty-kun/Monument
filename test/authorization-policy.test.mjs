import assert from "node:assert/strict";
import test from "node:test";
import { isAdminRole } from "../src/utils/supabase/authorizationPolicy.ts";

test("only admin roles pass the privileged-action role check", () => {
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("super_admin"), true);
  assert.equal(isAdminRole("user"), false);
  assert.equal(isAdminRole(null), false);
});
