import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const blockerPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1198-admin-payroll-filing-blocker-card-compaction-follow-up.md"
  );

  assert.match(blockerPanel, /admin-payroll-blocker-card/);
  assert.match(blockerPanel, /admin-payroll-blocker-eyebrow/);
  assert.match(blockerPanel, /admin-payroll-blocker-summary/);
  assert.match(blockerPanel, /admin-payroll-blocker-list/);
  assert.match(blockerPanel, /admin-payroll-blocker-item/);
  assert.match(blockerPanel, /admin-payroll-blocker-actions/);
  assert.match(blockerPanel, /Priority blockers|우선 차단/);

  assert.match(globalsCss, /\.admin-payroll-blocker-card \{/);
  assert.match(globalsCss, /\.admin-payroll-blocker-summary \{/);
  assert.match(globalsCss, /\.admin-payroll-blocker-item \{/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1198-admin-payroll-filing-blocker-card-compaction-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1198`/);
  assert.match(workItem, /WI-1198/);
}

run();
console.log("e2e-wi1198-admin-payroll-filing-blocker-card-compaction-follow-up.test passed");
