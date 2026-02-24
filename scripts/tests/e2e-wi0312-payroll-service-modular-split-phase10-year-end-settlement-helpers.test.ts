import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const calculationHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-calculation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0312-payroll-service-modular-split-phase10-year-end-settlement-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /calculateYearEndSettlementKrw as calculateYearEndSettlementKrwCore/);
  assert.match(payrollService, /return calculateYearEndSettlementKrwCore\(/);

  assert.doesNotMatch(
    payrollService,
    /const annualTaxLiabilityKrw = annualIncomeTaxAfterCreditKrw \+ annualLocalIncomeTaxKrw;/
  );
  assert.doesNotMatch(
    payrollService,
    /const withholdingDeltaKrw = annualTaxLiabilityKrw - priorWithheldTaxKrw;/
  );

  assert.match(calculationHelpers, /export function calculateYearEndSettlementKrw\(/);
  assert.match(
    calculationHelpers,
    /const annualTaxLiabilityKrw = annualIncomeTaxAfterCreditKrw \+ annualLocalIncomeTaxKrw;/
  );
  assert.match(
    calculationHelpers,
    /const withholdingDeltaKrw = annualTaxLiabilityKrw - priorWithheldTaxKrw;/
  );

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 4646,
    `expected payroll service line count to decrease below 4646, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0312/i);
  assert.match(workItem, /modular split|decomposition/i);
  assert.match(roadmap, /WI-0312/i);
}

run()
  .then(() => {
    console.log("e2e-wi0312-payroll-service-modular-split-phase10-year-end-settlement-helpers.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
