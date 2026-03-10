import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const adminSource = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
const employeeSource = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
const workItem = readUtf8("work-items", "WI-1095-notices-session-context-follow-up.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(adminSource, /formatWorkspaceConnectionState\(/);
assert.match(adminSource, /formatAdminSessionConnectionState\(/);
assert.match(employeeSource, /formatWorkspaceConnectionState\(/);
assert.match(employeeSource, /formatEmployeeSessionConnectionState\(/);

assert.doesNotMatch(adminSource, /<code>\{sessionOrganizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(adminSource, /<code>\{sessionActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(employeeSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(employeeSource, /<code>\{employeeId \|\| "-"\}<\/code>/);

assert.match(workItem, /WI-1095/i);
assert.match(progress, /WI-1095/i);
assert.match(gapInventory, /WI-1095/i);

console.log("e2e-wi1095-notices-session-context-follow-up.test passed");
