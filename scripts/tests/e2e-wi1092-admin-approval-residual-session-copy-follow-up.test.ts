import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const policyCopy = readUtf8("src", "app", "admin", "approval-policy", "page-locale-helpers.ts");
const historyCopy = readUtf8("src", "app", "admin", "approval-history", "page-locale-helpers.ts");
const templatesCopy = readUtf8("src", "app", "admin", "approval-templates", "page-locale-helpers.ts");
const workConditions = readUtf8(
  "src",
  "app",
  "admin",
  "approval-executions",
  "page-sections-work-conditions.tsx"
);
const workItem = readUtf8("work-items", "WI-1092-admin-approval-residual-session-copy-follow-up.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

for (const source of [policyCopy, historyCopy, templatesCopy]) {
  assert.match(source, /Workspace status|작업 공간 상태/);
  assert.match(source, /Admin session status|관리자 세션 상태/);
  assert.doesNotMatch(source, /Session actor|세션 액터/);
}

assert.match(workConditions, /workspaceStatusLabel/);
assert.match(workConditions, /adminSessionStatusLabel/);
assert.doesNotMatch(workConditions, /Session actor|세션 액터/);

assert.match(workItem, /WI-1092/i);
assert.match(progress, /WI-1092/i);
assert.match(gapInventory, /WI-1092/i);

console.log("e2e-wi1092-admin-approval-residual-session-copy-follow-up.test passed");
