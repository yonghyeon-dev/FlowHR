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
  const filingStyles = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingWorkflow.module.css"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1204-admin-payroll-filing-interactive-field-density-follow-up.md"
  );

  assert.match(filingConsole, /styles\.consoleCompactFieldGrid/);
  assert.match(filingStyles, /\.consoleCompactFieldGrid/);
  assert.match(filingStyles, /\.consoleCompactFieldGrid label/);
  assert.match(filingStyles, /\.consoleCompactFieldGrid input,/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1204-admin-payroll-filing-interactive-field-density-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1204`/);
  assert.match(workItem, /WI-1204/);
}

run();
console.log("e2e-wi1204-admin-payroll-filing-interactive-field-density-follow-up.test passed");
