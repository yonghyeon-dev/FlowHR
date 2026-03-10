import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const accountPanelSource = readUtf8(
  "src",
  "components",
  "employee-dashboard",
  "EmployeeAccountOverviewPanels.tsx"
);
const guideSectionsSource = readUtf8(
  "src",
  "components",
  "employee-guide",
  "EmployeeGuideSections.tsx"
);
const workItem = readUtf8("work-items", "WI-1087-employee-account-guide-session-copy-productization.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(accountPanelSource, /formatSignedInAccountLabel\(/);
assert.match(accountPanelSource, /formatWorkspaceConnectionState\(/);
assert.match(accountPanelSource, /formatEmployeeSessionConnectionState\(/);
assert.doesNotMatch(accountPanelSource, /supabaseSession\.email \?\? supabaseSession\.userId/);

assert.match(guideSectionsSource, /로그인 직원 번호|Signed-in employee number/);
assert.doesNotMatch(guideSectionsSource, /세션 직원 번호|Session employee number/);

assert.match(workItem, /WI-1087/i);
assert.match(progress, /WI-1087/i);
assert.match(gapInventory, /WI-1087/i);

console.log("e2e-wi1087-employee-account-guide-session-copy-productization.test passed");
