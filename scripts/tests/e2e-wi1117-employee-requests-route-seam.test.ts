import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const layout = readUtf8("src", "app", "employee", "layout.tsx");
  const guidePage = readUtf8("src", "app", "employee", "guide", "page.tsx");
  const requestsPage = readUtf8("src", "app", "employee", "requests", "page.tsx");
  const workspaceHubs = readUtf8("src", "components", "employee-dashboard", "workspace-hubs.ts");
  const accountPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1117-employee-requests-route-seam.md"
  );

  assert.ok(
    existsSync(join(process.cwd(), "src", "app", "employee", "requests", "page.tsx")),
    "employee requests route must exist"
  );

  assert.match(layout, /href: "\/employee\/requests"/);
  assert.match(guidePage, /href="\/employee\/requests"/);
  assert.match(guidePage, /href: "\/employee\/attendance"/);
  assert.match(guidePage, /href: "\/employee\/leave"/);

  assert.match(workspaceHubs, /\/employee\/attendance/);
  assert.match(workspaceHubs, /\/employee\/leave/);

  assert.match(accountPanels, /href: "\/employee\/attendance"/);
  assert.match(accountPanels, /href: "\/employee\/leave"/);
  assert.match(accountPanels, /href: "\/employee\/requests#request-monitoring"/);
  assert.match(accountPanels, /href: "\/employee\/requests#resubmit-workbench"/);

  assert.match(requestsPage, /id: "attendance-actions"/);
  assert.match(requestsPage, /id: "leave-actions"/);
  assert.match(requestsPage, /id: "request-monitoring"/);
  assert.match(requestsPage, /id: "resubmit-workbench"/);
  assert.match(requestsPage, /\/employee\/requests#request-feedback/);
  assert.match(requestsPage, /\/employee\/requests#request-search-sort/);
  assert.match(requestsPage, /\/employee\/requests#request-timeline/);
  assert.match(requestsPage, /\/employee\/requests#resubmit-workbench/);

  assert.match(workItem, /직원 요청 영역 라우트 승격 시임/);
}

run();
console.log("e2e-wi1117-employee-requests-route-seam.test passed");
