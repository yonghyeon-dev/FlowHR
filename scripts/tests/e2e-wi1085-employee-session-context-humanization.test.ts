import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const productLanguageSource = readUtf8("src", "lib", "product-language.ts");
const accountOverviewSource = readUtf8(
  "src",
  "components",
  "employee-dashboard",
  "EmployeeAccountOverviewPanels.tsx"
);
const employeeYearEndSource = readUtf8(
  "src",
  "components",
  "payroll-year-end",
  "EmployeeYearEndInputConsole.tsx"
);
const workItem = readUtf8("work-items", "WI-1085-employee-session-context-humanization.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(productLanguageSource, /formatEmployeeSessionConnectionState/);

for (const source of [accountOverviewSource, employeeYearEndSource]) {
  assert.match(source, /formatWorkspaceConnectionState\(/);
  assert.match(source, /formatEmployeeSessionConnectionState\(/);
}

assert.doesNotMatch(accountOverviewSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(accountOverviewSource, /<code>\{employeeId \|\| "-"\}<\/code>/);
assert.doesNotMatch(employeeYearEndSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(employeeYearEndSource, /<code>\{employeeId \|\| "-"\}<\/code>/);
assert.match(workItem, /WI-1085/i);
assert.match(progress, /WI-1085/i);
assert.match(gapInventory, /WI-1085/i);

console.log("e2e-wi1085-employee-session-context-humanization.test passed");
