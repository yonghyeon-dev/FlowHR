import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const copy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const filingApiLogsPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingApiLogsPanel.tsx"
  );
  const filingFailurePanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingFailureActionPanel.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8(
    "work-items",
    "WI-1195-admin-payroll-filing-diagnostics-density-follow-up.md"
  );

  assert.match(copy, /apiLogsPanelEyebrow/);
  assert.match(copy, /apiLogsPanelDescription/);
  assert.match(copy, /backToPayrollLaneAction/);
  assert.match(copy, /failureActionPanelEyebrow/);

  assert.match(filingConsole, /admin-payroll-diagnostics-card admin-payroll-diagnostics-intro/);
  assert.match(filingConsole, /Reference rail|참고 레일/);
  assert.match(filingApiLogsPanel, /admin-payroll-diagnostics-card/);
  assert.match(filingApiLogsPanel, /admin-payroll-diagnostics-summary/);
  assert.match(filingApiLogsPanel, /admin-payroll-diagnostics-actions/);
  assert.match(filingFailurePanel, /admin-payroll-recovery-card/);
  assert.match(filingFailurePanel, /admin-payroll-recovery-eyebrow/);

  assert.match(globalsCss, /\.admin-payroll-diagnostics-card \{/);
  assert.match(globalsCss, /\.admin-payroll-recovery-card \{/);
  assert.match(globalsCss, /\.admin-payroll-diagnostics-summary \{/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1195-admin-payroll-filing-diagnostics-density-follow-up\.test\.ts"/
  );
  assert.match(workItem, /WI-1195/);
}

run();
console.log("e2e-wi1195-admin-payroll-filing-diagnostics-density-follow-up.test passed");
