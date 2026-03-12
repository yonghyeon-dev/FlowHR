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
  const bridgeCss = readUtf8("src", "app", "v2-bridge.css");
  const designSystemCss = readUtf8("src", "app", "v2-design-system.css");
  const workItem = readUtf8("work-items", "WI-1141-employee-shell-visual-baseline.md");

  assert.match(employeeLayout, /className="app-shell"/);
  assert.match(employeeLayout, /className="app-header"/);
  assert.match(employeeLayout, /className="app-sidebar"/);
  assert.match(employeeLayout, /header-brand-link/);

  assert.match(employeePage, /className="saas-content employee-home-shell"/);
  assert.match(employeePage, /variant="home"/);

  assert.match(dashboardChrome, /className="page-header home-page-header"/);
  assert.match(dashboardChrome, /className="hero-inline-meta"/);
  assert.match(dashboardChrome, /className="content-grid cols-2-1 mb-6"/);
  assert.match(dashboardChrome, /variant\?: "workspace" \| "home"/);

  assert.match(overviewPanels, /employee-home-workspace-panel/);
  assert.match(overviewPanels, /employee-home-priority-panel/);
  assert.match(overviewPanels, /employee-home-workspace-grid/);

  assert.match(bridgeCss, /\.app-main-scroll \{/);
  assert.match(bridgeCss, /\.hero-inline-meta \{/);
  assert.match(bridgeCss, /\.mini-stat-list \{/);
  assert.match(designSystemCss, /\.app-shell \{/);
  assert.match(designSystemCss, /\.app-header \{/);
  assert.match(designSystemCss, /\.app-sidebar \{/);

  assert.match(workItem, /WI-1141/);
}

run()
  .then(() => {
    console.log("e2e-wi1141-employee-shell-visual-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
