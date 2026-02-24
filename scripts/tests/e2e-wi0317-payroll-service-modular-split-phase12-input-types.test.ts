import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const serviceInputTypes = readUtf8("src", "features", "payroll", "service-input-types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0317-payroll-service-modular-split-phase12-input-types.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from "@\/features\/payroll\/service-input-types"/);
  assert.match(payrollService, /\bPreviewPayrollInput,/);
  assert.match(payrollService, /\bPreviewPayrollWithDeductionsInput,/);
  assert.match(payrollService, /\bPreviewPayrollYearEndSettlementInput,/);
  assert.match(payrollService, /\bSubmitPayrollYearEndFilingPackageInput,/);
  assert.match(payrollService, /\bUpsertDeductionProfileInput,/);

  assert.doesNotMatch(payrollService, /type PreviewPayrollInput = {/);
  assert.doesNotMatch(payrollService, /type PreviewPayrollWithDeductionsInput =/);
  assert.doesNotMatch(payrollService, /type SubmitPayrollYearEndFilingPackageInput = {/);
  assert.doesNotMatch(payrollService, /type UpsertDeductionProfileInput = {/);

  assert.match(serviceInputTypes, /export type PreviewPayrollInput = {/);
  assert.match(serviceInputTypes, /export type PreviewPayrollWithDeductionsInput =/);
  assert.match(serviceInputTypes, /export type SubmitPayrollYearEndFilingPackageInput = {/);
  assert.match(serviceInputTypes, /export type UpsertDeductionProfileInput = {/);
  assert.match(serviceInputTypes, /export type PayrollYearEndFilingSubmissionStatus =/);

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 4200,
    `expected payroll service line count to decrease below 4200, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0317/i);
  assert.match(workItem, /modular split|decomposition/i);
  assert.match(roadmap, /WI-0317/i);
}

run()
  .then(() => {
    console.log("e2e-wi0317-payroll-service-modular-split-phase12-input-types.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
