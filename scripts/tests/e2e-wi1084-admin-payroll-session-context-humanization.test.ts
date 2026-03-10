import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const insuranceInputSource = readUtf8(
  "src",
  "components",
  "payroll-insurance",
  "PayrollInsuranceSettlementInputPanel.tsx"
);
const leaveCalendarSource = readUtf8(
  "src",
  "components",
  "leave-calendar",
  "LeaveCalendarConsole.tsx"
);
const yearEndSource = readUtf8(
  "src",
  "components",
  "payroll-year-end",
  "PayrollYearEndConsole.tsx"
);
const preflightSource = readUtf8(
  "src",
  "components",
  "payroll-year-end",
  "PayrollYearEndPreflightConsole.tsx"
);
const filingSource = readUtf8(
  "src",
  "components",
  "payroll-year-end-filing",
  "PayrollYearEndFilingConsole.tsx"
);

for (const source of [
  insuranceInputSource,
  leaveCalendarSource,
  yearEndSource,
  preflightSource,
  filingSource
]) {
  assert.match(source, /formatWorkspaceConnectionState\(/);
  assert.match(source, /formatAdminSessionConnectionState\(/);
}

assert.doesNotMatch(insuranceInputSource, /<code>\{sessionOrganizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(insuranceInputSource, /<code>\{sessionAdminActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(leaveCalendarSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(leaveCalendarSource, /<code>\{adminActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(yearEndSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(yearEndSource, /<code>\{adminActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(preflightSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(preflightSource, /<code>\{adminActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(filingSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(filingSource, /<code>\{adminActorId \|\| "-"\}<\/code>/);

console.log("e2e-wi1084-admin-payroll-session-context-humanization.test passed");
