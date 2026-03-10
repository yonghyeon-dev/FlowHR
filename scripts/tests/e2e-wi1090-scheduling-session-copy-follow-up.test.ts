import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const adminView = readUtf8("src", "components", "scheduling", "AdminSchedulingWorkspaceView.tsx");
const employeeView = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoardView.tsx");
const copy = readUtf8("src", "components", "scheduling", "copy.ts");
const workItem = readUtf8("work-items", "WI-1090-scheduling-session-copy-follow-up.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(adminView, /formatWorkspaceConnectionState\(/);
assert.match(adminView, /formatAdminSessionConnectionState\(/);
assert.doesNotMatch(adminView, /<code>\{sessionOrganizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(adminView, /<code>\{sessionActorId \|\| "-"\}<\/code>/);

assert.match(employeeView, /formatWorkspaceConnectionState\(/);
assert.match(employeeView, /formatEmployeeSessionConnectionState\(/);
assert.doesNotMatch(employeeView, /<code>\{sessionOrganizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(employeeView, /<code>\{sessionEmployeeId \|\| "-"\}<\/code>/);

assert.match(copy, /작업 공간 상태/);
assert.match(copy, /관리자 세션 상태/);
assert.match(copy, /직원 세션 상태/);
assert.match(copy, /Workspace status/);
assert.match(copy, /Admin session status/);
assert.match(copy, /Employee session status/);

assert.match(workItem, /WI-1090/i);
assert.match(progress, /WI-1090/i);
assert.match(gapInventory, /WI-1090/i);

console.log("e2e-wi1090-scheduling-session-copy-follow-up.test passed");
