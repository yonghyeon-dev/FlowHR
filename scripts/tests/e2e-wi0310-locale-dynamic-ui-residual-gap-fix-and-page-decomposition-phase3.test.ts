import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPageState = readUtf8("src", "app", "admin", "page-state.ts");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const adminLocaleHelpers = readUtf8("src", "app", "admin", "page-locale-helpers.ts");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLocaleHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const adminDebugLogsPanel = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminDebugLogsPanel.tsx"
  );
  const adminOnboardingAccountPanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminOnboardingAccountPanels.tsx"
  );
  const adminOnboardingSections = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const adminPayrollPanel = readUtf8("src", "components", "admin-dashboard", "AdminPayrollPanel.tsx");
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const employeeChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const employeeRequestFeedbackPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeRequestFeedbackPanels.tsx"
  );
  const employeeResubmitPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeResubmitPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0310-locale-dynamic-ui-residual-gap-fix-and-page-decomposition-phase3.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(adminPage, /from "@\/app\/admin\/page-locale-helpers"/);
  assert.doesNotMatch(
    adminPage,
    /const localeLabelBundle = useMemo\(\(\) => resolveAdminLocaleLabelBundle\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.doesNotMatch(
    adminPage,
    /const \{ queueLabels, logStatusLabels \} = localeLabelBundle;/
  );
  assert.match(adminPanels, /ADMIN_DASHBOARD_PANELS_RETIRED_WI_1136/);
  assert.match(adminPageState, /ADMIN_DASHBOARD_STATE_RETIRED_WI_1136/);
  assert.doesNotMatch(adminPage, /const updatedAtLabel = isKoLocale \?/);

  assert.match(adminLocaleHelpers, /export function isDefaultDemoOrganizationName\(/);
  assert.match(adminLocaleHelpers, /export function resolveAdminLocaleLabelBundle\(isKoLocale: boolean\)/);
  assert.match(adminLocaleHelpers, /employee:\s*"Employee"/);
  assert.match(adminLocaleHelpers, /manager:\s*"Manager"/);
  assert.match(adminLocaleHelpers, /link:\s*"Link"/);
  assert.match(adminLocaleHelpers, /email:\s*"Email"/);
  assert.match(adminLocaleHelpers, /notConfiguredLabel:\s*isKoLocale \?\s*"[^"]+"\s*:\s*"not configured"/);
  assert.match(adminLocaleHelpers, /updatedAtLabel:\s*isKoLocale \?\s*"[^"]+"\s*:\s*"Updated"/);

  assert.match(adminPayrollPanel, /Statutory deductions \(KR baseline\)/);

  assert.match(adminDebugLogsPanel, /Debug Logs/);
  assert.match(adminOnboardingAccountPanels, /Dev and verification settings/);
  assert.match(adminOnboardingSections, /copy\.inviteCoverageTitle/);
  assert.match(adminOnboardingSections, /copy\.inviteCoverageIssueButton/);

  assert.match(employeeChrome, /Employee Portal/);
  assert.match(employeeChrome, /Pending Leave/);
  assert.doesNotMatch(employeeChrome, /\(production\)/);

  assert.match(employeeAccountOverviewPanels, /Refresh My Data/);
  assert.match(employeeRequestFeedbackPanels, /Request search and sort list/);
  assert.match(employeeResubmitPanel, /Resubmit flow checks/);
  assert.match(employeePage, /from "@\/app\/employee\/page-locale-helpers"/);
  assert.match(employeePage, /resolveEmployeeLocaleLabelBundle\(isKoLocale\)/);
  assert.match(employeePage, /EmployeeScheduleSummaryPanel/);
  assert.doesNotMatch(employeePage, /EmployeeAttendanceFormPanel/);
  assert.doesNotMatch(employeePage, /EmployeeLeaveRequestPanel/);
  assert.doesNotMatch(employeePage, /EmployeeLeaveCalendarPanel/);
  assert.match(employeeLocaleHelpers, /success:\s*"Success"/);

  assert.match(workItem, /WI-0310/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0310/i);
}

run()
  .then(() => {
    console.log("e2e-wi0310-locale-dynamic-ui-residual-gap-fix-and-page-decomposition-phase3.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
