import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const sessionMenuSource = readUtf8("src", "components", "SessionMenu.tsx");
const workItem = readUtf8("work-items", "WI-1088-session-menu-copy-productization.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(sessionMenuSource, /formatSignedInAccountLabel\(/);
assert.match(sessionMenuSource, /formatWorkspaceConnectionState\(/);
assert.doesNotMatch(sessionMenuSource, /snapshot\.email \?\? snapshot\.userId/);

assert.match(workItem, /WI-1088/i);
assert.match(progress, /WI-1088/i);
assert.match(gapInventory, /WI-1088/i);

console.log("e2e-wi1088-session-menu-copy-productization.test passed");
