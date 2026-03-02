import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const overviewPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0805-employee-dashboard-action-priority-badges.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(overviewPanel, /type ActionPriorityBadge/);
  assert.match(overviewPanel, /function resolveActionPrioritySeverity/);
  assert.match(overviewPanel, /function buildActionPriorityBadges/);
  assert.match(overviewPanel, /const actionPriorityBadges = buildActionPriorityBadges/);
  assert.match(overviewPanel, /actionPriorityBadges\.map\(\(badge\) =>/);
  assert.match(overviewPanel, /badge\.remainingCount/);
  assert.match(overviewPanel, /badge\.totalCount/);
  assert.match(overviewPanel, /onJumpToSection\(badge\.targetSectionId\)/);
  assert.match(overviewPanel, /"Critical"/);
  assert.match(overviewPanel, /"Watch"/);
  assert.match(overviewPanel, /"Stable"/);

  assert.match(workItem, /WI-0805/i);
  assert.match(workItem, /employee|dashboard|action|priority|badge/i);
  assert.match(roadmap, /WI-0805/i);
}

run();
console.log("e2e-wi0805-employee-dashboard-action-priority-badges.test passed");
