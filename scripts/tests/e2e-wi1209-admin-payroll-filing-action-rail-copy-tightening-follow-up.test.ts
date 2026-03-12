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
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1209-admin-payroll-filing-action-rail-copy-tightening-follow-up.md"
  );

  assert.match(filingConsole, /Keep preview, finalize, export, and submit in one lane\./);
  assert.match(filingConsole, /Keep acknowledge, resubmit, cancel, and reopen in one recovery group\./);
  assert.match(filingConsole, /Keep filters, catalog, timeline, and evidence in one support rail\./);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1209-admin-payroll-filing-action-rail-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1209`/);
  assert.match(workItem, /WI-1209/);
}

run();
console.log("e2e-wi1209-admin-payroll-filing-action-rail-copy-tightening-follow-up.test passed");
