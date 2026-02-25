import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const leaveService = readUtf8("src", "features", "leave", "service.ts");
  const policyHelpers = readUtf8("src", "features", "leave", "policy-time-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0464-leave-policy-time-helper-extraction-line-budget-2600.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(leaveService, /from "@\/features\/leave\/policy-time-helpers"/);
  assert.match(leaveService, /resolvePolicyRules\(/);
  assert.match(leaveService, /calculateRequestedLeave\(/);
  assert.match(leaveService, /assertPolicyRequestConstraints\(/);

  assert.doesNotMatch(leaveService, /function toSeoulDayIndex\(/);
  assert.doesNotMatch(leaveService, /function resolvePolicyRules\(/);
  assert.doesNotMatch(leaveService, /function calculateRequestedLeave\(/);
  assert.doesNotMatch(leaveService, /function assertPolicyRequestConstraints\(/);
  assert.doesNotMatch(leaveService, /function ensureValidPeriod\(/);

  assert.ok(
    countLines(leaveService) <= 2600,
    `leave/service.ts should stay <= 2600 lines (current: ${countLines(leaveService)})`
  );

  assert.match(policyHelpers, /export const DEFAULT_GRANTED_DAYS = 15;/);
  assert.match(policyHelpers, /export type LeavePolicyRules = \{/);
  assert.match(policyHelpers, /export function resolvePolicyRules\(/);
  assert.match(policyHelpers, /export function calculateRequestedLeave\(/);
  assert.match(policyHelpers, /export function ensureValidPeriod\(/);

  assert.match(workItem, /WI-0464/i);
  assert.match(workItem, /leave|policy|time|helper|extraction|line budget/i);
  assert.match(roadmap, /WI-0464/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0464-leave-policy-time-helper-extraction-line-budget-2600.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
