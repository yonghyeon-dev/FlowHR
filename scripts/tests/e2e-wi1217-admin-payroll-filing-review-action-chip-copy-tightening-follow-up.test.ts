import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const filingCopy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
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
    "WI-1217-admin-payroll-filing-review-action-chip-copy-tightening-follow-up.md"
  );

  assert.match(filingCopy, /quickResubmitAction: "Retry"/);
  assert.match(filingCopy, /timelineAction: "Log"/);
  assert.match(filingCopy, /quickResubmitAction: "재시도"/);
  assert.match(filingCopy, /timelineAction: "기록"/);
  assert.match(filingConsole, /copy\.quickResubmitAction/);
  assert.match(filingConsole, /copy\.timelineAction/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1217-admin-payroll-filing-review-action-chip-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1217`/);
  assert.match(workItem, /WI-1217/);
}

run();
console.log("e2e-wi1217-admin-payroll-filing-review-action-chip-copy-tightening-follow-up.test passed");
