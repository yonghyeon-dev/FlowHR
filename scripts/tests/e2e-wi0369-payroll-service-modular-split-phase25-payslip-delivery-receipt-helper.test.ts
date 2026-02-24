import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const helperSource = readUtf8(
    "src",
    "features",
    "payroll",
    "service-payslip-period-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0369-payroll-service-modular-split-phase25-payslip-delivery-receipt-helper.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helperSource, /distributePayrollPayslipsFromHelper/);
  assert.match(helperSource, /acknowledgePayrollPayslipReceiptFromHelper/);
  assert.match(helperSource, /payroll\.payslip_distribution_previewed/);
  assert.match(helperSource, /payroll\.payslip_receipt_confirmed/);

  assert.match(payrollService, /return distributePayrollPayslipsFromHelper\(context, input\);/);
  assert.match(payrollService, /return acknowledgePayrollPayslipReceiptFromHelper\(context, input\);/);
  assert.doesNotMatch(payrollService, /payroll\.payslip_distribution_previewed/);
  assert.doesNotMatch(payrollService, /payroll\.payslip_receipt_confirmed/);

  assert.match(workItem, /WI-0369/i);
  assert.match(workItem, /payslip/i);
  assert.match(roadmap, /WI-0369/i);
}

run()
  .then(() => {
    console.log("e2e-wi0369-payroll-service-modular-split-phase25-payslip-delivery-receipt-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
