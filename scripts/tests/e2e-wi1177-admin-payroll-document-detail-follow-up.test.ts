import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const sourceContext = readUtf8("src", "app", "admin", "source-context.ts");
  const payslipConsole = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "PayrollPayslipDeliveryConsole.tsx"
  );
  const contractsWorkspace = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspace.tsx"
  );
  const contractsHeader = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspaceHeader.tsx"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8("work-items", "WI-1177-admin-payroll-document-detail-follow-up.md");

  assert.match(sourceContext, /export function isAdminPayrollSource/);
  assert.match(payslipConsole, /isAdminPayrollSource\(source\)/);
  assert.match(payslipConsole, /copy\.payrollSourceBanner/);
  assert.match(payslipConsole, /href="\/admin\/payroll"/);
  assert.match(contractsWorkspace, /isAdminPayrollSource\(analyticsSource\)/);
  assert.match(contractsWorkspace, /payrollBackHref=\{payrollBackHref\}/);
  assert.match(contractsHeader, /analyticsSource === "admin-payroll"/);
  assert.match(contractsHeader, /payrollBackHref \?/);
  assert.match(
    bundles,
    /scripts\/tests\/e2e-wi1177-admin-payroll-document-detail-follow-up\.test\.ts/
  );
  assert.match(workItem, /WI-1177/);
}

run();
console.log("e2e-wi1177-admin-payroll-document-detail-follow-up.test passed");
