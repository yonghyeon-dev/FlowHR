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
  const employeeResubmitPanel = readUtf8("src", "components", "employee-dashboard", "EmployeeResubmitPanel.tsx");
  const employeeTypes = readUtf8("src", "app", "employee", "page-types.ts");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const adminPeopleInvitePanels = readUtf8("src", "components", "admin-dashboard", "AdminPeopleInvitePanels.tsx");
  const workItem = readUtf8("work-items", "WI-0301-employee-admin-locale-dynamic-ui-gap-fix-phase2.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /const \{ locale \} = useI18n\(\);/);
  assert.match(employeePage, /from "@\/app\/employee\/page-locale-helpers"/);
  assert.match(
    employeePage,
    /const localeLabelBundle = useMemo\(\(\) => resolveEmployeeLocaleLabelBundle\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.match(employeePage, /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL \?\? notConfiguredLabel;/);
  assert.match(employeePage, /const toRequestStatusLabel = useCallback\(/);
  assert.match(employeePage, /const toLeaveTypeLabel = useCallback\(/);
  assert.match(employeePage, /<EmployeeAttendanceLeavePanels/);

  assert.match(employeeRequestFeedbackPanels, /\{toRequestStatusLabel\(row\.status\)\}/);
  assert.match(employeeRequestFeedbackPanels, /\{toRequestStatusLabel\(item\.status\)\}/);
  assert.match(employeeAttendanceLeaveFormsPanel, /\{toRequestStatusLabel\(record\.state\)\}/);
  assert.match(employeeAttendanceLeaveFormsPanel, /\{toRequestStatusLabel\(request\.state\)\}/);
  assert.match(employeeAttendanceLeavePanels, /\{listBadgeLabels\.empty\}/);
  assert.match(employeeResubmitPanel, /\{listBadgeLabels\.applied\}/);
  assert.match(
    employeeAttendanceLeavePanels,
    /\{schedule\.isHoliday \? listBadgeLabels\.holiday : listBadgeLabels\.work\}/
  );
  assert.match(
    employeeAttendanceLeavePanels,
    /\{log\.ok \? listBadgeLabels\.success : listBadgeLabels\.fail\}/
  );
  assert.match(employeeAttendanceLeaveFormsPanel, /attendanceNotePresets\.map\(\(preset\) => \(/);

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
  assert.match(adminPanels, /from "@\/app\/admin\/page-locale-helpers"/);
  assert.match(
    adminPanels,
    /workTypeLabels/
  );
  assert.match(adminPanels, /const toInviteRoleLabel = \(role: string\) =>/);
  assert.match(adminPanels, /const toInviteDeliveryModeLabel = \(mode: string\) =>/);

  assert.match(adminPeopleInvitePanels, /<option value="employee">\{inviteRoleLabels\.employee\}<\/option>/);
  assert.match(adminPeopleInvitePanels, /<option value="manager">\{inviteRoleLabels\.manager\}<\/option>/);
  assert.match(adminPeopleInvitePanels, /<option value="admin">\{inviteRoleLabels\.admin\}<\/option>/);
  assert.match(adminPeopleInvitePanels, /<option value="link">\{inviteDeliveryModeLabels\.link\}<\/option>/);
  assert.match(adminPeopleInvitePanels, /<option value="email">\{inviteDeliveryModeLabels\.email\}<\/option>/);

  assert.doesNotMatch(adminPeopleInvitePanels, /<option value="employee">employee<\/option>/);
  assert.doesNotMatch(adminPeopleInvitePanels, /<option value="manager">manager<\/option>/);
  assert.doesNotMatch(adminPeopleInvitePanels, /<option value="admin">admin<\/option>/);
  assert.doesNotMatch(adminPeopleInvitePanels, /<option value="link">link<\/option>/);
  assert.doesNotMatch(adminPeopleInvitePanels, /<option value="email">email<\/option>/);

  assert.match(adminPeopleInvitePanels, /role=\s*\{toInviteRoleLabel\(inviteResult\.role\)\}/);
  assert.match(adminPeopleInvitePanels, /delivery=\s*\{toInviteDeliveryModeLabel\(inviteResult\.deliveryMode\)\}/);

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
