import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const payrollCloseConsole = readUtf8(
    "src",
    "components",
    "payroll-close",
    "PayrollClosePeriodConsole.tsx"
  );
  const payrollCloseCopy = readUtf8("src", "components", "payroll-close", "copy.ts");
  const sourceContext = readUtf8("src", "app", "admin", "source-context.ts");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8(
    "work-items",
    "WI-1189-admin-payroll-close-detail-follow-up.md"
  );

  assert.match(sourceContext, /export function isAdminPayrollSource/);
  assert.match(
    payrollCloseConsole,
    /import \{ isAdminHubSource, isAdminPayrollSource \} from "@\/app\/admin\/source-context"/
  );
  assert.match(payrollCloseConsole, /const showPayrollSource = isAdminPayrollSource\(source\)/);
  assert.match(payrollCloseConsole, /copy\.payrollSourceBanner/);
  assert.match(payrollCloseConsole, /copy\.payrollSourceFocusLabel/);
  assert.match(payrollCloseConsole, /showPayrollSource \? "\/admin\/payroll" : "\/admin"/);
  assert.match(payrollCloseConsole, /showPayrollSource \? copy\.backToPayroll : copy\.backToAdmin/);
  assert.match(payrollCloseCopy, /payrollSourceBanner: string;/);
  assert.match(payrollCloseCopy, /backToPayroll: string;/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1189-admin-payroll-close-detail-follow-up\.test\.ts"/
  );
  assert.match(workItem, /WI-1189/);
  assert.match(workItem, /\/admin\/payroll-close/);
}

run();
console.log("e2e-wi1189-admin-payroll-close-detail-follow-up.test passed");
