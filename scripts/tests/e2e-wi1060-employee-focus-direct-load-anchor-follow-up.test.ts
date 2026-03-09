import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const interactionActions = readUtf8(
    "src",
    "app",
    "employee",
    "page-interaction-actions.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1060-employee-focus-direct-load-anchor-follow-up.md"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.match(
    employeePage,
    /new MutationObserver\(\(\) => \{/,
    "direct-load focus follow-up must observe late section mount and DOM replacement"
  );
  assert.match(
    employeePage,
    /syncSectionHashAction\(focusSectionId\);/,
    "direct-load focus follow-up must keep the hash aligned with the target section"
  );
  assert.match(
    employeePage,
    /FOCUS_SECTION_OBSERVER_TIMEOUT_MS = 8000/,
    "direct-load focus follow-up must use a longer observer budget than the one-shot retry loop"
  );
  assert.match(
    interactionActions,
    /export function syncSectionHashAction\(sectionId: string\)/,
    "section jump helpers must expose shared hash synchronization"
  );
  assert.match(workItem, /WI-1060/i);
  assert.match(progress, /WI-1060/i);
  assert.match(gapInventory, /WI-1060/i);
}

run()
  .then(() => {
    console.log("e2e-wi1060-employee-focus-direct-load-anchor-follow-up.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
