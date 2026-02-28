import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const yearEnd = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const preflight = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndPreflightConsole.tsx");
  const workItem = readUtf8("work-items", "WI-0629-admin-payroll-year-end-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  for (const source of [yearEnd, preflight]) {
    assert.doesNotMatch(source, /useStickyStringState/);
    assert.doesNotMatch(source, /const \[accessToken/);
    assert.doesNotMatch(source, /setOrganizationId/);
    assert.doesNotMatch(source, /setAdminActorId/);
    assert.doesNotMatch(source, /setAccessToken/);
    assert.match(source, /const organizationId = \(supabaseSession\?\.organizationId/);
    assert.match(source, /const adminActorId = \(supabaseSession\?\.actorId/);
    assert.match(source, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
    assert.match(source, /\{showDevTools \? \(/);
  }

  assert.match(yearEnd, /Session organization|세션 조직/);
  assert.match(preflight, /Session organization|세션 조직/);

  assert.match(workItem, /WI-0629/i);
  assert.match(roadmap, /WI-0629/i);
}

run()
  .then(() => {
    console.log("e2e-wi0629-admin-payroll-year-end-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
