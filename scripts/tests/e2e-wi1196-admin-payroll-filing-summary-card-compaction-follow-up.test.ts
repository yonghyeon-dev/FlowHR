import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const summaryPanels = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingSettlementSummaryPanels.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8(
    "work-items",
    "WI-1196-admin-payroll-filing-summary-card-compaction-follow-up.md"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(summaryPanels, /admin-payroll-summary-card/);
  assert.match(summaryPanels, /admin-payroll-summary-eyebrow/);
  assert.match(summaryPanels, /admin-payroll-summary-list/);
  assert.match(summaryPanels, /admin-payroll-summary-detail/);
  assert.match(summaryPanels, /admin-payroll-summary-chip-list/);
  assert.match(summaryPanels, /Settlement snapshot|정산 스냅샷/);
  assert.match(summaryPanels, /Submission snapshot|제출 스냅샷/);

  assert.match(globalsCss, /\.admin-payroll-summary-card \{/);
  assert.match(globalsCss, /\.admin-payroll-summary-detail \{/);
  assert.match(globalsCss, /\.admin-payroll-summary-chip \{/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1196-admin-payroll-filing-summary-card-compaction-follow-up\.test\.ts"/
  );
  assert.match(workItem, /WI-1196/);
  assert.match(progress, /Started `WI-1196`/);
}

run();
console.log("e2e-wi1196-admin-payroll-filing-summary-card-compaction-follow-up.test passed");
