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
    "WI-1213-admin-payroll-filing-summary-value-copy-tightening-follow-up.md"
  );

  assert.match(filingConsole, /const submissionStatusCompactSummary = useMemo/);
  assert.match(filingConsole, /const submissionAckCompactSummary = useMemo/);
  assert.match(filingConsole, /const submissionValidationCompactSummary = useMemo/);
  assert.match(filingConsole, /const submissionTransportCompactSummary = useMemo/);
  assert.match(filingConsole, /submissionStatusCompactSummary/);
  assert.match(filingConsole, /submissionAckCompactSummary/);
  assert.match(filingConsole, /submissionValidationCompactSummary/);
  assert.match(filingConsole, /submissionTransportCompactSummary/);
  assert.match(filingConsole, /join\(" · "\)/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1213-admin-payroll-filing-summary-value-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1213`/);
  assert.match(workItem, /WI-1213/);
}

run();
console.log("e2e-wi1213-admin-payroll-filing-summary-value-copy-tightening-follow-up.test passed");
