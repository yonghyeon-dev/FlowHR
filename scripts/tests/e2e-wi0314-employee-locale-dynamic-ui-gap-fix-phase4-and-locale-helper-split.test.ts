import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeAttendanceLeaveWorkspaceClient = readUtf8(
    "src",
    "app",
    "employee",
    "attendance-leave-workspace-client.tsx"
  );
  const employeeHelpers = readUtf8("src", "app", "employee", "page-helpers.ts");
  const employeeLocaleHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
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
  const employeeLeaveCalendarPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeLeaveCalendarPanel.tsx"
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
  const employeeSurfaceSources = `${employeePage}\n${employeeAttendanceLeavePanels}\n${employeeAttendanceLeaveFormsPanel}\n${employeeAttendanceFormPanel}\n${employeeLeaveRequestPanel}\n${employeeLeaveCalendarPanel}\n${employeeSchedulePanel}\n${employeeScheduleSummaryPanel}`;
  const employeeLocaleSources = `${employeePage}\n${employeeHelpers}`;
  const workItem = readUtf8(
    "work-items",
    "WI-0314-employee-locale-dynamic-ui-gap-fix-phase4-and-locale-helper-split.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-locale-helpers"/);
  assert.match(
    employeeAttendanceLeaveWorkspaceClient,
    /from "@\/components\/employee-dashboard\/EmployeeAttendanceFormPanel"/
  );
  assert.match(
    employeeAttendanceLeaveWorkspaceClient,
    /from "@\/components\/employee-dashboard\/EmployeeLeaveRequestPanel"/
  );
  assert.match(
    employeePage,
    /from "@\/components\/employee-dashboard\/EmployeeScheduleSummaryPanel"/
  );
  assert.match(employeePage, /resolveEmployeeLocaleLabelBundle\(isKoLocale\)/);
  assert.match(employeePage, /isDefaultEmployeeCancelReason\(previous\)/);
  assert.match(employeePage, /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL \?\? notConfiguredLabel;/);
  assert.match(employeeLocaleSources, /toLocaleString\(runtimeLocale\)/);
  assert.match(employeeSurfaceSources, /attendanceNotePresets\.map\(\(preset\) => \(/);
  assert.match(employeeSurfaceSources, /leaveCalendarWeekdays\.map\(\(weekday\) => \(/);

  assert.match(employeeSurfaceSources, /<h2>\{sectionTitles\.attendance\}<\/h2>/);
  assert.match(employeeSurfaceSources, /<h2>\{sectionTitles\.leave\}<\/h2>/);
  assert.match(employeeSurfaceSources, /<h2>\{sectionTitles\.leaveCalendar\}<\/h2>/);
  assert.match(employeeSurfaceSources, /<h2>\{sectionTitles\.schedule\}<\/h2>/);
  assert.match(employeeScheduleSummaryPanel, /\/employee\/schedule\?source=employee-dashboard/);

  assert.doesNotMatch(employeePage, /const LEAVE_CALENDAR_WEEKDAYS =/);
  assert.doesNotMatch(employeePage, /const ATTENDANCE_NOTE_PRESETS =/);
  assert.doesNotMatch(employeePage, /toLocaleString\("ko-KR"\)/);
  assert.doesNotMatch(employeePage, /from "@\/components\/employee-dashboard\/EmployeeAttendanceFormPanel"/);
  assert.doesNotMatch(employeePage, /from "@\/components\/employee-dashboard\/EmployeeLeaveRequestPanel"/);

  assert.match(employeeLocaleHelpers, /export function resolveEmployeeLocaleLabelBundle\(isKoLocale: boolean\)/);
  assert.match(employeeLocaleHelpers, /export function isDefaultEmployeeCancelReason\(reason: string\)/);
  assert.match(employeeLocaleHelpers, /export function formatEmployeeDeltaMinutes\(/);
  assert.match(employeeLocaleHelpers, /export function extractEmployeeErrorMessage\(/);
  assert.match(employeeLocaleHelpers, /leaveCalendarWeekdays: LEAVE_CALENDAR_WEEKDAYS_BY_LOCALE\[localeKey\]/);
  assert.match(employeeLocaleHelpers, /attendanceNotePresets: ATTENDANCE_NOTE_PRESETS_BY_LOCALE\[localeKey\]/);
  assert.match(employeeLocaleHelpers, /sectionTitles: \{/);
  assert.match(employeeLocaleHelpers, /checkOutNow: isKoLocale \? ".*" : "Check-out now"/);
  assert.match(employeeLocaleHelpers, /ko:\s*\[[^\]]+\]/);
  assert.match(employeeLocaleHelpers, /en: \["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"\]/);

  assert.match(workItem, /WI-0314/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0314/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0314-employee-locale-dynamic-ui-gap-fix-phase4-and-locale-helper-split.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
