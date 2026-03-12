import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const requestsPage = readUtf8("src", "app", "employee", "requests", "page.tsx");
  const requestsWorkspaceContent = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "workspace-content.tsx"
  );
  const sourceContext = readUtf8(
    "src",
    "components",
    "scheduling",
    "employee-source-context.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1123-employee-mobile-source-context-alignment.md"
  );

  assert.match(employeeLayout, /href: "\/employee\/requests"/);
  assert.match(employeeLayout, /href: "\/employee\/attendance\/correction"/);
  assert.match(employeeLayout, /href: "\/employee\/leave\/request"/);
  assert.match(employeeLayout, /href: "\/employee\/schedule"/);
  assert.match(sourceContext, /case "employee-mobile-menu":/);
  assert.match(requestsPage, /EmployeeRequestsWorkspaceContent/);
  assert.match(requestsWorkspaceContent, /resolveEmployeeWorkspaceSourceEntry/);
  assert.match(
    requestsWorkspaceContent,
    /sourceHint=\{workspaceSourceEntry\?\.hint \?\? null\}/
  );
  assert.match(
    requestsWorkspaceContent,
    /returnHref=\{workspaceSourceEntry\?\.returnHref \?\? "\/employee\/requests"\}/
  );
  assert.match(workItem, /직원 모바일 진입 맥락 정렬/);
  assert.match(workItem, /employee-mobile-menu/);
}

run();
console.log("e2e-wi1123-employee-mobile-source-context-alignment.test passed");
