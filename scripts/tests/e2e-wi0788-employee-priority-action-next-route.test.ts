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
    "WI-0788-employee-priority-action-next-route.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeeAccountOverviewPanels,
    /function resolvePriorityWorkspaceTarget\(/,
    "priority panel should resolve target section to related route"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /case "attendance":[\s\S]*href: "\/employee\?focus=attendance"/,
    "attendance priority should map to attendance focus route"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /case "leave":[\s\S]*href: "\/employee\?focus=leave"/,
    "leave priority should map to leave focus route"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /case "request-resubmit":[\s\S]*href: "\/employee\?focus=request-resubmit"/,
    "resubmit priority should map to resubmit focus route"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /priorityWorkspaceTarget = priorityChecklistCard[\s\S]*resolvePriorityWorkspaceTarget/,
    "priority panel should derive workspace target from priority checklist card"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /href=\{priorityWorkspaceTarget\.href\}/,
    "priority panel should render related workspace link button"
  );

  assert.match(workItem, /WI-0788/i);
  assert.match(workItem, /employee/i);
  assert.match(workItem, /priority|route|workspace|action/i);
  assert.match(roadmap, /WI-0788/i);
}

run();
console.log("e2e-wi0788-employee-priority-action-next-route.test passed");
