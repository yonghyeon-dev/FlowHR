import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const insuranceHelper = readUtf8(
    "src",
    "features",
    "payroll",
    "service-insurance-settlement-preview-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0363-payroll-service-modular-split-phase23-insurance-settlement-preview-helper.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(insuranceHelper, /previewPayrollInsuranceSettlementFromHelper/);
  assert.match(insuranceHelper, /payroll\.insurance_settlement_previewed/);
  assert.match(insuranceHelper, /payroll\.insurance_settlement\.previewed\.v1/);
  assert.match(insuranceHelper, /normalizeSettlementInsuranceRoundingRules/);

  assert.match(payrollService, /return previewPayrollInsuranceSettlementFromHelper\(context, input\);/);
  assert.doesNotMatch(payrollService, /payroll\.insurance_settlement_previewed/);

  assert.match(workItem, /WI-0363/i);
  assert.match(workItem, /insurance settlement/i);
  assert.match(roadmap, /WI-0363/i);
}

run()
  .then(() => {
    console.log("e2e-wi0363-payroll-service-modular-split-phase23-insurance-settlement-preview-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
