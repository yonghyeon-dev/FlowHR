import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const retiredPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const retiredCompensationPanels = readUtf8("src", "app", "admin", "page-compensation-panels.tsx");
  const retiredState = readUtf8("src", "app", "admin", "page-state.ts");
  const retiredActions = readUtf8("src", "app", "admin", "page-dashboard-actions.ts");
  const retiredDirectoryActions = readUtf8("src", "app", "admin", "page-directory-actions.ts");
  const previewBuilderPage = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page-client.tsx"
  );
  const workItem = readUtf8("work-items", "WI-1136-admin-legacy-dashboard-scaffolding-removal.md");

  assert.doesNotMatch(adminPage, /page-panels/);
  assert.doesNotMatch(adminPage, /page-state/);
  assert.doesNotMatch(adminPage, /page-dashboard-actions/);
  assert.match(retiredPanels, /ADMIN_DASHBOARD_PANELS_RETIRED_WI_1136/);
  assert.match(retiredCompensationPanels, /ADMIN_COMPENSATION_PANELS_RETIRED_WI_1136/);
  assert.match(retiredState, /ADMIN_DASHBOARD_STATE_RETIRED_WI_1136/);
  assert.match(retiredActions, /ADMIN_DASHBOARD_ACTIONS_RETIRED_WI_1136/);
  assert.match(retiredDirectoryActions, /ADMIN_DIRECTORY_ACTIONS_RETIRED_WI_1136/);
  assert.match(previewBuilderPage, /AdminPayrollPanel/);
  assert.match(previewBuilderPage, /buildAdminPayrollPreviewWorkspaceActions/);
  assert.match(workItem, /WI-1136/i);
  assert.match(workItem, /레거시 대시보드 scaffolding 제거/);
}

run()
  .then(() => {
    console.log("e2e-wi1136-admin-legacy-dashboard-scaffolding-removal.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
