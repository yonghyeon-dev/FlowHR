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
  const copySource = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1216-admin-payroll-filing-review-meta-label-tightening-follow-up.md"
  );

  assert.match(copySource, /reviewResubmissionReasonPrefix: "Retry"/);
  assert.match(copySource, /reviewAckPrefix: "Reply"/);
  assert.match(copySource, /reviewAckDetailPrefix: "Dtl"/);
  assert.match(filingConsole, /copy\.reviewResubmissionReasonPrefix/);
  assert.match(filingConsole, /copy\.reviewAckPrefix/);
  assert.match(filingConsole, /copy\.reviewAckDetailPrefix/);
  assert.match(filingConsole, /const ackDetail = submission\.ack\.rejectionReasonDetail/);
  assert.match(filingConsole, /formatReviewAckDetail\(submission\.ack\.rejectionReasonDetail\)/);
  assert.match(filingConsole, /ackDetail \? ` .* \$\{ackDetail\}` : ""/);
  assert.match(filingConsole, /return buildSubmissionReviewMetaChips\(submission, true, true, true, true, true\)\.join\(/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1216-admin-payroll-filing-review-meta-label-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1216`/);
  assert.match(workItem, /WI-1216/);
}

run();
console.log("e2e-wi1216-admin-payroll-filing-review-meta-label-tightening-follow-up.test passed");
