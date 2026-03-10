import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const leaveAccrualSource = readUtf8(
  "src",
  "components",
  "leave-accrual",
  "LeaveAccrualAutoGrantConsole.tsx"
);
const payrollCloseSource = readUtf8(
  "src",
  "components",
  "payroll-close",
  "PayrollClosePeriodConsole.tsx"
);
const payrollCloseCopy = readUtf8("src", "components", "payroll-close", "copy.ts");
const payslipDeliverySource = readUtf8(
  "src",
  "components",
  "payroll-payslip-delivery",
  "PayrollPayslipDeliveryConsole.tsx"
);
const payslipDeliveryCopy = readUtf8(
  "src",
  "components",
  "payroll-payslip-delivery",
  "copy.ts"
);
const workItem = readUtf8(
  "work-items",
  "WI-1089-admin-payroll-operational-session-copy-follow-up.md"
);
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

for (const source of [leaveAccrualSource, payrollCloseSource, payslipDeliverySource]) {
  assert.match(source, /formatWorkspaceConnectionState\(/);
  assert.match(source, /formatAdminSessionConnectionState\(/);
}

assert.doesNotMatch(leaveAccrualSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(leaveAccrualSource, /<code>\{adminActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payrollCloseSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payrollCloseSource, /<code>\{adminActorId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payslipDeliverySource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payslipDeliverySource, /<code>\{adminActorId \|\| "-"\}<\/code>/);

for (const copySource of [payrollCloseCopy, payslipDeliveryCopy]) {
  assert.match(copySource, /Workspace status/);
  assert.match(copySource, /Admin session status/);
  assert.match(copySource, /작업 공간 상태/);
  assert.match(copySource, /관리자 세션 상태/);
}

assert.match(workItem, /WI-1089/i);
assert.match(progress, /WI-1089/i);
assert.match(gapInventory, /WI-1089/i);

console.log("e2e-wi1089-admin-payroll-operational-session-copy-follow-up.test passed");
