import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const requestsPage = readUtf8("src", "app", "employee", "requests", "page.tsx");
  const requestsWorkspaceContent = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "workspace-content.tsx"
  );
  const attendanceLeaveWorkspaceClient = readUtf8(
    "src",
    "app",
    "employee",
    "attendance-leave-workspace-client.tsx"
  );
  const sourceContext = readUtf8(
    "src",
    "components",
    "scheduling",
    "employee-source-context.ts"
  );
  const scheduleBoard = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const accountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workspaceHubs = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "workspace-hubs.ts"
  );
  const shortcuts = readUtf8(
    "src",
    "components",
    "employee-self-service",
    "EmployeeJourneyShortcutPanel.tsx"
  );
  const guidePage = readUtf8("src", "app", "employee", "guide", "page.tsx");
  const guideCopy = readUtf8("src", "components", "employee-guide", "copy.ts");
  const scheduleSummaryPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeScheduleSummaryPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1121-employee-workspace-hero-alignment.md"
  );

  assert.doesNotMatch(employeePage, /EmployeeWorkspaceHero/);
  assert.match(requestsPage, /EmployeeRequestsWorkspaceContent/);
  assert.match(requestsWorkspaceContent, /EmployeeWorkspaceHero/);
  assert.match(attendanceLeaveWorkspaceClient, /EmployeeWorkspaceHero/);
  assert.match(scheduleBoard, /EmployeeWorkspaceHero/);
  assert.match(sourceContext, /employee-dashboard/);
  assert.match(sourceContext, /employee-requests/);
  assert.match(sourceContext, /employee-guide/);
  assert.match(sourceContext, /employee-schedule/);
  assert.match(scheduleBoard, /source=employee-schedule&attendanceSource=schedule/);
  assert.match(
    accountOverviewPanels,
    /\/employee\/attendance\?source=employee-dashboard/
  );
  assert.match(accountOverviewPanels, /\/employee\/leave\?source=employee-dashboard/);
  assert.match(
    accountOverviewPanels,
    /\/employee\/requests\/monitoring\?source=employee-dashboard/
  );
  assert.match(
    accountOverviewPanels,
    /\/employee\/requests\/resubmit\?source=employee-dashboard/
  );
  assert.match(workspaceHubs, /\/employee\/attendance\?source=employee-dashboard/);
  assert.match(
    shortcuts,
    /\/employee\/requests\/monitoring\?source=employee-dashboard/
  );
  assert.match(guidePage, /\/employee\/requests\?source=employee-guide/);
  assert.match(guideCopy, /\/employee\/attendance\?source=employee-guide/);
  assert.match(scheduleSummaryPanel, /\/employee\/attendance\?source=employee-dashboard/);
  assert.match(workItem, /source/i);
}

run();
console.log("e2e-wi1121-employee-workspace-hero-alignment.test passed");
