import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const sessionHelper = readUtf8("src", "app", "employee", "page-session-helpers.ts");
  const accountPanel = readUtf8("src", "components", "employee-dashboard", "EmployeeAccountOverviewPanels.tsx");
  const workItem = readUtf8("work-items", "WI-0634-employee-root-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(employeePage, /useStickyStringState/);
  assert.doesNotMatch(employeePage, /const \[accessToken/);
  assert.match(employeePage, /useEmployeeRuntimeSession\(\{ notConfiguredLabel \}\)/);
  assert.doesNotMatch(employeePage, /onOrganizationIdChange=\{setOrganizationId\}/);
  assert.doesNotMatch(employeePage, /onEmployeeIdChange=\{setEmployeeId\}/);
  assert.doesNotMatch(employeePage, /onAccessTokenChange=\{setAccessToken\}/);

  assert.doesNotMatch(sessionHelper, /useEffect/);
  assert.doesNotMatch(sessionHelper, /accessToken: string;/);
  assert.doesNotMatch(sessionHelper, /setOrganizationId/);
  assert.doesNotMatch(sessionHelper, /setEmployeeId/);
  assert.match(sessionHelper, /const organizationId = \(supabaseSession\?\.organizationId \?\? ""\)\.trim\(\)/);
  assert.match(sessionHelper, /const sessionEmployeeId = \(supabaseSession\?\.actorId \?\? ""\)\.trim\(\)/);
  assert.match(sessionHelper, /const employeeId = sessionEmployeeId/);

  assert.doesNotMatch(accountPanel, /onOrganizationIdChange/);
  assert.doesNotMatch(accountPanel, /onEmployeeIdChange/);
  assert.doesNotMatch(accountPanel, /onAccessTokenChange/);
  assert.doesNotMatch(accountPanel, /Bearer access token \(override\)/);
  assert.match(accountPanel, /formatSignedInAccountLabel\(/);
  assert.match(accountPanel, /formatWorkspaceConnectionState\(/);
  assert.match(accountPanel, /formatEmployeeSessionConnectionState\(/);
  assert.doesNotMatch(accountPanel, /supabaseSession\.email \?\? supabaseSession\.userId/);

  assert.match(workItem, /WI-0634/i);
  assert.match(roadmap, /WI-0634/i);
}

run()
  .then(() => {
    console.log("e2e-wi0634-employee-root-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
