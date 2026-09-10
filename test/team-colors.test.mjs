import assert from "node:assert/strict";
import test from "node:test";

import { teamNameToColor } from "../src/utils/colors.ts";

test("team colors honor recognizable color names", () => {
  assert.equal(teamNameToColor("Red Satoshi"), "#ff3b30");
  assert.equal(teamNameToColor("Silver Ripple"), "#8e8e93");
  assert.equal(teamNameToColor("Blue Ethereum"), "#0a84ff");
});

test("team colors remain stable for names without a color hint", () => {
  const first = teamNameToColor("Information Technology");
  const second = teamNameToColor("Information Technology");

  assert.match(first, /^#[0-9a-f]{6}$/i);
  assert.equal(first, second);
});
