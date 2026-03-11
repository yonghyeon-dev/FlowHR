import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const requestsPage = readUtf8("src", "app", "employee", "requests", "page.tsx");
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

  assert.match(employeeLayout, /\/employee\/requests\?source=employee-mobile-menu/);
  assert.match(employeeLayout, /\/employee\/attendance\?source=employee-mobile-menu/);
  assert.match(employeeLayout, /\/employee\/leave\?source=employee-mobile-menu/);
  assert.match(employeeLayout, /\/employee\/schedule\?source=employee-mobile-menu/);
  assert.match(sourceContext, /case "employee-mobile-menu":/);
  assert.match(requestsPage, /resolveEmployeeWorkspaceSourceEntry/);
  assert.match(requestsPage, /sourceHint=\{workspaceSourceEntry\?\.hint \?\? null\}/);
  assert.match(requestsPage, /returnHref=\{workspaceSourceEntry\?\.returnHref \?\? "\/employee"\}/);
  assert.match(workItem, /모바일/);
}

run();
console.log("e2e-wi1123-employee-mobile-source-context-alignment.test passed");
