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
  const attendancePage = readUtf8(
    "src",
    "app",
    "employee",
    "attendance",
    "page.tsx"
  );
  const attendancePageClient = readUtf8(
    "src",
    "app",
    "employee",
    "attendance",
    "page-client.tsx"
  );
  const attendanceCorrectionPage = readUtf8(
    "src",
    "app",
    "employee",
    "attendance",
    "correction",
    "page.tsx"
  );
  const leavePageClient = readUtf8(
    "src",
    "app",
    "employee",
    "leave",
    "page-client.tsx"
  );
  const leaveRequestPage = readUtf8(
    "src",
    "app",
    "employee",
    "leave",
    "request",
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
  const workspaceHubs = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "workspace-hubs.ts"
  );
  const overviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const requestsWorkspace = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "workspace-content.tsx"
  );
  const scheduleBoardView = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const scheduleSummary = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeScheduleSummaryPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1130-employee-attendance-leave-primary-subroute-promotion.md"
  );

  assert.match(queryHelpers, /attendance: "\/employee\/attendance\/correction"/);
  assert.match(queryHelpers, /leave: "\/employee\/leave\/request"/);
  assert.match(attendancePage, /EmployeeAttendanceWorkspacePageClient/);
  assert.match(attendancePageClient, /window\.location\.hash !== "#attendance"/);
  assert.match(attendancePageClient, /\/employee\/attendance\/correction/);
  assert.match(attendanceCorrectionPage, /sectionMode="correction"/);
  assert.match(leavePageClient, /window\.location\.hash !== "#leave"/);
  assert.match(leavePageClient, /\/employee\/leave\/request/);
  assert.match(leaveRequestPage, /sectionMode="request"/);
  assert.match(workspaceClient, /sectionMode === "correction"/);
  assert.match(workspaceClient, /sectionMode === "request"/);
  assert.match(shortcuts, /\/employee\/attendance\/correction\?source=employee-dashboard/);
  assert.match(shortcuts, /\/employee\/leave\/request\?source=employee-dashboard/);
  assert.match(workspaceHubs, /\/employee\/attendance\/correction\?source=employee-dashboard/);
  assert.match(workspaceHubs, /\/employee\/leave\/request\?source=employee-dashboard/);
  assert.match(overviewPanels, /\/employee\/attendance\/correction\?source=employee-dashboard/);
  assert.match(overviewPanels, /\/employee\/leave\/request\?source=employee-dashboard/);
  assert.match(requestsWorkspace, /\/employee\/attendance\/correction\?source=employee-requests/);
  assert.match(requestsWorkspace, /\/employee\/leave\/request\?source=employee-requests/);
  assert.match(
    scheduleBoardView,
    /\/employee\/attendance\/correction\?source=employee-schedule&attendanceSource=schedule/
  );
  assert.match(
    scheduleSummary,
    /\/employee\/attendance\/correction\?source=employee-dashboard/
  );
  assert.match(workItem, /서브라우트/);
}

run();
console.log(
  "e2e-wi1130-employee-attendance-leave-primary-subroute-promotion.test passed"
);
