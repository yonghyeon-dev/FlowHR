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
    "WI-1059-employee-desktop-focus-settled-retry.md"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(
    employeePage,
    /hasSettledSectionJumpAction\(focusSectionId\)/,
    "desktop focus retry must verify that the section has actually settled"
  );
  assert.match(
    employeePage,
    /window\.setTimeout\(ensureFocusSectionVisible, FOCUS_SECTION_RETRY_INTERVAL_MS\);/,
    "desktop focus retry must keep polling until the section lands or the retry budget expires"
  );
  assert.match(
    employeePage,
    /appliedFocusSectionRef\.current = null;\s*ensureFocusSectionVisible\(\);/,
    "desktop focus retry must not mark the section as applied before the retry loop begins"
  );
  assert.doesNotMatch(
    employeePage,
    /appliedFocusSectionRef\.current = focusSectionId;\s*const timeoutId = window\.setTimeout/,
    "desktop focus retry must not eagerly lock the applied section before the first one-shot timeout"
  );
  assert.match(
    interactionActions,
    /export function hasSettledSectionJumpAction\(sectionId: string\)/,
    "section jump helper must expose the settled-state predicate"
  );
  assert.match(
    interactionActions,
    /window\.location\.hash === `#\$\{sectionId\}` && isElementTopInViewport\(target\)/,
    "settled-state predicate must require both hash sync and in-viewport visibility"
  );

  assert.match(workItem, /WI-1059/i);
  assert.match(progress, /WI-1059/i);
}

run()
  .then(() => {
    console.log("e2e-wi1059-employee-desktop-focus-settled-retry.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
