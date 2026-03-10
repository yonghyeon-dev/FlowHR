import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const peopleFiltersPanel = readUtf8(
  "src",
  "app",
  "admin",
  "people",
  "page-view-directory-filters-panel.tsx"
);
const workItem = readUtf8("work-items", "WI-1091-admin-people-session-copy-follow-up.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(peopleFiltersPanel, /formatWorkspaceConnectionState\(/);
assert.match(peopleFiltersPanel, /formatAdminSessionConnectionState\(/);
assert.match(peopleFiltersPanel, /workspaceStatusLabel/);
assert.match(peopleFiltersPanel, /adminSessionStatusLabel/);
assert.doesNotMatch(peopleFiltersPanel, /Session organization|세션 조직/);
assert.doesNotMatch(peopleFiltersPanel, /Session actor|세션 액터/);

assert.match(workItem, /WI-1091/i);
assert.match(progress, /WI-1091/i);
assert.match(gapInventory, /WI-1091/i);

console.log("e2e-wi1091-admin-people-session-copy-follow-up.test passed");
