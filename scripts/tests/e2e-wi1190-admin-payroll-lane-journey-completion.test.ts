import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const payrollInsurance = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementConsole.tsx"
  );
  const payrollYearEnd = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndConsole.tsx"
  );
  const payrollFiling = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8(
    "work-items",
    "WI-1190-admin-payroll-lane-journey-completion.md"
  );

  assert.match(payrollInsurance, /useSearchParams/);
  assert.match(payrollInsurance, /const showPayrollSource = isAdminPayrollSource\(source\)/);
  assert.match(payrollInsurance, /hidden=\{showPayrollSource\}/);
  assert.match(payrollInsurance, /href="\/admin\/payroll"/);
  assert.match(payrollInsurance, /withAdminSource\("\/admin\/payroll-close", "admin-payroll"\)/);

  assert.match(payrollYearEnd, /useSearchParams/);
  assert.match(payrollYearEnd, /const showPayrollSource = isAdminPayrollSource\(source\)/);
  assert.match(payrollYearEnd, /withAdminSource\("\/admin\/payroll-year-end\/preflight", "admin-payroll"\)/);
  assert.match(payrollYearEnd, /href="\/admin\/payroll"/);

  assert.match(payrollFiling, /useSearchParams/);
  assert.match(payrollFiling, /const showPayrollSource = isAdminPayrollSource\(source\)/);
  assert.match(payrollFiling, /withAdminSource\("\/admin\/payroll-year-end", "admin-payroll"\)/);
  assert.match(payrollFiling, /href="\/admin\/payroll"/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1190-admin-payroll-lane-journey-completion\.test\.ts"/
  );
  assert.match(workItem, /WI-1190/);
  assert.match(workItem, /\/admin\/payroll/);
}

run();
console.log("e2e-wi1190-admin-payroll-lane-journey-completion.test passed");
