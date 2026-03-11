import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollCloseConsole = readUtf8(
    "src",
    "components",
    "payroll-close",
    "PayrollClosePeriodConsole.tsx"
  );
  const attendanceLeaveWorkspace = readUtf8(
    "src",
    "app",
    "employee",
    "attendance-leave-workspace-client.tsx"
  );
  const dashboardChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1143-route-first-workspace-visual-wave-two.md"
  );

  assert.match(
    payrollCloseConsole,
    /className="saas-content workspace-shell admin-workspace-shell"/
  );
  assert.match(
    payrollCloseConsole,
    /className="page-header workspace-page-header"/
  );
  assert.match(
    payrollCloseConsole,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    payrollCloseConsole,
    /className="panel workspace-section-card"/
  );
  assert.match(
    payrollCloseConsole,
    /className="panel workspace-side-panel"/
  );
  assert.match(
    payrollCloseConsole,
    /className="small workspace-inline-status"/
  );

  assert.match(
    attendanceLeaveWorkspace,
    /className="saas-content workspace-shell employee-workspace-shell"/
  );
  assert.match(attendanceLeaveWorkspace, /title=\{workspaceTitle\}/);
  assert.match(attendanceLeaveWorkspace, /description=\{workspaceDescription\}/);
  assert.match(attendanceLeaveWorkspace, /metaLabel=\{workspaceMetaLabel\}/);
  assert.match(
    attendanceLeaveWorkspace,
    /className="panel-grid workspace-panel-grid"/
  );

  assert.match(
    dashboardChrome,
    /workspace-page-header employee-workspace-status-header/
  );
  assert.match(
    dashboardChrome,
    /workspace-summary-strip employee-workspace-status-strip/
  );
  assert.match(
    dashboardChrome,
    /workspace-summary-card employee-workspace-status-card/
  );
  assert.match(
    dashboardChrome,
    /className="small fail workspace-inline-status"/
  );

  assert.match(globalsCss, /\.workspace-inline-status \{/);
  assert.match(globalsCss, /\.workspace-source-banner \{/);
  assert.match(globalsCss, /\.employee-workspace-status-strip \{/);

  assert.match(workItem, /WI-1143/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1143-route-first-workspace-visual-wave-two.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
