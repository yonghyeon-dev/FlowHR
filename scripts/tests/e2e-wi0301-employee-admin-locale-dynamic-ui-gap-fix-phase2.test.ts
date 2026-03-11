import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeRequestFeedbackPanels = readUtf8("src", "components", "employee-dashboard", "EmployeeRequestFeedbackPanels.tsx");
  const employeeAttendanceLeavePanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAttendanceLeavePanels.tsx"
  );
  const employeeAttendanceLeaveFormsPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAttendanceLeaveFormsPanel.tsx"
  );
  const employeeAttendanceFormPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAttendanceFormPanel.tsx"
  );
  const employeeLeaveRequestPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeLeaveRequestPanel.tsx"
  );
  const employeeScheduleSummaryPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeScheduleSummaryPanel.tsx"
  );
  const employeeSchedulePanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeSchedulePanel.tsx"
  );
  const employeeApiLogsPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeApiLogsPanel.tsx"
  );
  const employeeResubmitPanel = readUtf8("src", "components", "employee-dashboard", "EmployeeResubmitPanel.tsx");
  const employeeTypes = readUtf8("src", "app", "employee", "page-types.ts");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const adminOnboardingDashboard = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const adminOnboardingSections = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const workItem = readUtf8("work-items", "WI-0301-employee-admin-locale-dynamic-ui-gap-fix-phase2.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /const \{ locale \} = useI18n\(\);/);
  assert.match(employeePage, /from "@\/app\/employee\/page-locale-helpers"/);
  assert.match(employeePage, /resolveEmployeeLocaleLabelBundle\(isKoLocale\)/);
  assert.match(employeePage, /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL \?\? notConfiguredLabel;/);
  assert.match(employeePage, /const toLeaveTypeLabel = useCallback\(/);
  assert.doesNotMatch(employeePage, /EmployeeAttendanceFormPanel/);
  assert.doesNotMatch(employeePage, /EmployeeLeaveRequestPanel/);
  assert.match(employeePage, /EmployeeScheduleSummaryPanel/);

  assert.match(employeeRequestFeedbackPanels, /\{toRequestStatusLabel\(row\.status\)\}/);
  assert.match(employeeRequestFeedbackPanels, /\{toRequestStatusLabel\(item\.status\)\}/);
  assert.match(employeeAttendanceFormPanel, /\{toRequestStatusLabel\(record\.state\)\}/);
  assert.match(employeeLeaveRequestPanel, /\{toRequestStatusLabel\(request\.state\)\}/);
  assert.match(employeeScheduleSummaryPanel, /\/employee\/schedule\?source=employee-dashboard/);
  assert.match(employeeSchedulePanel, /\{listBadgeLabels\.empty\}/);
  assert.match(employeeResubmitPanel, /\{listBadgeLabels\.applied\}/);
  assert.match(
    employeeSchedulePanel,
    /\{schedule\.isHoliday \? listBadgeLabels\.holiday : listBadgeLabels\.work\}/
  );
  assert.match(
    employeeApiLogsPanel,
    /\{log\.ok \? listBadgeLabels\.success : listBadgeLabels\.fail\}/
  );
  assert.match(employeeAttendanceFormPanel, /attendanceNotePresets\.map\(\(preset\) => \(/);

  assert.doesNotMatch(employeePage, /const requestStatusLabels = useMemo\(/);
  assert.doesNotMatch(employeePage, /const listBadgeLabels = useMemo\(/);
  assert.doesNotMatch(employeePage, />EMPTY</);
  assert.doesNotMatch(employeePage, />APPLIED</);
  assert.doesNotMatch(employeePage, /schedule\.isHoliday \? "HOLIDAY" : "WORK"/);
  assert.doesNotMatch(employeePage, /log\.ok \? "OK" : "FAIL"/);
  assert.doesNotMatch(employeePage, /check\.pass \? "PASS" : "FAIL"/);

  assert.match(
    employeeTypes,
    /status: "PENDING" \| "APPROVED" \| "REJECTED" \| "CANCELED";/
  );

  assert.doesNotMatch(adminPage, /from "@\/app\/admin\/page-locale-helpers"/);
  assert.match(adminPanels, /ADMIN_DASHBOARD_PANELS_RETIRED_WI_1136/);
  assert.match(adminOnboardingDashboard, /inviteEligibleEmployeeCount=\{data\.inviteEligibleEmployeeCount\}/);
  assert.match(adminOnboardingDashboard, /pendingInviteCount=\{data\.pendingInviteCount\}/);
  assert.match(adminOnboardingSections, /copy\.inviteCoverageEligibleLabel/);
  assert.match(adminOnboardingSections, /copy\.inviteCoverageSentLabel/);
  assert.match(adminOnboardingSections, /copy\.inviteCoveragePendingLabel/);

  assert.match(workItem, /WI-0301/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0301/i);
}

run()
  .then(() => {
    console.log("e2e-wi0301-employee-admin-locale-dynamic-ui-gap-fix-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
