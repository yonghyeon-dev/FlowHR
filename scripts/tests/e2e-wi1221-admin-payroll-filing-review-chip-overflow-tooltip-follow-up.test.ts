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
    "WI-1221-admin-payroll-filing-review-chip-overflow-tooltip-follow-up.md"
  );

  assert.match(
    filingConsole,
    /function buildSubmissionReviewMetaChips\(\s*submission: PayrollYearEndFilingSubmission,\s*compactAckDetail: boolean,\s*compactTransport: boolean\s*\)/
  );
  assert.match(filingConsole, /function formatSubmissionReviewMetaTitle\(submission: PayrollYearEndFilingSubmission\)/);
  assert.match(filingConsole, /return buildSubmissionReviewMetaChips\(submission, true, true\)\.join\(/);
  assert.match(filingConsole, /return buildSubmissionReviewMetaChips\(submission, false, false\)\.join\(/);
  assert.match(
    filingConsole,
    /title=\{formatSubmissionReviewMetaTitle\(submission\)\}/
  );
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1221-admin-payroll-filing-review-chip-overflow-tooltip-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1221`/);
  assert.match(workItem, /WI-1221/);
}

run();
console.log("e2e-wi1221-admin-payroll-filing-review-chip-overflow-tooltip-follow-up.test passed");
