import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminBenefitsWorkspace = readUtf8(
    "src",
    "components",
    "benefits",
    "AdminBenefitsWorkspaceView.tsx"
  );
  const employeeBenefitsWorkspace = readUtf8(
    "src",
    "components",
    "benefits",
    "EmployeeBenefitsWorkspaceView.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1146-route-first-workspace-visual-wave-five.md"
  );

  assert.match(
    adminBenefitsWorkspace,
    /className="saas-content workspace-shell admin-workspace-shell"/
  );
  assert.match(
    adminBenefitsWorkspace,
    /className="page-header workspace-page-header"/
  );
  assert.match(
    adminBenefitsWorkspace,
    /className="small muted workspace-source-banner"/
  );
  assert.match(
    adminBenefitsWorkspace,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    adminBenefitsWorkspace,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );
  assert.match(
    adminBenefitsWorkspace,
    /className="panel workspace-side-panel"/
  );
  assert.match(
    adminBenefitsWorkspace,
    /className="kpi-strip workspace-summary-strip"/
  );

  assert.match(
    employeeBenefitsWorkspace,
    /className="saas-content workspace-shell employee-workspace-shell"/
  );
  assert.match(
    employeeBenefitsWorkspace,
    /className="page-header workspace-page-header employee-workspace-status-header"/
  );
  assert.match(
    employeeBenefitsWorkspace,
    /className="small fail workspace-inline-status"/
  );
  assert.match(
    employeeBenefitsWorkspace,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );
  assert.match(
    employeeBenefitsWorkspace,
    /className="panel workspace-section-card workspace-note-card"/
  );
  assert.match(
    employeeBenefitsWorkspace,
    /className="kpi-strip workspace-summary-strip employee-workspace-status-strip"/
  );

  assert.match(workItem, /WI-1146/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1146-route-first-workspace-visual-wave-five.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
