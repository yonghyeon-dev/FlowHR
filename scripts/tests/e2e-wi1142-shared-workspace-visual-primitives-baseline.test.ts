import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPreviewPage = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page-client.tsx"
  );
  const employeeRequestsWorkspace = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "workspace-content.tsx"
  );
  const employeeWorkspaceHero = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeWorkspaceHero.tsx"
  );
  const adminPayrollPanel = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminPayrollPanel.tsx"
  );
  const adminDebugLogs = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminDebugLogsPanel.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1142-shared-workspace-visual-primitives-baseline.md"
  );

  assert.match(adminPreviewPage, /className="saas-content workspace-shell admin-workspace-shell"/);
  assert.match(adminPreviewPage, /className="page-header workspace-page-header"/);
  assert.match(adminPreviewPage, /className="panel-grid workspace-panel-grid"/);

  assert.match(
    employeeRequestsWorkspace,
    /className="saas-content workspace-shell employee-workspace-shell(?: [^"]+)?"/
  );
  assert.match(employeeRequestsWorkspace, /workspace-section-card workspace-action-card/);
  assert.match(employeeRequestsWorkspace, /workspace-note-card/);

  assert.match(employeeWorkspaceHero, /workspace-hero-panel/);
  assert.match(employeeWorkspaceHero, /workspace-hero-meta/);
  assert.match(employeeWorkspaceHero, /workspace-hero-chip/);

  assert.match(adminPayrollPanel, /workspace-summary-strip/);
  assert.match(adminPayrollPanel, /workspace-summary-card/);
  assert.match(adminPayrollPanel, /workspace-section-card/);

  assert.match(adminDebugLogs, /workspace-side-panel/);

  assert.match(globalsCss, /\.workspace-shell \{/);
  assert.match(globalsCss, /\.workspace-page-header \{/);
  assert.match(globalsCss, /\.workspace-hero-panel \{/);
  assert.match(globalsCss, /\.workspace-summary-card \{/);
  assert.match(globalsCss, /\.workspace-side-panel \{/);

  assert.match(workItem, /WI-1142/);
  assert.match(workItem, /공통 워크스페이스 시각 프리미티브 베이스라인/);
}

run()
  .then(() => {
    console.log("e2e-wi1142-shared-workspace-visual-primitives-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
