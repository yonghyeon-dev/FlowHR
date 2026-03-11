import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const attendancePage = readUtf8(
    "src",
    "app",
    "employee",
    "attendance",
    "page.tsx"
  );
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
  const workItem = readUtf8(
    "work-items",
    "WI-1124-employee-attendance-leave-workspace-extraction.md"
  );

  assert.match(
    attendancePage,
    /EmployeeAttendanceLeaveWorkspaceClient mode="attendance"/
  );
  assert.match(leavePage, /EmployeeLeaveWorkspacePageClient/);
  assert.match(
    leavePageClient,
    /EmployeeAttendanceLeaveWorkspaceClient[\s\S]*mode="leave"/
  );
  assert.doesNotMatch(attendancePage, /EmployeeSelfServicePage/);
  assert.doesNotMatch(leavePage, /EmployeeSelfServicePage/);
  assert.match(workspaceClient, /buildEmployeeMutationRuntime/);
  assert.match(workspaceClient, /useEmployeeDashboardDerivedState/);
  assert.match(workspaceClient, /useEmployeeRequestChecklistDerivedState/);
  assert.match(workspaceClient, /EmployeeWorkspaceHero/);
  assert.match(workspaceClient, /EmployeeAttendanceFormPanel/);
  assert.match(workspaceClient, /EmployeeLeaveRequestPanel/);
  assert.match(workspaceClient, /EmployeeLeaveCalendarPanel/);
  assert.match(workItem, /workspace/i);
}

run();
console.log("e2e-wi1124-employee-attendance-leave-workspace-extraction.test passed");
