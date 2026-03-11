import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const retiredFiles = [
    ["src", "components", "admin-dashboard", "AdminDashboardChrome.tsx", "ADMIN_DASHBOARD_CHROME_RETIRED_WI_1137"],
    ["src", "components", "admin-dashboard", "AdminOnboardingAccountPanels.tsx", "ADMIN_ONBOARDING_ACCOUNT_PANELS_RETIRED_WI_1137"],
    ["src", "components", "admin-dashboard", "AdminPeopleInvitePanels.tsx", "ADMIN_PEOPLE_INVITE_PANELS_RETIRED_WI_1137"],
    ["src", "components", "admin-dashboard", "AdminSchedulingPanel.tsx", "ADMIN_SCHEDULING_PANEL_RETIRED_WI_1137"],
    ["src", "components", "admin-dashboard", "AdminAggregateLeavePanels.tsx", "ADMIN_AGGREGATE_LEAVE_PANELS_RETIRED_WI_1137"],
    ["src", "components", "admin-dashboard", "AdminPayrollWorkspaceCard.tsx", "ADMIN_PAYROLL_WORKSPACE_CARD_RETIRED_WI_1137"]
  ] as const;

  for (const retiredFile of retiredFiles) {
    const [a, b, c, d, marker] = retiredFile;
    const source = readUtf8(a, b, c, d);
    assert.match(source, new RegExp(marker));
    assert.doesNotMatch(source, /export function /);
  }

  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const payrollPreviewBuilder = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page-client.tsx"
  );

  assert.doesNotMatch(adminPage, /AdminDashboardChrome/);
  assert.doesNotMatch(adminPage, /AdminOnboardingAccountPanels/);
  assert.doesNotMatch(adminPage, /AdminPeopleInvitePanels/);
  assert.doesNotMatch(adminPage, /AdminSchedulingPanel/);
  assert.doesNotMatch(adminPage, /AdminAggregateLeavePanels/);
  assert.doesNotMatch(adminPage, /AdminPayrollWorkspaceCard/);
  assert.match(payrollPreviewBuilder, /AdminPayrollPanel/);
  assert.match(payrollPreviewBuilder, /AdminDebugLogsPanel/);

  console.log("e2e-wi1137-admin-hub-shell-legacy-fragment-prune.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
