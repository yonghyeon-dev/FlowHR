import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
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
  const employeeSectionSources = `${employeePage}\n${employeeAttendanceLeavePanels}\n${employeeAttendanceLeaveFormsPanel}\n${employeeAttendanceFormPanel}\n${employeeLeaveRequestPanel}\n${employeeLeaveCalendarPanel}\n${employeeSchedulePanel}\n${employeeApiLogsPanel}`;
  const localeHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0327-employee-locale-section-title-copy-split-phase11.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(localeHelpers, /sectionTitles: \{/);
  assert.match(localeHelpers, /attendance: "Attendance"/);
  assert.match(localeHelpers, /leave: "Leave"/);
  assert.match(localeHelpers, /leaveCalendar: "Leave calendar"/);
  assert.match(localeHelpers, /schedule: "Work schedule"/);
  assert.match(localeHelpers, /apiLogs: "API execution logs"/);

  assert.match(employeePage, /\bsectionTitles,/);
  assert.match(employeeSectionSources, /<h2>\{sectionTitles\.attendance\}<\/h2>/);
  assert.match(employeeSectionSources, /<h2>\{sectionTitles\.leave\}<\/h2>/);
  assert.match(employeeSectionSources, /<h2>\{sectionTitles\.leaveCalendar\}<\/h2>/);
  assert.match(employeeSectionSources, /<h2>\{sectionTitles\.schedule\}<\/h2>/);
  assert.match(employeeSectionSources, /<h2>\{sectionTitles\.apiLogs\}<\/h2>/);
  assert.doesNotMatch(employeeSectionSources, /<h2>\{isKoLocale \?/);

  assert.match(workItem, /WI-0327/i);
  assert.match(workItem, /section title copy split|locale/i);
  assert.match(roadmap, /WI-0327/i);
}

run()
  .then(() => {
    console.log("e2e-wi0327-employee-locale-section-title-copy-split-phase11.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
