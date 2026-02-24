import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const helperSource = readUtf8("src", "features", "payroll", "service-preview-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0381-payroll-service-modular-split-phase30-preview-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helperSource, /export async function previewPayrollFromHelper/);
  assert.match(helperSource, /export async function previewPayrollWithDeductionsFromHelper/);
  assert.match(helperSource, /payroll\.calculated\.v1/);
  assert.match(helperSource, /payroll\.deductions\.calculated\.v1/);

  assert.match(payrollService, /return previewPayrollFromHelper\(context, input\);/);
  assert.match(payrollService, /return previewPayrollWithDeductionsFromHelper\(context, input\);/);
  assert.doesNotMatch(payrollService, /const deductionMode = input\.deductionMode/);
  assert.doesNotMatch(payrollService, /payroll\.deductions\.calculated\.v1/);

  assert.match(workItem, /WI-0381/i);
  assert.match(workItem, /preview helpers/i);
  assert.match(roadmap, /WI-0381/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0381-payroll-service-modular-split-phase30-preview-helpers.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
