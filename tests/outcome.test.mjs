import assert from "node:assert/strict";
import test from "node:test";
import {
  CONFIDENCE,
  actionsFromDelegation,
  applyCountermand,
  resolveOutcome,
} from "../app/rules.js";

test("62 meets a bar of 60 and misses a bar of 80", () => {
  const all = ["assess", "monitor", "warning", "patrols", "freeze", "inspections"];
  assert.equal(CONFIDENCE, 62);
  assert.deepEqual(actionsFromDelegation(all, 60), all);
  assert.deepEqual(actionsFromDelegation(all, 40), all);
  assert.deepEqual(actionsFromDelegation(all, 80), ["assess", "monitor"]);
});

test("a hold still keeps watching if those were ticked", () => {
  assert.deepEqual(actionsFromDelegation(["warning", "monitor"], 80), ["monitor"]);
  assert.deepEqual(actionsFromDelegation(["warning"], 80), []);
});

test("only patrols and inspections can be stopped", () => {
  const taken = ["warning", "patrols", "freeze", "inspections"];
  assert.deepEqual(applyCountermand(taken, ["patrols", "inspections", "warning", "freeze"]), [
    "warning",
    "freeze",
  ]);
});

test("inspections escalate and injure", () => {
  assert.deepEqual(resolveOutcome(["inspections"], null), {
    outcome: "escalated",
    harm: true,
    injury: true,
  });
});

test("a freeze or a patrol escalates without a boarding", () => {
  assert.deepEqual(resolveOutcome(["freeze"], null).injury, false);
  assert.equal(resolveOutcome(["patrols"], null).outcome, "escalated");
  assert.equal(resolveOutcome(["warning", "freeze"], "quiet").harm, true);
});

test("a warning, or blaming Lei up front, stays political", () => {
  assert.equal(resolveOutcome(["warning"], "quiet").outcome, "political");
  assert.equal(resolveOutcome([], "blame").outcome, "political");
  assert.equal(resolveOutcome(["monitor"], "messages").outcome, "contained");
});

test("recalling the patrol and stopping the inspection can leave a freeze standing", () => {
  const finalActions = applyCountermand(
    ["warning", "patrols", "freeze", "inspections"],
    ["patrols", "inspections"]
  );
  const result = resolveOutcome(finalActions, "messages");
  assert.deepEqual(finalActions, ["warning", "freeze"]);
  assert.equal(result.outcome, "escalated");
  assert.equal(result.injury, false);
});
