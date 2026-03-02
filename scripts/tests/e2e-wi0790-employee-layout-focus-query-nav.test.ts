import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const queryPrefillHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "page-query-prefill-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0790-employee-layout-focus-query-nav.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeeLayout,
    /\?focus=account/,
    "employee layout account navigation should use focus query"
  );
  assert.match(
    employeeLayout,
    /\?focus=request-resubmit/,
    "employee layout resubmit navigation should use focus query"
  );
  assert.match(
    employeeLayout,
    /\?focus=attendance/,
    "employee layout attendance navigation should use focus query"
  );
  assert.doesNotMatch(
    employeeLayout,
    /\/employee#account/,
    "employee layout should not keep hash navigation for account section"
  );
  assert.match(
    queryPrefillHelpers,
    /EMPLOYEE_FOCUS_SECTIONS[\s\S]*"account"/,
    "focus resolver should allow account section"
  );

  assert.match(workItem, /WI-0790/i);
  assert.match(workItem, /layout|focus|query|employee|navigation/i);
  assert.match(roadmap, /WI-0790/i);
}

run();
console.log("e2e-wi0790-employee-layout-focus-query-nav.test passed");
