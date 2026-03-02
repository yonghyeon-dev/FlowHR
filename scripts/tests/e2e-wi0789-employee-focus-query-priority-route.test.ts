import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const queryPrefillHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "page-query-prefill-helpers.ts"
  );
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0789-employee-focus-query-priority-route.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    queryPrefillHelpers,
    /function resolveEmployeeFocusSectionId\(/,
    "employee query helpers should resolve focus section from search params"
  );
  assert.match(
    queryPrefillHelpers,
    /searchParams\.get\("focus"\)/,
    "focus resolver should read focus query parameter"
  );
  assert.match(
    queryPrefillHelpers,
    /EMPLOYEE_FOCUS_SECTIONS[\s\S]*"attendance"[\s\S]*"request-resubmit"/,
    "focus resolver should guard allowed focus sections"
  );
  assert.match(
    queryPrefillHelpers,
    /EMPLOYEE_FOCUS_ALIASES[\s\S]*resubmit[\s\S]*request-resubmit/,
    "focus resolver should include alias normalization"
  );
  assert.match(
    employeePage,
    /resolveEmployeeFocusSectionId\(searchParams\)/,
    "employee page should derive focus section from search params"
  );
  assert.match(
    employeePage,
    /useEffect\([\s\S]*jumpToSectionAction\(focusSectionId\)/,
    "employee page should auto-jump to focus section when focus query is present"
  );
  assert.match(
    employeeAccountOverviewPanels,
    /href: "\/employee\?focus=attendance"/,
    "priority workspace link should use focus query route for attendance"
  );

  assert.match(workItem, /WI-0789/i);
  assert.match(workItem, /focus|query|employee|priority|route/i);
  assert.match(roadmap, /WI-0789/i);
}

run();
console.log("e2e-wi0789-employee-focus-query-priority-route.test passed");
