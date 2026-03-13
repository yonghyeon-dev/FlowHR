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
    "WI-1219-admin-payroll-filing-review-attempt-chip-tightening-follow-up.md"
  );

  assert.match(filingCopy, /reviewAttemptPrefix: "Try"/);
  assert.match(filingCopy, /reviewAttemptPrefix: "차"/);
  assert.match(filingConsole, /function formatReviewAttemptChip\(value: number\)/);
  assert.match(
    filingConsole,
    /return locale === "ko" \? `\$\{value\}\$\{copy\.reviewAttemptPrefix\}` : `\$\{copy\.reviewAttemptPrefix\} \$\{value\}`;/
  );
  assert.match(filingConsole, /\{formatReviewAttemptChip\(submission\.attempt\)\}/);
  assert.doesNotMatch(filingConsole, /\{copy\.timelineAttemptLabel\} \{submission\.attempt\}/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1219-admin-payroll-filing-review-attempt-chip-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1219`/);
  assert.match(workItem, /WI-1219/);
}

run();
console.log("e2e-wi1219-admin-payroll-filing-review-attempt-chip-tightening-follow-up.test passed");
