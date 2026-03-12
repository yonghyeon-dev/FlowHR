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
    "WI-1212-admin-payroll-filing-summary-pill-copy-tightening-follow-up.md"
  );

  assert.match(filingCopy, /totalFilteredLabel: "Total \/ Shown"/);
  assert.match(filingCopy, /statusSummaryLabel: "Stage"/);
  assert.match(filingCopy, /ackStatusSummaryLabel: "Reply"/);
  assert.match(filingCopy, /validationSummaryLabel: "Checks"/);
  assert.match(filingCopy, /transportSummaryLabel: "Route"/);
  assert.match(filingCopy, /activeFiltersLabel: "Filters"/);
  assert.match(filingCopy, /totalFilteredLabel: "전체 \/ 표시"/);
  assert.match(filingCopy, /statusSummaryLabel: "진행"/);
  assert.match(filingCopy, /ackStatusSummaryLabel: "응답"/);
  assert.match(filingCopy, /validationSummaryLabel: "검증"/);
  assert.match(filingCopy, /transportSummaryLabel: "방식"/);
  assert.match(filingCopy, /activeFiltersLabel: "필터"/);
  assert.match(filingConsole, /copy\.totalFilteredLabel/);
  assert.match(filingConsole, /copy\.activeFiltersLabel/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1212-admin-payroll-filing-summary-pill-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1212`/);
  assert.match(workItem, /WI-1212/);
}

run();
console.log("e2e-wi1212-admin-payroll-filing-summary-pill-copy-tightening-follow-up.test passed");
