import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const source = readUtf8("src", "app", "login", "page.tsx");
const messages = readUtf8("src", "lib", "i18n", "messages.ts");
const workItem = readUtf8("work-items", "WI-1096-login-session-surface-productization.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(source, /formatSignedInAccountLabel\(/);
assert.match(source, /formatActorRoleLabel\(/);
assert.match(source, /formatWorkspaceConnectionState\(/);
assert.match(source, /formatUserFacingErrorMessage\(/);

assert.doesNotMatch(source, /<strong>\{snapshot\.userId\}<\/strong>/);
assert.doesNotMatch(source, /<strong>\{snapshot\.organizationId \?\? "-"\}<\/strong>/);
assert.doesNotMatch(source, /<strong>\{snapshot\.actorId \?\? "-"\}<\/strong>/);

assert.match(messages, /"login\.userId": "로그인 계정"/);
assert.match(messages, /"login\.organization": "작업 공간 상태"/);
assert.match(messages, /"login\.actorIdOptional": "세션 상태"/);
assert.match(messages, /"login\.userId": "Signed-in account"/);
assert.match(messages, /"login\.organization": "Workspace status"/);
assert.match(messages, /"login\.actorIdOptional": "Session status"/);

assert.match(workItem, /WI-1096/i);
assert.match(progress, /WI-1096/i);
assert.match(gapInventory, /WI-1096/i);

console.log("e2e-wi1096-login-session-surface-productization.test passed");
