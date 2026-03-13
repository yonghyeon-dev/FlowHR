import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const workItem = fs.readFileSync(
  path.join(repoRoot, "work-items", "WI-1225-admin-payroll-filing-review-validation-chip-tightening-follow-up.md"),
  "utf8"
);
const filingConsole = fs.readFileSync(
  path.join(repoRoot, "src", "components", "payroll-year-end-filing", "PayrollYearEndFilingConsole.tsx"),
  "utf8"
);
const testBundles = fs.readFileSync(path.join(repoRoot, "scripts", "tests", "test-bundles.mjs"), "utf8");

assert.match(workItem, /# WI-1225:/);
assert.match(filingConsole, /function buildSubmissionValidationChip\(/);
assert.match(filingConsole, /copy\.validationModeOptionLabels\[validationMode\] \?\? validationMode/);
assert.match(filingConsole, /return validationMode === "basic" \? "Base" : "Strict";/);
assert.match(filingConsole, /return buildSubmissionReviewMetaChips\(submission, true, true, true, true, true\)\.join\(/);
assert.match(filingConsole, /return buildSubmissionReviewMetaChips\(submission, false, false, false, false, false\)\.join\(/);
assert.match(
  testBundles,
  /"scripts\/tests\/e2e-wi1225-admin-payroll-filing-review-validation-chip-tightening-follow-up\.test\.ts"/
);

console.log("e2e-wi1225-admin-payroll-filing-review-validation-chip-tightening-follow-up.test passed");
