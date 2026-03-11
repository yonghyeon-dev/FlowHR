import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const homePage = readUtf8("src", "app", "employee", "page.tsx");
  const queryHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "page-query-prefill-helpers.ts"
  );
  const requestsPage = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "page.tsx"
  );
  const requestsClient = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "page-client.tsx"
  );
  const shortcuts = readUtf8(
    "src",
    "components",
    "employee-self-service",
    "EmployeeJourneyShortcutPanel.tsx"
  );
  const accountPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1118-employee-requests-workspace-extraction.md"
  );

  assert.doesNotMatch(homePage, /<EmployeeRequestFeedbackPanels/);
  assert.doesNotMatch(homePage, /<EmployeeResubmitPanel/);
  assert.match(homePage, /resolveEmployeePromotedRouteForFocusSection/);
  assert.doesNotMatch(homePage, /resolveEmployeeResubmitDraftPrefill/);
  assert.match(homePage, /router\.replace\(promotedRouteForFocusSection\)/);

  assert.match(
    queryHelpers,
    /"request-feedback": "\/employee\/requests\/monitoring"/
  );
  assert.match(
    queryHelpers,
    /"request-resubmit": "\/employee\/requests\/resubmit"/
  );
  assert.match(queryHelpers, /resolveEmployeeResubmitDraftPrefill/);

  assert.match(requestsPage, /EmployeeRequestsWorkspaceContent/);
  assert.match(requestsPage, /sectionMode="all"/);

  assert.match(requestsClient, /EmployeeRequestFeedbackPanels/);
  assert.match(requestsClient, /EmployeeRequestsResubmitWorkspacePanel/);
  assert.match(requestsClient, /refreshEmployeeSnapshotFromHelper/);
  assert.doesNotMatch(requestsClient, /\/employee\?focus=/);
  assert.match(requestsClient, /resubmitChannel=/);
  assert.match(requestsClient, /resubmitRecordId=/);

  assert.match(shortcuts, /\/employee\/requests\/monitoring\?source=employee-dashboard/);
  assert.match(accountPanels, /resolveChecklistActionTarget/);
  assert.match(accountPanels, /\/employee\/requests\/monitoring\?source=employee-dashboard/);
  assert.match(accountPanels, /\/employee\/requests\/resubmit\?source=employee-dashboard/);

  assert.match(workItem, /route-first/i);
}

run();
console.log("e2e-wi1118-employee-requests-workspace-extraction.test passed");
