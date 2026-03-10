import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const queryHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "page-query-prefill-helpers.ts"
  );
  const shortcuts = readUtf8(
    "src",
    "components",
    "employee-self-service",
    "EmployeeJourneyShortcutPanel.tsx"
  );
  const scheduleSummaryPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeScheduleSummaryPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1120-employee-schedule-route-first-home-relief.md"
  );

  assert.match(queryHelpers, /schedule: "\/employee\/schedule"/);
  assert.match(employeePage, /EmployeeScheduleSummaryPanel/);
  assert.doesNotMatch(employeePage, /<EmployeeSchedulePanel/);
  assert.match(shortcuts, /\/employee\/schedule/);
  assert.doesNotMatch(shortcuts, /sectionId: "schedule"/);
  assert.match(scheduleSummaryPanel, /\/employee\/schedule\?source=employee-dashboard/);
  assert.match(scheduleSummaryPanel, /\/employee\/attendance/);
  assert.match(workItem, /route-first/i);
}

run();
console.log("e2e-wi1120-employee-schedule-route-first-home-relief.test passed");
