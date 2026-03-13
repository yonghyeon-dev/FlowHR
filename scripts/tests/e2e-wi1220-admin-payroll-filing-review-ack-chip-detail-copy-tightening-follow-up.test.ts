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
    "WI-1220-admin-payroll-filing-review-ack-chip-detail-copy-tightening-follow-up.md"
  );

  assert.match(filingCopy, /reviewAckDetailPrefix: "Dtl"/);
  assert.match(filingCopy, /reviewAckDetailPrefix: "상세"/);
  assert.match(filingConsole, /function formatReviewAckDetail\(value: string\)/);
  assert.match(filingConsole, /const normalized = value\.replace\(\/\\s\+\/g, " "\)\.trim\(\);/);
  assert.match(filingConsole, /const compact = normalized\.length > 24 \? `\$\{normalized\.slice\(0, 24\)\.trimEnd\(\)\}…` : normalized;/);
  assert.match(filingConsole, /return `\$\{copy\.reviewAckDetailPrefix\} \$\{compact\}`;/);
  assert.match(filingConsole, /formatReviewAckDetail\(submission\.ack\.rejectionReasonDetail\)/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1220-admin-payroll-filing-review-ack-chip-detail-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1220`/);
  assert.match(workItem, /WI-1220/);
}

run();
console.log("e2e-wi1220-admin-payroll-filing-review-ack-chip-detail-copy-tightening-follow-up.test passed");
