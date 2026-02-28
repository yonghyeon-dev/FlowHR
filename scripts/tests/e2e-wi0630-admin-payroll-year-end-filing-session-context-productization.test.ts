import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const filingConsole = readUtf8("src", "components", "payroll-year-end-filing", "PayrollYearEndFilingConsole.tsx");
  const workItem = readUtf8("work-items", "WI-0630-admin-payroll-year-end-filing-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(filingConsole, /useStickyStringState/);
  assert.doesNotMatch(filingConsole, /const \[accessToken/);
  assert.doesNotMatch(filingConsole, /setAccessToken/);
  assert.doesNotMatch(filingConsole, /setOrganizationId/);
  assert.doesNotMatch(filingConsole, /setAdminActorId/);
  assert.match(filingConsole, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(filingConsole, /const adminActorId = \(supabaseSession\?\.actorId/);
  assert.match(filingConsole, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(filingConsole, /Session organization|세션 조직/);
  assert.match(filingConsole, /\{showDevTools \? \(/);

  assert.match(workItem, /WI-0630/i);
  assert.match(roadmap, /WI-0630/i);
}

run()
  .then(() => {
    console.log("e2e-wi0630-admin-payroll-year-end-filing-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
