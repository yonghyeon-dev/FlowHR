import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const queryHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "page-query-prefill-helpers.ts"
  );
  const leavePage = readUtf8("src", "app", "employee", "leave", "page.tsx");
  const leavePageClient = readUtf8(
    "src",
    "app",
    "employee",
    "leave",
    "page-client.tsx"
  );
  const leaveCalendarPage = readUtf8(
    "src",
    "app",
    "employee",
    "leave",
    "calendar",
    "page.tsx"
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
  const requestsWorkspace = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "workspace-content.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1129-employee-leave-calendar-subroute-promotion.md"
  );

  assert.match(queryHelpers, /"leave-calendar": "\/employee\/leave\/calendar"/);
  assert.match(leavePage, /EmployeeLeaveWorkspacePageClient/);
  assert.match(leavePageClient, /window\.location\.hash !== "#leave-calendar"/);
  assert.match(leavePageClient, /router\.replace\(/);
  assert.match(leavePageClient, /\/employee\/leave\/calendar/);
  assert.match(
    leaveCalendarPage,
    /EmployeeLeaveWorkspacePageClient sectionMode="calendar"/
  );
  assert.match(workspaceClient, /sectionMode/);
  assert.match(workspaceClient, /isLeaveCalendarWorkspace/);
  assert.match(shortcuts, /\/employee\/leave\/calendar\?source=employee-dashboard/);
  assert.match(
    requestsWorkspace,
    /\/employee\/leave\/calendar\?source=employee-requests/
  );
  assert.doesNotMatch(shortcuts, /\/employee\/leave\?source=employee-dashboard#leave-calendar/);
  assert.doesNotMatch(
    requestsWorkspace,
    /\/employee\/leave\?source=employee-requests#leave-calendar/
  );
  assert.match(workItem, /서브라우트|subroute|route/i);
}

run();
console.log("e2e-wi1129-employee-leave-calendar-subroute-promotion.test passed");
