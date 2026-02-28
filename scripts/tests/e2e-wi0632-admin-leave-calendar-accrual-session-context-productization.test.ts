import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const leaveCalendarConsole = readUtf8("src", "components", "leave-calendar", "LeaveCalendarConsole.tsx");
  const leaveAccrualConsole = readUtf8("src", "components", "leave-accrual", "LeaveAccrualAutoGrantConsole.tsx");
  const workItem = readUtf8("work-items", "WI-0632-admin-leave-calendar-accrual-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(leaveCalendarConsole, /useStickyStringState/);
  assert.doesNotMatch(leaveCalendarConsole, /const \[accessToken/);
  assert.match(leaveCalendarConsole, /const organizationId = \(supabaseSession\?\.organizationId \?\? ""\)\.trim\(\)/);
  assert.match(leaveCalendarConsole, /const adminActorId = \(supabaseSession\?\.actorId \?\? "ADM-1001"\)\.trim\(\) \|\| "ADM-1001"/);
  assert.match(leaveCalendarConsole, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(leaveCalendarConsole, /\{showDevTools \? \(/);
  assert.doesNotMatch(leaveCalendarConsole, /setOrganizationId/);
  assert.doesNotMatch(leaveCalendarConsole, /setAdminActorId/);

  assert.doesNotMatch(leaveAccrualConsole, /useStickyStringState/);
  assert.doesNotMatch(leaveAccrualConsole, /const \[accessToken/);
  assert.match(leaveAccrualConsole, /useI18n\(\)/);
  assert.match(leaveAccrualConsole, /const organizationId = \(supabaseSession\?\.organizationId \?\? ""\)\.trim\(\)/);
  assert.match(leaveAccrualConsole, /const adminActorId = \(supabaseSession\?\.actorId \?\? "ADM-1001"\)\.trim\(\) \|\| "ADM-1001"/);
  assert.match(leaveAccrualConsole, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(leaveAccrualConsole, /\{showDevTools \? \(/);
  assert.doesNotMatch(leaveAccrualConsole, /Organization ID/);
  assert.doesNotMatch(leaveAccrualConsole, /Access Token \(optional\)/);

  assert.match(workItem, /WI-0632/i);
  assert.match(roadmap, /WI-0632/i);
}

run()
  .then(() => {
    console.log("e2e-wi0632-admin-leave-calendar-accrual-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
