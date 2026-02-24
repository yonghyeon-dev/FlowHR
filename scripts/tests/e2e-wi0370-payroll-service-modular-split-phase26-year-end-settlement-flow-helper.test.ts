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
    "service-year-end-settlement-flow-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0370-payroll-service-modular-split-phase26-year-end-settlement-flow-helper.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helperSource, /previewPayrollYearEndSettlementFromHelper/);
  assert.match(helperSource, /recalculatePayrollYearEndSettlementFromHelper/);
  assert.match(helperSource, /finalizePayrollYearEndSettlementFromHelper/);
  assert.match(helperSource, /payroll\.year_end\.settlement_previewed/);
  assert.match(helperSource, /payroll\.year_end\.settlement_recalculated/);
  assert.match(helperSource, /payroll\.year_end\.settlement_finalized/);

  assert.match(payrollService, /return previewPayrollYearEndSettlementFromHelper\(context, input\);/);
  assert.match(payrollService, /return recalculatePayrollYearEndSettlementFromHelper\(context, input\);/);
  assert.match(payrollService, /return finalizePayrollYearEndSettlementFromHelper\(context, input\);/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.settlement_previewed/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.settlement_recalculated/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.settlement_finalize_previewed/);

  assert.match(workItem, /WI-0370/i);
  assert.match(workItem, /settlement flow helper/i);
  assert.match(roadmap, /WI-0370/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0370-payroll-service-modular-split-phase26-year-end-settlement-flow-helper.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
