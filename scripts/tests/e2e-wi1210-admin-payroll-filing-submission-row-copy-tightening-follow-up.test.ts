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
    "WI-1210-admin-payroll-filing-submission-row-copy-tightening-follow-up.md"
  );

  assert.match(filingConsole, /function formatSubmissionReviewMeta/);
  assert.match(filingConsole, /copy\.transportShortManualLabel/);
  assert.match(filingConsole, /copy\.transportShortHometaxLabel/);
  assert.match(filingConsole, /copy\.transportShortNtsApiMockLabel/);
  assert.match(filingConsole, /chips\.join\(" · "\)/);
  assert.doesNotMatch(
    filingConsole,
    /copy\.submissionTransportOptionLabels\[submission\.transport\] \?\? submission\.transport\} \/ \{copy\.exportFormatOptionLabels/
  );

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1210-admin-payroll-filing-submission-row-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1210`/);
  assert.match(workItem, /WI-1210/);
}

run();
console.log("e2e-wi1210-admin-payroll-filing-submission-row-copy-tightening-follow-up.test passed");
