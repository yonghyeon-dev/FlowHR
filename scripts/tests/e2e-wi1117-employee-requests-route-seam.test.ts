import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const layout = readUtf8("src", "app", "employee", "layout.tsx");
  const guidePage = readUtf8("src", "app", "employee", "guide", "page.tsx");
  const guideDashboard = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideDashboard.tsx"
  );
  const guideCopy = readUtf8(
    "src",
    "components",
    "employee-guide",
    "copy.ts"
  );
  const requestsPage = readUtf8("src", "app", "employee", "requests", "page.tsx");
  const requestsWorkspaceContent = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "workspace-content.tsx"
  );
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

  assert.match(layout, /href: "\/employee\/requests(?:\?source=employee-mobile-menu)?"/);
  assert.match(guidePage, /EmployeeGuideDashboard/);
  assert.match(guideDashboard, /returnHref="\/employee\/requests\?source=employee-guide"/);
  assert.match(guideCopy, /href: "\/employee\/attendance\/correction\?source=employee-guide"/);
  assert.match(guideCopy, /href: "\/employee\/leave\/request\?source=employee-guide"/);

  assert.match(workspaceHubs, /\/employee\/attendance/);
  assert.match(workspaceHubs, /\/employee\/leave/);

  assert.match(accountPanels, /href: "\/employee\/attendance\/correction\?source=employee-dashboard"/);
  assert.match(accountPanels, /href: "\/employee\/leave\/request\?source=employee-dashboard"/);
  assert.match(accountPanels, /href: "\/employee\/requests\/monitoring\?source=employee-dashboard"/);
  assert.match(accountPanels, /href: "\/employee\/requests\/resubmit\?source=employee-dashboard"/);

  assert.match(requestsWorkspaceContent, /id: "attendance-actions"/);
  assert.match(requestsWorkspaceContent, /id: "leave-actions"/);
  assert.match(requestsPage, /EmployeeRequestsWorkspaceContent/);
  assert.match(requestsPage, /sectionMode="all"/);

  assert.match(workItem, /직원 요청 영역 라우트 승격 시임/);
}

run();
console.log("e2e-wi1117-employee-requests-route-seam.test passed");
