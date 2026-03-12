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
  const filingCopy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1208-admin-payroll-filing-operator-hero-copy-tightening-follow-up.md"
  );

  assert.match(
    filingCopy,
    /Finalize settlement, track filing submissions, and review timeline evidence in one operator lane\./
  );
  assert.match(
    filingCopy,
    /연말정산을 확정하고, 신고 제출 현황과 타임라인 증적을 한 레일에서 관리합니다\./
  );
  assert.match(filingConsole, /Keep preview, finalization, export, and submission in one lane\./);
  assert.match(filingConsole, /Priority support panels/);
  assert.match(filingConsole, /Review settlement state and blockers first, then recovery and diagnostics\./);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1208-admin-payroll-filing-operator-hero-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1208`/);
  assert.match(workItem, /WI-1208/);
}

run();
console.log("e2e-wi1208-admin-payroll-filing-operator-hero-copy-tightening-follow-up.test passed");
