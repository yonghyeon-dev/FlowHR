import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminContractsWorkspace = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspace.tsx"
  );
  const adminContractsHeader = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspaceHeader.tsx"
  );
  const employeeContractsInbox = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsInbox.tsx"
  );
  const employeeContractsHeader = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsInboxHeader.tsx"
  );
  const employeeContractsResponsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1149-route-first-workspace-visual-wave-eight.md"
  );

  assert.match(
    adminContractsWorkspace,
    /className="saas-content workspace-shell admin-workspace-shell"/
  );
  assert.match(
    adminContractsWorkspace,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    adminContractsWorkspace,
    /workspace-section-card workspace-toolbar-card/
  );
  assert.match(
    adminContractsWorkspace,
    /workspace-section-card workspace-note-card/
  );
  assert.match(
    adminContractsHeader,
    /className="page-header workspace-page-header"/
  );
  assert.match(
    adminContractsHeader,
    /className="small muted workspace-source-banner"/
  );
  assert.match(
    adminContractsHeader,
    /className="kpi-strip workspace-summary-strip"/
  );

  assert.match(
    employeeContractsInbox,
    /className="saas-content workspace-shell employee-workspace-shell"/
  );
  assert.match(
    employeeContractsInbox,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    employeeContractsInbox,
    /workspace-section-card workspace-toolbar-card/
  );
  assert.match(
    employeeContractsInbox,
    /className="kpi-strip workspace-summary-strip employee-workspace-status-strip"/
  );
  assert.match(
    employeeContractsHeader,
    /className="page-header workspace-page-header employee-workspace-status-header"/
  );
  assert.match(
    employeeContractsHeader,
    /className="small muted workspace-source-banner"/
  );
  assert.match(
    employeeContractsResponsePanel,
    /className="panel panel-contract-template-detail workspace-section-card workspace-detail-card"/
  );

  assert.match(workItem, /WI-1149/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1149-route-first-workspace-visual-wave-eight.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
