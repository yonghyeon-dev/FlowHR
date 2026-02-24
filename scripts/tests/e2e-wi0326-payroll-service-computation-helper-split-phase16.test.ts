import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const previewHelpers = readUtf8("src", "features", "payroll", "service-preview-helpers.ts");
  const payrollComputationSources = `${payrollService}\n${previewHelpers}`;
  const computationHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-computation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0326-payroll-service-computation-helper-split-phase16.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollComputationSources, /from "@\/features\/payroll\/service-computation-helpers"/);
  assert.match(payrollComputationSources, /\bcalculatePayrollComputation\b/);

  assert.doesNotMatch(payrollService, /const emptyTotals: PayableMinutes = \{/);
  assert.doesNotMatch(
    payrollService,
    /async function calculatePayrollComputation\([\s\S]*?\): Promise<PayrollComputation> \{/
  );
  assert.doesNotMatch(payrollService, /derivePayableMinutes,/);
  assert.doesNotMatch(payrollService, /calculateGrossPay,/);

  assert.match(computationHelpers, /export const emptyPayrollComputationTotals: PayableMinutes = \{/);
  assert.match(computationHelpers, /export async function calculatePayrollComputation\(/);
  assert.match(computationHelpers, /ensureValidPeriod\(input\.periodStart, input\.periodEnd\);/);
  assert.match(computationHelpers, /derivePayableMinutes\(/);
  assert.match(computationHelpers, /calculateGrossPay\(/);

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 3470,
    `expected payroll service line count below 3470 after split, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0326/i);
  assert.match(workItem, /computation helper split|decomposition/i);
  assert.match(roadmap, /WI-0326/i);
}

run()
  .then(() => {
    console.log("e2e-wi0326-payroll-service-computation-helper-split-phase16.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
