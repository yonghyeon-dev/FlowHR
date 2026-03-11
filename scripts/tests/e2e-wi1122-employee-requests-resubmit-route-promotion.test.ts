import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const requestsClient = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "page-client.tsx"
  );
  const attendancePage = readUtf8(
    "src",
    "app",
    "employee",
    "attendance",
    "page.tsx"
  );
  const leavePage = readUtf8(
    "src",
    "app",
    "employee",
    "leave",
    "page.tsx"
  );
  const leavePageClient = readUtf8(
    "src",
    "app",
    "employee",
    "leave",
    "page-client.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1122-employee-requests-resubmit-route-promotion.md"
  );

  assert.match(
    requestsClient,
    /candidate\.channel === "attendance"\s*\?\s*"\/employee\/attendance\/correction"\s*:\s*"\/employee\/leave\/request"/
  );
  assert.match(
    requestsClient,
    /source=employee-requests&resubmitChannel=/
  );
  assert.doesNotMatch(
    requestsClient,
    /\/employee\?focus=/
  );
  assert.match(
    attendancePage,
    /EmployeeAttendanceWorkspacePageClient/
  );
  assert.match(leavePage, /EmployeeLeaveWorkspacePageClient/);
  assert.match(
    leavePageClient,
    /EmployeeAttendanceLeaveWorkspaceClient[\s\S]*mode="leave"/
  );
  assert.match(workItem, /route/i);
}

run();
console.log("e2e-wi1122-employee-requests-resubmit-route-promotion.test passed");
