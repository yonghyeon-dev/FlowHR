import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const monitoringPagePath = join(
    process.cwd(),
    "src",
    "app",
    "employee",
    "requests",
    "monitoring",
    "page.tsx"
  );
  const resubmitPagePath = join(
    process.cwd(),
    "src",
    "app",
    "employee",
    "requests",
    "resubmit",
    "page.tsx"
  );
  const requestsPage = readUtf8("src", "app", "employee", "requests", "page.tsx");
  const requestsPageClient = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "page-client.tsx"
  );
  const workspaceContent = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "workspace-content.tsx"
  );
  const queryHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "page-query-prefill-helpers.ts"
  );
  const accountPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const shortcuts = readUtf8(
    "src",
    "components",
    "employee-self-service",
    "EmployeeJourneyShortcutPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1127-employee-requests-subroute-promotion.md"
  );

  assert.ok(existsSync(monitoringPagePath), "monitoring subroute must exist");
  assert.ok(existsSync(resubmitPagePath), "resubmit subroute must exist");

  assert.match(requestsPage, /EmployeeRequestsWorkspaceContent/);
  assert.match(workspaceContent, /sectionMode: EmployeeRequestsSectionMode/);
  assert.match(requestsPageClient, /sectionMode\?: "all" \| "monitoring" \| "resubmit"/);
  assert.match(requestsPageClient, /sectionMode !== "resubmit"/);
  assert.match(requestsPageClient, /sectionMode !== "monitoring"/);

  assert.match(queryHelpers, /"request-feedback": "\/employee\/requests\/monitoring"/);
  assert.match(queryHelpers, /"request-search-sort": "\/employee\/requests\/monitoring"/);
  assert.match(queryHelpers, /"request-timeline": "\/employee\/requests\/monitoring"/);
  assert.match(queryHelpers, /"request-resubmit": "\/employee\/requests\/resubmit"/);

  assert.match(accountPanels, /\/employee\/requests\/monitoring\?source=employee-dashboard/);
  assert.match(accountPanels, /\/employee\/requests\/resubmit\?source=employee-dashboard/);
  assert.match(shortcuts, /\/employee\/requests\/monitoring\?source=employee-dashboard/);

  assert.match(workspaceContent, /\/employee\/requests\/monitoring\?source=employee-requests/);
  assert.match(workspaceContent, /\/employee\/requests\/resubmit\?source=employee-requests/);
  assert.doesNotMatch(workspaceContent, /\/employee\/requests#request-feedback/);
  assert.doesNotMatch(workspaceContent, /\/employee\/requests#resubmit-workbench/);

  assert.match(workItem, /WI-1127/i);
  assert.match(workItem, /subroute/i);
}

run();
console.log("e2e-wi1127-employee-requests-subroute-promotion.test passed");
