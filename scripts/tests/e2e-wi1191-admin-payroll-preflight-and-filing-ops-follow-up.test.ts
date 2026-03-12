import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const preflightConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndPreflightConsole.tsx"
  );
  const blockerPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const apiLogsPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingApiLogsPanel.tsx"
  );
  const workflowHelpers = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-workflow-helpers.ts"
  );
  const filingDashboard = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingDashboard.tsx"
  );
  const filingStepPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingStepPanel.tsx"
  );
  const filingOpsRootPage = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "page.tsx"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8(
    "work-items",
    "WI-1191-admin-payroll-preflight-and-filing-ops-follow-up.md"
  );

  assert.match(preflightConsole, /useSearchParams/);
  assert.match(preflightConsole, /const showPayrollSource = isAdminPayrollSource\(source\)/);
  assert.match(preflightConsole, /withAdminSource\("\/admin\/payroll-year-end", "admin-payroll"\)/);
  assert.match(preflightConsole, /href="\/admin\/payroll"/);

  assert.match(blockerPanel, /showPayrollSource: boolean/);
  assert.match(blockerPanel, /withAdminSource\("\/admin\/payroll-close", "admin-payroll"\)/);
  assert.match(blockerPanel, /withAdminSource\("\/admin\/payroll-payslip-delivery", "admin-payroll"\)/);
  assert.match(blockerPanel, /withAdminSource\("\/admin\/payroll-year-end\/preflight", "admin-payroll"\)/);

  assert.match(apiLogsPanel, /showPayrollSource: boolean/);
  assert.match(apiLogsPanel, /withAdminSource\("\/admin\/payroll-year-end-filing\/ops", "admin-payroll"\)/);
  assert.match(apiLogsPanel, /withAdminSource\("\/admin\/payroll-year-end", "admin-payroll"\)/);
  assert.match(apiLogsPanel, /href="\/admin\/payroll"/);

  assert.match(workflowHelpers, /source\?: string \| null/);
  assert.match(workflowHelpers, /query\.set\("source", "admin-payroll"\)/);
  assert.match(filingDashboard, /const source = searchParams\.get\("source"\)/);
  assert.match(filingStepPanel, /const source = searchParams\.get\("source"\)/);
  assert.match(filingStepPanel, /withAdminSource\("\/admin\/payroll-year-end-filing\/ops\/alert", "admin-payroll"\)/);
  assert.match(filingOpsRootPage, /isAdminPayrollSource/);
  assert.match(filingOpsRootPage, /withAdminSource\("\/admin\/payroll-year-end-filing\/ops\/alert", "admin-payroll"\)/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1191-admin-payroll-preflight-and-filing-ops-follow-up\.test\.ts"/
  );
  assert.match(workItem, /WI-1191/);
  assert.match(workItem, /\/admin\/payroll/);
}

run();
console.log("e2e-wi1191-admin-payroll-preflight-and-filing-ops-follow-up.test passed");
