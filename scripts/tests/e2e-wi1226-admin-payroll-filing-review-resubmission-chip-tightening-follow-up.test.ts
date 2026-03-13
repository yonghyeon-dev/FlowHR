import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const workItem = fs.readFileSync(
  path.join(repoRoot, "work-items", "WI-1226-admin-payroll-filing-review-resubmission-chip-tightening-follow-up.md"),
  "utf8"
);
const filingConsole = fs.readFileSync(
  path.join(repoRoot, "src", "components", "payroll-year-end-filing", "PayrollYearEndFilingConsole.tsx"),
  "utf8"
);
const testBundles = fs.readFileSync(path.join(repoRoot, "scripts", "tests", "test-bundles.mjs"), "utf8");

assert.match(workItem, /# WI-1226:/);
assert.match(filingConsole, /function buildSubmissionResubmissionChip\(/);
assert.match(filingConsole, /const normalized = reason\.replace\(\/\\s\+\/g, " "\)\.trim\(\);/);
assert.match(
  filingConsole,
  /const compactReason =\s*normalized\.length > 20 \? `\$\{normalized\.slice\(0, 20\)\.trimEnd\(\)\}…` : normalized;/
);
assert.match(
  filingConsole,
  /return buildSubmissionReviewMetaChips\(submission, true, true, true, true, true\)\.join\(/
);
assert.match(
  filingConsole,
  /return buildSubmissionReviewMetaChips\(submission, false, false, false, false, false\)\.join\(/
);
assert.match(
  testBundles,
  /"scripts\/tests\/e2e-wi1226-admin-payroll-filing-review-resubmission-chip-tightening-follow-up\.test\.ts"/
);

console.log("e2e-wi1226-admin-payroll-filing-review-resubmission-chip-tightening-follow-up.test passed");
