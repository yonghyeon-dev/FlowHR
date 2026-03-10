import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const policySource = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
const historySource = readUtf8("src", "app", "admin", "approval-history", "page.tsx");
const templatesSource = readUtf8("src", "app", "admin", "approval-templates", "page.tsx");
const policyCopy = readUtf8("src", "app", "admin", "approval-policy", "page-locale-helpers.ts");
const historyCopy = readUtf8("src", "app", "admin", "approval-history", "page-locale-helpers.ts");
const templatesCopy = readUtf8("src", "app", "admin", "approval-templates", "page-locale-helpers.ts");

for (const source of [policySource, historySource, templatesSource]) {
  assert.match(source, /formatWorkspaceConnectionState\(/);
  assert.match(source, /formatAdminSessionConnectionState\(/);
}

for (const source of [policyCopy, historyCopy, templatesCopy]) {
  assert.doesNotMatch(source, /Session actor|세션 액터/);
  assert.match(source, /Workspace status|작업 공간 상태/);
  assert.match(source, /Admin session status|관리자 세션 상태/);
}

assert.doesNotMatch(policySource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(policySource, /<code>\{adminActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(historySource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(historySource, /<code>\{adminActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(templatesSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(templatesSource, /<code>\{adminActorId \|\| "-"\}<\/code>/);

console.log("e2e-wi1083-admin-approval-session-context-humanization.test passed");
