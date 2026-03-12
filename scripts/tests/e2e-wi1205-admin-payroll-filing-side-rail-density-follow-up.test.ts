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
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1205-admin-payroll-filing-side-rail-density-follow-up.md"
  );

  assert.match(filingConsole, /admin-payroll-side-rail/);
  assert.match(globalsCss, /\.admin-payroll-side-rail/);
  assert.match(globalsCss, /\.admin-payroll-summary-card/);
  assert.match(globalsCss, /\.admin-payroll-blocker-card/);
  assert.match(globalsCss, /\.admin-payroll-recovery-card \.simple-list/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1205-admin-payroll-filing-side-rail-density-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1205`/);
  assert.match(workItem, /WI-1205/);
}

run();
console.log("e2e-wi1205-admin-payroll-filing-side-rail-density-follow-up.test passed");
