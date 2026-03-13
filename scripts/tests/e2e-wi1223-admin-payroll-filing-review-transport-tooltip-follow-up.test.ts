import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const workItem = fs.readFileSync(
  path.join(repoRoot, "work-items", "WI-1223-admin-payroll-filing-review-transport-tooltip-follow-up.md"),
  "utf8"
);
const filingConsole = fs.readFileSync(
  path.join(repoRoot, "src", "components", "payroll-year-end-filing", "PayrollYearEndFilingConsole.tsx"),
  "utf8"
);
const filingCopy = fs.readFileSync(
  path.join(repoRoot, "src", "components", "payroll-year-end-filing", "copy.ts"),
  "utf8"
);
const testBundles = fs.readFileSync(path.join(repoRoot, "scripts", "tests", "test-bundles.mjs"), "utf8");

assert.match(workItem, /# WI-1223:/);
assert.match(filingConsole, /function buildSubmissionTransportChip\(/);
assert.match(filingConsole, /copy\.submissionTransportOptionLabels\[transport\] \?\? transport/);
assert.match(filingConsole, /return buildSubmissionReviewMetaChips\(submission, true, true, true, true\)\.join\(/);
assert.match(filingConsole, /return buildSubmissionReviewMetaChips\(submission, false, false, false, false\)\.join\(/);
assert.match(filingCopy, /manual_portal: "Manual portal"/);
assert.match(filingCopy, /hometax_upload: "Hometax upload"/);
assert.match(
  testBundles,
  /"scripts\/tests\/e2e-wi1223-admin-payroll-filing-review-transport-tooltip-follow-up\.test\.ts"/
);

console.log("e2e-wi1223-admin-payroll-filing-review-transport-tooltip-follow-up.test passed");
