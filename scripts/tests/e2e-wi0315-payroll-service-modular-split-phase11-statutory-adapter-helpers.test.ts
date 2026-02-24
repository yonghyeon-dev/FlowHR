import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const deductionPreviewHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-deduction-statutory-preview-helpers.ts"
  );
  const insurancePreviewHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-insurance-settlement-preview-helpers.ts"
  );
  const adapterHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-statutory-adapter-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0315-payroll-service-modular-split-phase11-statutory-adapter-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const statutoryCallChainSource = `${payrollService}\n${deductionPreviewHelpers}\n${insurancePreviewHelpers}`;
  assert.match(statutoryCallChainSource, /from "@\/features\/payroll\/service-statutory-adapter-helpers"/);
  assert.doesNotMatch(payrollService, /from "@\/features\/payroll\/kr-statutory-helpers"/);
  assert.doesNotMatch(payrollService, /function normalizeIncomeTaxBrackets\(/);
  assert.doesNotMatch(payrollService, /function normalizeIncomeTaxLookupTable\(/);
  assert.doesNotMatch(payrollService, /function normalizeStatutoryIncomeSplitItems\(/);
  assert.doesNotMatch(payrollService, /function calculateProgressiveIncomeTaxKrw\(/);
  assert.doesNotMatch(payrollService, /function calculateLookupIncomeTaxKrw\(/);
  assert.doesNotMatch(payrollService, /function applyContributionCap\(/);
  assert.doesNotMatch(payrollService, /function normalizeInsuranceRoundingRules\(/);
  assert.doesNotMatch(payrollService, /function normalizeSettlementInsuranceRoundingRules\(/);
  assert.doesNotMatch(payrollService, /function roundKrwByRule\(/);

  assert.match(adapterHelpers, /from "@\/features\/payroll\/kr-statutory-helpers"/);
  assert.match(adapterHelpers, /export type IncomeTaxBracket = {/);
  assert.match(adapterHelpers, /export type LookupIncomeTaxResolution = {/);
  assert.match(adapterHelpers, /export function normalizeIncomeTaxBrackets\(/);
  assert.match(adapterHelpers, /export function normalizeIncomeTaxLookupTable\(/);
  assert.match(adapterHelpers, /export function normalizeStatutoryIncomeSplitItems\(/);
  assert.match(adapterHelpers, /export function calculateProgressiveIncomeTaxKrw\(/);
  assert.match(adapterHelpers, /export function calculateLookupIncomeTaxKrw\(/);
  assert.match(adapterHelpers, /export function applyContributionCap\(/);
  assert.match(adapterHelpers, /export function normalizeInsuranceRoundingRules\(/);
  assert.match(adapterHelpers, /export function normalizeSettlementInsuranceRoundingRules\(/);
  assert.match(adapterHelpers, /export function roundKrwByRule\(/);

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 4520,
    `expected payroll service line count to decrease below 4520, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0315/i);
  assert.match(workItem, /modular split|decomposition/i);
  assert.match(roadmap, /WI-0315/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0315-payroll-service-modular-split-phase11-statutory-adapter-helpers.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
