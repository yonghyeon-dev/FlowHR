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
  const employeeSurfaceSources = `${employeePage}\n${employeeAttendanceLeavePanels}\n${employeeAttendanceLeaveFormsPanel}\n${employeeAttendanceFormPanel}\n${employeeLeaveRequestPanel}\n${employeeLeaveCalendarPanel}\n${employeeSchedulePanel}\n${employeeApiLogsPanel}`;
  const employeeLocaleHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0320-employee-locale-dynamic-residual-gap-fix-phase8.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /surfaceCopy/);
  assert.match(employeePage, /const \{ sectionTitles, apiLogs: apiLogsCopy \} = surfaceCopy;/);
  assert.match(
    employeeAttendanceLeaveWorkspaceClient,
    /const \{\s*attendance: attendanceCopy,\s*leave: leaveCopy,\s*leaveCalendar: leaveCalendarCopy,\s*schedule: scheduleCopy,\s*apiLogs: apiLogsCopy,\s*sectionTitles\s*\}\s*=/
  );
  assert.match(employeeSurfaceSources, /\{attendanceCopy\.checkInTime\}/);
  assert.match(employeeSurfaceSources, /\{leaveCopy\.requestUnit\}/);
  assert.match(employeeSurfaceSources, /\{leaveCalendarCopy\.usageRateLabel\}/);
  assert.match(employeeSurfaceSources, /\{scheduleCopy\.devSchedulingCockpit\}/);
  assert.match(employeeSurfaceSources, /\{apiLogsCopy\.runningNow\}/);
  assert.match(employeeSurfaceSources, /\{apiLogsCopy\.summary\(stats\.success, stats\.fail\)\}/);

  assert.match(employeeSurfaceSources, /<h2>\{sectionTitles\.attendance\}<\/h2>/);
  assert.match(employeeSurfaceSources, /<h2>\{sectionTitles\.leave\}<\/h2>/);
  assert.match(employeeSurfaceSources, /<h2>\{sectionTitles\.leaveCalendar\}<\/h2>/);
  assert.match(employeeSurfaceSources, /<h2>\{sectionTitles\.schedule\}<\/h2>/);

  assert.doesNotMatch(employeePage, /\{isKoLocale \? "異쒓렐 ?쒓컖" : "Check-in time"\}/);
  assert.doesNotMatch(employeePage, /\{isKoLocale \? "?닿? ?좏삎" : "Leave type"\}/);
  assert.doesNotMatch(employeePage, /\{isKoLocale \? "?곗감 ?ъ슜瑜? : "Leave usage rate"\}/);
  assert.doesNotMatch(employeePage, /\{isKoLocale \? "?꾩옱 ?ㅽ뻾 以? : "Running now"\}/);

  assert.match(employeeLocaleHelpers, /const EMPLOYEE_SURFACE_COPY_BY_LOCALE =/);
  assert.match(employeeLocaleHelpers, /surfaceCopy: EMPLOYEE_SURFACE_COPY_BY_LOCALE\[localeKey\]/);
  assert.match(employeeLocaleHelpers, /attendance: \{/);
  assert.match(employeeLocaleHelpers, /leaveCalendar: \{/);
  assert.match(employeeLocaleHelpers, /apiLogs: \{/);

  const employeePageLineCount = employeePage.split(/\r?\n/).length;
  assert.ok(
    employeePageLineCount < 2100,
    `expected employee page line count below 2100, got ${employeePageLineCount}`
  );

  assert.match(workItem, /WI-0320/i);
  assert.match(workItem, /locale/i);
  assert.match(workItem, /residual/i);
  assert.match(roadmap, /WI-0320/i);
}

run()
  .then(() => {
    console.log("e2e-wi0320-employee-locale-dynamic-residual-gap-fix-phase8.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
