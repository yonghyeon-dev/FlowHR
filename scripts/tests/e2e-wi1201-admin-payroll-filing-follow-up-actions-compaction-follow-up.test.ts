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
    "WI-1201-admin-payroll-filing-follow-up-actions-compaction-follow-up.md"
  );

  assert.match(filingConsole, /Action rail|액션 레일/);
  assert.match(filingConsole, /consoleActionRailEyebrow/);
  assert.match(filingConsole, /consoleActionGroupCopy/);

  assert.match(filingStyles, /\.consoleActionRailEyebrow \{/);
  assert.match(filingStyles, /\.consoleActionGroupCopy \{/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1201-admin-payroll-filing-follow-up-actions-compaction-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1201`/);
  assert.match(workItem, /WI-1201/);
}

run();
console.log("e2e-wi1201-admin-payroll-filing-follow-up-actions-compaction-follow-up.test passed");
