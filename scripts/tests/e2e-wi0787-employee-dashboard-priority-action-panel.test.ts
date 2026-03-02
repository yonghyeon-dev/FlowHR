import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0787-employee-dashboard-priority-action-panel.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeeAccountOverviewPanels,
    /id="priority-action"/,
    "employee account overview should include priority-action panel"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /integratedSubmitChecklistCards\.find\(\(card\) => !card\.ready\)/,
    "priority-action panel should derive top item from blocked checklist first"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /onJumpToSection\(priorityChecklistCard\.targetSectionId\)/,
    "priority-action panel CTA should jump to checklist target section"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /오늘의 우선 처리|Today's priority/,
    "priority-action panel should expose localized title"
  );

  assert.match(workItem, /WI-0787/i);
  assert.match(workItem, /employee/i);
  assert.match(workItem, /priority|action|checklist|panel/i);
  assert.match(roadmap, /WI-0787/i);
}

run();
console.log("e2e-wi0787-employee-dashboard-priority-action-panel.test passed");
