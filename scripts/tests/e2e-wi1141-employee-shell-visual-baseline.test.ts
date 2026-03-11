import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const dashboardChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const overviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1141-employee-shell-visual-baseline.md"
  );

  assert.match(employeeLayout, /className="saas-shell employee-shell"/);
  assert.match(employeeLayout, /className="saas-sidebar employee-sidebar"/);
  assert.match(employeeLayout, /employee-sidebar-copy/);

  assert.match(employeePage, /className="saas-content employee-home-shell"/);
  assert.match(employeePage, /variant="home"/);
  assert.match(employeePage, /employee-home-panel-grid/);

  assert.match(dashboardChrome, /employee-home-hero/);
  assert.match(dashboardChrome, /employee-home-hero-meta/);
  assert.match(dashboardChrome, /employee-home-chip/);
  assert.match(dashboardChrome, /variant\?: "workspace" \| "home"/);

  assert.match(overviewPanels, /employee-home-workspace-panel/);
  assert.match(overviewPanels, /employee-home-priority-panel/);
  assert.match(overviewPanels, /employee-home-workspace-grid/);

  assert.match(globalsCss, /\.employee-shell \{/);
  assert.match(globalsCss, /\.employee-home-hero \{/);
  assert.match(globalsCss, /\.employee-home-chip \{/);
  assert.match(globalsCss, /\.employee-home-workspace-grid \{/);

  assert.match(workItem, /WI-1141/);
  assert.match(workItem, /직원 홈 시각 셸 베이스라인/);
}

run()
  .then(() => {
    console.log("e2e-wi1141-employee-shell-visual-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
