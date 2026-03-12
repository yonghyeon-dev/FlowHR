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
    "WI-1207-admin-payroll-filing-top-stage-copy-tightening-follow-up.md"
  );

  assert.match(filingConsole, /Set baseline values and deductions before preparing the package\./);
  assert.match(filingConsole, /Align format, validation, transport, and filters in one pass\./);
  assert.match(filingConsole, /Handle save, resubmit, cancel, reopen, and timeline follow-up together\./);
  assert.match(filingStyles, /\.consoleFieldHeader p/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1207-admin-payroll-filing-top-stage-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1207`/);
  assert.match(workItem, /WI-1207/);
}

run();
console.log("e2e-wi1207-admin-payroll-filing-top-stage-copy-tightening-follow-up.test passed");
