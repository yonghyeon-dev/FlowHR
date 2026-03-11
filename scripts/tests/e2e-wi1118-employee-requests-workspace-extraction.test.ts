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
  assert.match(homePage, /resolveEmployeeResubmitDraftPrefill/);
  assert.match(homePage, /router\.replace\(promotedRouteForFocusSection\)/);

  assert.match(
    queryHelpers,
    /"request-feedback": "\/employee\/requests#request-feedback"/
  );
  assert.match(
    queryHelpers,
    /"request-resubmit": "\/employee\/requests#resubmit-workbench"/
  );
  assert.match(queryHelpers, /resolveEmployeeResubmitDraftPrefill/);

  assert.match(requestsPage, /EmployeeRequestsPageClient/);
  assert.match(requestsPage, /\/employee\/requests#request-feedback/);
  assert.match(requestsPage, /\/employee\/requests#request-search-sort/);
  assert.match(requestsPage, /\/employee\/requests#request-timeline/);
  assert.match(requestsPage, /\/employee\/requests#resubmit-workbench/);

  assert.match(requestsClient, /EmployeeRequestFeedbackPanels/);
  assert.match(requestsClient, /EmployeeRequestsResubmitWorkspacePanel/);
  assert.match(requestsClient, /refreshEmployeeSnapshotFromHelper/);
  assert.doesNotMatch(requestsClient, /\/employee\?focus=/);
  assert.match(requestsClient, /resubmitChannel=/);
  assert.match(requestsClient, /resubmitRecordId=/);

  assert.match(shortcuts, /\/employee\/requests\?source=employee-dashboard#request-feedback/);
  assert.match(accountPanels, /resolveChecklistActionTarget/);
  assert.match(accountPanels, /\/employee\/requests\?source=employee-dashboard#request-monitoring/);
  assert.match(accountPanels, /\/employee\/requests\?source=employee-dashboard#resubmit-workbench/);

  assert.match(workItem, /route-first/i);
}

run();
console.log("e2e-wi1118-employee-requests-workspace-extraction.test passed");
