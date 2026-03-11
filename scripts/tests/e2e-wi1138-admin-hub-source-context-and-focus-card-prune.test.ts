import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const sourceContext = readUtf8("src", "app", "admin", "source-context.ts");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const queueBadges = readUtf8("src", "app", "admin", "page-queue-badges.ts");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const approvalQueue = readUtf8("src", "app", "admin", "approval-executions", "page-view.tsx");
  const peopleHelpers = readUtf8("src", "app", "admin", "people", "page-deeplink-helpers.ts");
  const peopleView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const contractsHeader = readUtf8("src", "components", "contracts", "AdminContractsWorkspaceHeader.tsx");
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const benefitsWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const noticesWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const recruitmentWorkspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const attendanceLive = readUtf8("src", "components", "admin-attendance-live", "AdminAttendanceLiveDashboard.tsx");
  const leaveCalendar = readUtf8("src", "components", "leave-calendar", "LeaveCalendarConsole.tsx");
  const payrollCloseConsole = readUtf8("src", "components", "payroll-close", "PayrollClosePeriodConsole.tsx");
  const payrollCloseCopy = readUtf8("src", "components", "payroll-close", "copy.ts");
  const payrollDeliveryConsole = readUtf8("src", "components", "payroll-payslip-delivery", "PayrollPayslipDeliveryConsole.tsx");
  const payrollDeliveryCopy = readUtf8("src", "components", "payroll-payslip-delivery", "copy.ts");
  const previewBuilder = readUtf8("src", "app", "admin", "payroll-close", "preview-builder", "page-client.tsx");

  assert.match(sourceContext, /export const ADMIN_HUB_SOURCE = "admin-hub"/);
  assert.match(sourceContext, /normalized === ADMIN_HUB_SOURCE \|\| normalized === ADMIN_DASHBOARD_LEGACY_SOURCE/);
  assert.match(sourceContext, /source=\$\{ADMIN_HUB_SOURCE\}/);

  assert.match(adminPage, /source=\$\{ADMIN_HUB_SOURCE\}/);
  assert.match(adminPage, /withAdminHubSource\(link\.href\)/);
  assert.match(queueBadges, /source=\$\{ADMIN_HUB_SOURCE\}/);
  assert.match(workspaceHubs, /source=\$\{ADMIN_HUB_SOURCE\}/);

  assert.match(approvalQueue, /isAdminHubSource\(source\)/);
  assert.match(approvalQueue, /관리자 허브에서 이동했습니다/);
  assert.match(peopleHelpers, /"admin-dashboard" \| "admin-hub"/);
  assert.match(peopleView, /관리자 허브에서 이동했습니다/);
  assert.match(peopleView, /허브로 돌아가기/);

  assert.match(contractsHeader, /analyticsSource === "admin-hub"/);
  assert.match(contractsCopy, /dashboardSourceBanner: "Opened from admin hub"/);
  assert.match(contractsCopy, /dashboardSourceBanner: "관리자 허브에서 이동했습니다"/);
  assert.match(benefitsWorkspace, /isAdminHubSource\(source\)/);
  assert.match(noticesWorkspace, /isAdminHubSource\(source\)/);
  assert.match(recruitmentWorkspace, /isAdminHubSource\(source\)/);
  assert.match(attendanceLive, /isAdminHubSource\(source\)/);
  assert.match(leaveCalendar, /isAdminHubSource\(source\)/);
  assert.match(payrollCloseConsole, /isAdminHubSource\(source\)/);
  assert.match(payrollCloseCopy, /dashboardSourceBanner: "Opened from admin hub"/);
  assert.match(payrollCloseCopy, /dashboardSourceBanner: "관리자 허브에서 이동했습니다"/);
  assert.match(payrollDeliveryConsole, /isAdminHubSource\(source\)/);
  assert.match(payrollDeliveryCopy, /dashboardSourceBanner: "Opened from admin hub"/);
  assert.match(payrollDeliveryCopy, /dashboardSourceBanner: "관리자 허브에서 이동했습니다"/);
  assert.match(previewBuilder, /isAdminHubSource\(source\)/);
  assert.match(previewBuilder, /관리자 허브 급여 lane에서 이동했습니다/);

  console.log("e2e-wi1138-admin-hub-source-context-and-focus-card-prune.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
