import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const dashboardState = readUtf8("src", "app", "admin", "page-state.ts");
  const dashboardActions = readUtf8("src", "app", "admin", "page-dashboard-actions.ts");
  const previewBuilderClient = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page-client.tsx"
  );
  const previewBuilderState = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page-state.ts"
  );
  const previewBuilderActions = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page-actions.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1135-admin-payroll-preview-state-isolation.md"
  );

  assert.match(dashboardState, /ADMIN_DASHBOARD_STATE_RETIRED_WI_1136/);

  assert.match(dashboardActions, /ADMIN_DASHBOARD_ACTIONS_RETIRED_WI_1136/);

  assert.match(previewBuilderClient, /useAdminPayrollPreviewBuilderState/);
  assert.match(previewBuilderClient, /buildAdminPayrollPreviewWorkspaceActions/);
  assert.doesNotMatch(previewBuilderClient, /useAdminDashboardState/);
  assert.doesNotMatch(previewBuilderClient, /buildAdminDashboardActions/);

  assert.match(previewBuilderState, /payrollPreviewMode/);
  assert.match(previewBuilderActions, /refreshPreviewedPayroll/);
  assert.match(previewBuilderActions, /previewPayroll/);
  assert.match(workItem, /WI-1135/i);
  assert.match(workItem, /state isolation/i);
}

run()
  .then(() => {
    console.log("e2e-wi1135-admin-payroll-preview-state-isolation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
