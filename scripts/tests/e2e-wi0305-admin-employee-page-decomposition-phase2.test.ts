import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");

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

  assert.match(adminPage, /from "@\/components\/admin-dashboard\/AdminDashboardChrome"/);
  assert.match(adminPage, /from "@\/components\/admin-dashboard\/AdminOnboardingAccountPanels"/);
  assert.match(adminPage, /from "@\/components\/admin-dashboard\/AdminPeopleInvitePanels"/);
  assert.match(adminPage, /from "@\/components\/admin-dashboard\/AdminSchedulingPanel"/);
  assert.match(adminPage, /from "@\/app\/admin\/page-compensation-panels"/);
  assert.match(adminPage, /<AdminDashboardChrome/);
  assert.match(adminPage, /<AdminOnboardingAccountPanels/);
  assert.match(adminPage, /<AdminPeopleInvitePanels/);
  assert.match(adminPage, /<AdminSchedulingPanel/);
  assert.match(adminPage, /<AdminCompensationPanels/);
  assert.doesNotMatch(adminPage, /<article className="panel" id="onboarding">/);
  assert.doesNotMatch(adminPage, /<article className="panel" id="payroll">/);

  assert.match(adminChrome, /export function AdminDashboardChrome/);
  assert.match(adminOnboardingAccountPanels, /id="onboarding"/);
  assert.match(adminPeopleInvitePanels, /id="people"/);
  assert.match(adminPeopleInvitePanels, /id="invites"/);
  assert.match(adminSchedulingPanel, /id="scheduling"/);
  assert.match(adminAggregateLeavePanels, /id="aggregates"/);
  assert.match(adminAggregateLeavePanels, /id="leave-policy"/);
  assert.match(adminPayrollPanel, /id="payroll"/);
  assert.match(adminCompensationPanels, /from "@\/components\/admin-dashboard\/AdminAggregateLeavePanels"/);
  assert.match(adminCompensationPanels, /from "@\/components\/admin-dashboard\/AdminPayrollPanel"/);
  assert.match(adminCompensationPanels, /<AdminAggregateLeavePanels/);
  assert.match(adminCompensationPanels, /<AdminPayrollPanel/);

  assert.match(employeePage, /from "@\/components\/employee-dashboard\/EmployeeDashboardChrome"/);
  assert.match(employeePage, /from "@\/components\/employee-dashboard\/EmployeeAccountOverviewPanels"/);
  assert.match(employeePage, /from "@\/components\/employee-dashboard\/EmployeeRequestFeedbackPanels"/);
  assert.match(employeePage, /from "@\/components\/employee-dashboard\/EmployeeResubmitPanel"/);
  assert.match(employeePage, /<EmployeeDashboardChrome/);
  assert.match(employeePage, /<EmployeeAccountOverviewPanels/);
  assert.match(employeePage, /<EmployeeRequestFeedbackPanels/);
  assert.match(employeePage, /<EmployeeResubmitPanel/);
  assert.doesNotMatch(employeePage, /<article className="panel panel-request-feedback" id="request-feedback">/);
  assert.doesNotMatch(employeePage, /<article className="panel panel-request-resubmit" id="request-resubmit">/);

  assert.match(employeeChrome, /export function EmployeeDashboardChrome/);
  assert.match(employeeAccountOverviewPanels, /id="account"/);
  assert.match(employeeAccountOverviewPanels, /id="self-service-overview"/);
  assert.match(employeeAccountOverviewPanels, /id="submit-checklist"/);
  assert.match(employeeRequestFeedbackPanels, /id="request-feedback"/);
  assert.match(employeeRequestFeedbackPanels, /id="request-search-sort"/);
  assert.match(employeeRequestFeedbackPanels, /id="request-timeline"/);
  assert.match(employeeRequestFeedbackPanels, /대기 \$\{Math\.round\(row\.pendingHours\)\}시간/);
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
