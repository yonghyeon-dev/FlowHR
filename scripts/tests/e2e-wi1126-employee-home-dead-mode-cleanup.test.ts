import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const apiLogsPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeApiLogsPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1126-employee-home-dead-mode-cleanup.md"
  );

  assert.doesNotMatch(employeePage, /useApplyAttendanceSchedulePrefillEffect/);
  assert.doesNotMatch(employeePage, /mode === "attendance"/);
  assert.doesNotMatch(employeePage, /mode === "leave"/);
  assert.doesNotMatch(employeePage, /EmployeeWorkspaceHero/);
  assert.doesNotMatch(employeePage, /EmployeeAttendanceFormPanel/);
  assert.doesNotMatch(employeePage, /EmployeeLeaveRequestPanel/);
  assert.doesNotMatch(employeePage, /EmployeeLeaveCalendarPanel/);
  assert.match(employeePage, /<EmployeeAccountOverviewPanels/);
  assert.match(employeePage, /<EmployeeScheduleSummaryPanel/);
  assert.match(employeePage, /showDevTools \? <EmployeeApiLogsPanel/);
  assert.match(employeePage, /return <EmployeeSelfServicePage \/>;/);
  assert.match(apiLogsPanel, /type EmployeeApiLogsPanelProps = Pick</);
  assert.match(workItem, /dead mode|home|cleanup|route/i);
}

run();
console.log("e2e-wi1126-employee-home-dead-mode-cleanup.test passed");
