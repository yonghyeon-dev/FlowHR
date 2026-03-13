import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const workItem = fs.readFileSync(
  path.join(repoRoot, "work-items", "WI-1222-admin-payroll-filing-review-transport-chip-tightening-follow-up.md"),
  "utf8"
);
const filingCopy = fs.readFileSync(
  path.join(repoRoot, "src", "components", "payroll-year-end-filing", "copy.ts"),
  "utf8"
);
const filingConsole = fs.readFileSync(
  path.join(repoRoot, "src", "components", "payroll-year-end-filing", "PayrollYearEndFilingConsole.tsx"),
  "utf8"
);
const testBundles = fs.readFileSync(path.join(repoRoot, "scripts", "tests", "test-bundles.mjs"), "utf8");

assert.match(workItem, /# WI-1222:/);

assert.match(filingCopy, /transportShortManualLabel: "portal"/);
assert.match(filingCopy, /transportShortHometaxLabel: "hometax"/);
assert.match(filingCopy, /transportShortNtsApiMockLabel: "mock"/);
assert.match(filingCopy, /transportShortManualLabel: "[^"]+"/);
assert.match(filingCopy, /transportShortHometaxLabel: "[^"]+"/);
assert.match(filingCopy, /transportShortNtsApiMockLabel: "[^"]+"/);

assert.match(filingConsole, /copy\.transportShortManualLabel/);
assert.match(filingConsole, /copy\.transportShortHometaxLabel/);
assert.match(filingConsole, /copy\.transportShortNtsApiMockLabel/);
assert.match(
  filingConsole,
  /return buildSubmissionReviewMetaChips\(submission, true, true, true, true\)\.join\(/
);

assert.match(
  testBundles,
  /"scripts\/tests\/e2e-wi1222-admin-payroll-filing-review-transport-chip-tightening-follow-up\.test\.ts"/
);

console.log("e2e-wi1222-admin-payroll-filing-review-transport-chip-tightening-follow-up.test passed");
