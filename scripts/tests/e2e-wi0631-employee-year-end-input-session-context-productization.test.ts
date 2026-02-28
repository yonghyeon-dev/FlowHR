import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8("src", "components", "payroll-year-end", "EmployeeYearEndInputConsole.tsx");
  const workItem = readUtf8("work-items", "WI-0631-employee-year-end-input-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(consoleSource, /useStickyStringState/);
  assert.doesNotMatch(consoleSource, /const \[accessToken/);
  assert.doesNotMatch(consoleSource, /setAccessToken/);
  assert.doesNotMatch(consoleSource, /setOrganizationId/);
  assert.doesNotMatch(consoleSource, /setEmployeeId/);
  assert.match(consoleSource, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(consoleSource, /const employeeId = \(supabaseSession\?\.actorId/);
  assert.match(consoleSource, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(consoleSource, /Session organization|세션 조직/);
  assert.match(consoleSource, /Session employee|세션 직원/);
  assert.match(consoleSource, /\{showDevTools \? \(/);

  assert.match(workItem, /WI-0631/i);
  assert.match(roadmap, /WI-0631/i);
}

run()
  .then(() => {
    console.log("e2e-wi0631-employee-year-end-input-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
