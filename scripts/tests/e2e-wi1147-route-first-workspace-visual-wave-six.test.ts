import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminRecruitmentWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspaceView.tsx"
  );
  const employeeRecruitmentWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspaceView.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1147-route-first-workspace-visual-wave-six.md"
  );

  assert.match(
    adminRecruitmentWorkspace,
    /className="saas-content workspace-shell admin-workspace-shell"/
  );
  assert.match(
    adminRecruitmentWorkspace,
    /className="page-header workspace-page-header"/
  );
  assert.match(
    adminRecruitmentWorkspace,
    /className="small muted workspace-source-banner"/
  );
  assert.match(
    adminRecruitmentWorkspace,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    adminRecruitmentWorkspace,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );
  assert.match(
    adminRecruitmentWorkspace,
    /className="panel workspace-section-card workspace-note-card"/
  );
  assert.match(
    adminRecruitmentWorkspace,
    /className="kpi-strip workspace-summary-strip"/
  );

  assert.match(
    employeeRecruitmentWorkspace,
    /className="saas-content workspace-shell employee-workspace-shell"/
  );
  assert.match(
    employeeRecruitmentWorkspace,
    /className="page-header workspace-page-header employee-workspace-status-header"/
  );
  assert.match(
    employeeRecruitmentWorkspace,
    /className="small fail workspace-inline-status"/
  );
  assert.match(
    employeeRecruitmentWorkspace,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );
  assert.match(
    employeeRecruitmentWorkspace,
    /className="panel workspace-section-card workspace-note-card"/
  );
  assert.match(
    employeeRecruitmentWorkspace,
    /className="kpi-strip workspace-summary-strip employee-workspace-status-strip"/
  );

  assert.match(workItem, /WI-1147/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1147-route-first-workspace-visual-wave-six.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
