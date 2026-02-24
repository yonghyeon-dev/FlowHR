import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const serviceOutputTypes = readUtf8("src", "features", "payroll", "service-output-types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0321-payroll-service-output-type-split-phase13.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from "@\/features\/payroll\/service-output-types"/);
  assert.match(payrollService, /\bPreviewPayrollResult,/);
  assert.match(payrollService, /\bFinalizePayrollYearEndSettlementResult,/);
  assert.match(payrollService, /\bGetPayrollYearEndPreflightChecklistResult,/);

  assert.doesNotMatch(payrollService, /type PreviewPayrollResult = {/);
  assert.doesNotMatch(payrollService, /type PreviewPayrollWithDeductionsResult = {/);
  assert.doesNotMatch(payrollService, /type FinalizePayrollYearEndSettlementResult = {/);
  assert.doesNotMatch(payrollService, /type GetPayrollYearEndPreflightChecklistResult = {/);
  assert.doesNotMatch(payrollService, /type PayrollComputation = {/);

  assert.match(serviceOutputTypes, /export type PreviewPayrollResult = {/);
  assert.match(serviceOutputTypes, /export type PreviewPayrollWithDeductionsResult = {/);
  assert.match(serviceOutputTypes, /export type FinalizePayrollYearEndSettlementResult = {/);
  assert.match(serviceOutputTypes, /export type GetPayrollYearEndPreflightChecklistResult = {/);
  assert.match(serviceOutputTypes, /export type PayrollComputation = {/);

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 3800,
    `expected payroll service line count below 3800 after split, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0321/i);
  assert.match(workItem, /output type split|decomposition/i);
  assert.match(roadmap, /WI-0321/i);
}

run()
  .then(() => {
    console.log("e2e-wi0321-payroll-service-output-type-split-phase13.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
