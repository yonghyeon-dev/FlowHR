import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const dashboardChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0878-employee-dashboard-quick-action-source-context.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboardChrome, /href="\/employee\/payslips\?source=employee-dashboard"/);
  assert.match(dashboardChrome, /href="\/employee\/contracts\?source=employee-dashboard"/);

  assert.match(workItem, /WI-0878/i);
  assert.match(workItem, /employee|dashboard|quick action|source|context/i);
  assert.match(roadmap, /WI-0878/i);
}

run();
console.log("e2e-wi0878-employee-dashboard-quick-action-source-context.test passed");
