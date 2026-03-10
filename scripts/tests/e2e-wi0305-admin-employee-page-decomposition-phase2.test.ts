import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminNavSource = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeRequestsPageClient = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "page-client.tsx"
  );

  const adminChrome = readUtf8("src", "components", "admin-dashboard", "AdminDashboardChrome.tsx");
  const adminOnboardingAccountPanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminOnboardingAccountPanels.tsx"
  );
  const adminPeopleInvitePanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminPeopleInvitePanels.tsx"
  );
  const adminSchedulingPanel = readUtf8("src", "components", "admin-dashboard", "AdminSchedulingPanel.tsx");
  const adminAggregateLeavePanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminAggregateLeavePanels.tsx"
  );
  const adminPayrollPanel = readUtf8("src", "components", "admin-dashboard", "AdminPayrollPanel.tsx");
  const adminCompensationPanels = readUtf8("src", "app", "admin", "page-compensation-panels.tsx");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");

  const employeeChrome = readUtf8("src", "components", "employee-dashboard", "EmployeeDashboardChrome.tsx");
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
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

  const workItem = readUtf8("work-items", "WI-0305-admin-employee-page-decomposition-phase2.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(adminPage, /from "@\/components\/admin-dashboard\/AdminDashboardChrome"/);
  assert.doesNotMatch(adminPage, /from "@\/app\/admin\/page-panels"/);
  assert.doesNotMatch(adminPage, /<AdminDashboardChrome/);
  assert.doesNotMatch(adminPage, /<AdminDashboardPanels/);
  assert.match(adminPage, /buildAdminDashboardEntryLinks/);
  assert.match(adminPage, /dashboardEntryLinks\.map/);
  assert.match(adminPage, /href="\/admin\/approval-executions"/);
  assert.match(adminNavSource, /\/admin\/people"/);
  assert.match(adminNavSource, /\/admin\/attendance-live"/);
  assert.match(adminNavSource, /\/admin\/payroll-close"/);

  assert.match(adminChrome, /export function AdminDashboardChrome/);
  assert.match(adminOnboardingAccountPanels, /id="onboarding"/);
  assert.match(adminPeopleInvitePanels, /id="people"/);
  assert.match(adminPeopleInvitePanels, /id="invites"/);
  assert.match(adminSchedulingPanel, /id="scheduling"/);
  assert.match(adminPanels, /from "@\/components\/admin-dashboard\/AdminOnboardingAccountPanels"/);
  assert.match(adminPanels, /from "@\/components\/admin-dashboard\/AdminPeopleInvitePanels"/);
  assert.match(adminPanels, /from "@\/components\/admin-dashboard\/AdminSchedulingPanel"/);
  assert.match(adminPanels, /from "@\/app\/admin\/page-compensation-panels"/);
  assert.match(adminPanels, /<AdminOnboardingAccountPanels/);
  assert.match(adminPanels, /<AdminPeopleInvitePanels/);
  assert.match(adminPanels, /<AdminSchedulingPanel/);
  assert.match(adminPanels, /<AdminCompensationPanels/);
  assert.match(adminAggregateLeavePanels, /id="aggregates"/);
  assert.match(adminAggregateLeavePanels, /id="leave-policy"/);
  assert.match(adminPayrollPanel, /id="payroll"/);
  assert.match(adminCompensationPanels, /from "@\/components\/admin-dashboard\/AdminAggregateLeavePanels"/);
  assert.match(adminCompensationPanels, /from "@\/components\/admin-dashboard\/AdminPayrollPanel"/);
  assert.match(adminCompensationPanels, /<AdminAggregateLeavePanels/);
  assert.match(adminCompensationPanels, /<AdminPayrollPanel/);

  assert.match(employeePage, /from "@\/components\/employee-dashboard\/EmployeeDashboardChrome"/);
  assert.match(employeePage, /from "@\/components\/employee-dashboard\/EmployeeAccountOverviewPanels"/);
  assert.match(employeePage, /<EmployeeDashboardChrome/);
  assert.match(employeePage, /<EmployeeAccountOverviewPanels/);
  assert.match(employeePage, /resolveEmployeeRequestsRouteForFocusSection/);
  assert.match(employeePage, /resolveEmployeeResubmitDraftPrefill/);
  assert.doesNotMatch(employeePage, /<article className="panel panel-request-feedback" id="request-feedback">/);
  assert.doesNotMatch(employeePage, /<article className="panel panel-request-resubmit" id="request-resubmit">/);
  assert.doesNotMatch(employeePage, /<EmployeeRequestFeedbackPanels/);
  assert.doesNotMatch(employeePage, /<EmployeeResubmitPanel/);

  assert.match(employeeChrome, /export function EmployeeDashboardChrome/);
  assert.match(employeeAccountOverviewPanels, /id="account"/);
  assert.match(employeeAccountOverviewPanels, /id="self-service-overview"/);
  assert.match(employeeAccountOverviewPanels, /id="submit-checklist"/);
  assert.match(employeeRequestsPageClient, /from "@\/components\/employee-dashboard\/EmployeeRequestFeedbackPanels"/);
  assert.match(employeeRequestsPageClient, /from "@\/components\/employee-dashboard\/EmployeeRequestsResubmitWorkspacePanel"/);
  assert.match(employeeRequestFeedbackPanels, /id="request-feedback"/);
  assert.match(employeeRequestFeedbackPanels, /id="request-search-sort"/);
  assert.match(employeeRequestFeedbackPanels, /id="request-timeline"/);
  assert.match(employeeRequestFeedbackPanels, /Math\.round\(row\.pendingHours\)/);
  assert.match(employeeResubmitPanel, /id="request-resubmit"/);

  assert.match(workItem, /WI-0305/i);
  assert.match(workItem, /decomposition/i);
  assert.match(roadmap, /WI-0305/i);
}

run()
  .then(() => {
    console.log("e2e-wi0305-admin-employee-page-decomposition-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
