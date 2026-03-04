import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workspaceHubs = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "workspace-hubs.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0785-employee-dashboard-hub-ia-simplification.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeeAccountOverviewPanels,
    /buildEmployeeWorkspaceHubs\(isKoLocale\)/,
    "employee account overview panels should build workspace hubs"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /id="workspace-hub"/,
    "employee dashboard should expose workspace hub panel"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /Core workspace hub|핵심 워크스페이스 허브/,
    "workspace hub panel should include localized title"
  );

  assert.match(
    workspaceHubs,
    /href: "\/employee\/schedule(\?source=employee-dashboard)?"/,
    "workspace hub should link to employee schedule"
  );
  assert.match(
    workspaceHubs,
    /href: "\/employee\/payslips(\?source=employee-dashboard)?"/,
    "workspace hub should link to payslips"
  );
  assert.match(
    workspaceHubs,
    /href: "\/employee\/contracts(\?source=employee-dashboard)?"/,
    "workspace hub should link to contracts"
  );
  assert.match(
    workspaceHubs,
    /href: "\/employee\/withholding-receipt(\?source=employee-dashboard)?"/,
    "workspace hub should link to withholding receipt"
  );
  assert.match(
    workspaceHubs,
    /href: "\/employee\/year-end-input(\?source=employee-dashboard)?"/,
    "workspace hub should link to year-end input"
  );

  assert.match(
    employeeChrome,
    /href="\/employee\/contracts(\?source=employee-dashboard)?"/,
    "employee chrome should expose contracts shortcut"
  );
  assert.doesNotMatch(
    employeeChrome,
    /className="btn btn-secondary" href="\/login"/,
    "employee chrome top actions should not expose login button directly"
  );

  assert.match(workItem, /WI-0785/i);
  assert.match(workItem, /employee/i);
  assert.match(workItem, /hub|workspace|information architecture|IA/i);
  assert.match(roadmap, /WI-0785/i);
}

run();
console.log("e2e-wi0785-employee-dashboard-hub-ia-simplification.test passed");
