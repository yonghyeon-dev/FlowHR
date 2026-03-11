import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const queryHelpers = readUtf8("src", "app", "employee", "page-query-prefill-helpers.ts");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const attendancePage = readUtf8("src", "app", "employee", "attendance", "page.tsx");
  const leavePage = readUtf8("src", "app", "employee", "leave", "page.tsx");
  const leavePageClient = readUtf8(
    "src",
    "app",
    "employee",
    "leave",
    "page-client.tsx"
  );
  const workspaceClient = readUtf8(
    "src",
    "app",
    "employee",
    "attendance-leave-workspace-client.tsx"
  );
  const shortcuts = readUtf8(
    "src",
    "components",
    "employee-self-service",
    "EmployeeJourneyShortcutPanel.tsx"
  );
  const workspaceHubs = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "workspace-hubs.ts"
  );
  const scheduleBoard = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1119-employee-attendance-leave-route-promotion.md"
  );

  assert.match(queryHelpers, /attendance: "\/employee\/attendance#attendance"/);
  assert.match(queryHelpers, /leave: "\/employee\/leave#leave"/);
  assert.match(queryHelpers, /"leave-calendar": "\/employee\/leave\/calendar"/);
  assert.doesNotMatch(employeePage, /mode === "attendance"/);
  assert.doesNotMatch(employeePage, /mode === "leave"/);
  assert.doesNotMatch(employeePage, /EmployeeWorkspaceHero/);
  assert.doesNotMatch(employeePage, /<EmployeeAttendanceLeavePanels/);
  assert.match(
    attendancePage,
    /EmployeeAttendanceLeaveWorkspaceClient mode="attendance"/
  );
  assert.match(leavePage, /EmployeeLeaveWorkspacePageClient/);
  assert.match(
    leavePageClient,
    /EmployeeAttendanceLeaveWorkspaceClient[\s\S]*mode="leave"/
  );
  assert.match(workspaceClient, /EmployeeAttendanceFormPanel/);
  assert.match(workspaceClient, /EmployeeLeaveRequestPanel/);
  assert.match(employeeLayout, /\/employee\/attendance/);
  assert.match(employeeLayout, /\/employee\/leave/);
  assert.match(shortcuts, /\/employee\/attendance\?source=employee-dashboard/);
  assert.match(shortcuts, /\/employee\/leave\/calendar\?source=employee-dashboard/);
  assert.match(workspaceHubs, /\/employee\/attendance\?source=employee-dashboard/);
  assert.match(workspaceHubs, /\/employee\/leave\?source=employee-dashboard/);
  assert.match(scheduleBoard, /\/employee\/attendance\?source=employee-schedule&attendanceSource=schedule/);
  assert.match(workItem, /route/i);
}

run();
console.log("e2e-wi1119-employee-attendance-leave-route-promotion.test passed");
