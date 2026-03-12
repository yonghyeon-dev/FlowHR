import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1200-admin-payroll-filing-submissions-card-compaction-follow-up.md"
  );

  assert.match(filingConsole, /admin-payroll-submissions-card/);
  assert.match(filingConsole, /admin-payroll-submissions-summary/);
  assert.match(filingConsole, /admin-payroll-submission-item/);
  assert.match(filingConsole, /admin-payroll-submission-item-head/);
  assert.match(filingConsole, /admin-payroll-submission-item-actions/);
  assert.match(filingConsole, /Review panel|검토 패널/);

  assert.match(globalsCss, /\.admin-payroll-submissions-card \{/);
  assert.match(globalsCss, /\.admin-payroll-submissions-summary \{/);
  assert.match(globalsCss, /\.admin-payroll-submission-item \{/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1200-admin-payroll-filing-submissions-card-compaction-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1200`/);
  assert.match(workItem, /WI-1200/);
}

run();
console.log("e2e-wi1200-admin-payroll-filing-submissions-card-compaction-follow-up.test passed");
