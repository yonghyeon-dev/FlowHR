import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminSchedulingWorkspace = readUtf8(
    "src",
    "components",
    "scheduling",
    "AdminSchedulingWorkspaceView.tsx"
  );
  const adminSchedulingIncidentPanel = readUtf8(
    "src",
    "components",
    "scheduling",
    "AdminSchedulingIncidentPanel.tsx"
  );
  const employeeScheduleWorkspace = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const employeeWorkspaceHero = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeWorkspaceHero.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1148-route-first-workspace-visual-wave-seven.md"
  );

  assert.match(
    adminSchedulingWorkspace,
    /className="saas-content workspace-shell admin-workspace-shell"/
  );
  assert.match(
    adminSchedulingWorkspace,
    /className="hero page-header workspace-page-header"/
  );
  assert.match(
    adminSchedulingWorkspace,
    /className="small muted workspace-source-banner"/
  );
  assert.match(
    adminSchedulingWorkspace,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    adminSchedulingWorkspace,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );
  assert.match(
    adminSchedulingWorkspace,
    /className="kpi-strip workspace-summary-strip"/
  );
  assert.match(
    adminSchedulingIncidentPanel,
    /className="panel workspace-section-card"/
  );

  assert.match(
    employeeScheduleWorkspace,
    /className="saas-content workspace-shell employee-workspace-shell"/
  );
  assert.match(
    employeeScheduleWorkspace,
    /className="small fail workspace-inline-status"/
  );
  assert.match(
    employeeScheduleWorkspace,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );
  assert.match(
    employeeScheduleWorkspace,
    /className="panel workspace-section-card workspace-note-card"/
  );
  assert.match(
    employeeScheduleWorkspace,
    /className="kpi-strip workspace-summary-strip employee-workspace-status-strip"/
  );
  assert.match(
    employeeWorkspaceHero,
    /className="small muted workspace-source-banner"/
  );

  assert.match(workItem, /WI-1148/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1148-route-first-workspace-visual-wave-seven.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
