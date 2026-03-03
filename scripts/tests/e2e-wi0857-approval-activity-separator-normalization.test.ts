import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const activitySection = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueueActivitySection.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0857-approval-activity-separator-normalization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(activitySection, /\{activity\.action\}/);
  assert.match(activitySection, /\{copy\.summaryConnector\}/);
  assert.match(activitySection, /\{activity\.itemId\}\{" "\}/);
  assert.doesNotMatch(activitySection, /쨌/);
  assert.doesNotMatch(activitySection, /夷\?/);

  assert.match(workItem, /WI-0857/i);
  assert.match(workItem, /approval|activity|separator|normalization/i);
  assert.match(roadmap, /WI-0857/i);
}

run();
console.log("e2e-wi0857-approval-activity-separator-normalization.test passed");
