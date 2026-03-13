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
    "WI-1218-admin-payroll-filing-review-time-copy-tightening-follow-up.md"
  );

  assert.match(filingConsole, /function formatReviewSubmittedAt\(value: string\)/);
  assert.match(filingConsole, /function formatReviewSubmittedAtTitle\(value: string\)/);
  assert.match(filingConsole, /return locale === "ko" \? `\$\{month\}\.\$\{day\} \$\{hours\}:\$\{minutes\}` : `\$\{month\}\/\$\{day\} \$\{hours\}:\$\{minutes\}`;/);
  assert.match(filingConsole, /<time\s+dateTime=\{submission\.submittedAt\}\s+title=\{formatReviewSubmittedAtTitle\(submission\.submittedAt\)\}/);
  assert.match(filingConsole, /\{formatReviewSubmittedAt\(submission\.submittedAt\)\}/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1218-admin-payroll-filing-review-time-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1218`/);
  assert.match(workItem, /WI-1218/);
}

run();
console.log("e2e-wi1218-admin-payroll-filing-review-time-copy-tightening-follow-up.test passed");
