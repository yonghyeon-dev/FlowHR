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
  const statutoryHelpers = readUtf8("src", "features", "payroll", "kr-statutory-helpers.ts");
  const statutoryAdapterHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-statutory-adapter-helpers.ts"
  );
  const workItem = readUtf8("work-items", "WI-0300-payroll-service-modular-split-phase3.md");
  const roadmap = readUtf8("ROADMAP.md");

  const statutoryCallChainSource = `${payrollService}\n${deductionPreviewHelpers}\n${insurancePreviewHelpers}`;
  assert.match(statutoryCallChainSource, /from "@\/features\/payroll\/service-statutory-adapter-helpers"/);
  assert.match(statutoryAdapterHelpers, /from "@\/features\/payroll\/kr-statutory-helpers"/);

  assert.match(
    statutoryAdapterHelpers,
    /return normalizeIncomeTaxBracketsCore\(brackets, toRateNumber, toKrwInteger\)/
  );
  assert.match(statutoryAdapterHelpers, /return normalizeIncomeTaxLookupTableCore\(lookupTable, toKrwInteger\)/);
  assert.match(
    statutoryAdapterHelpers,
    /return normalizeStatutoryIncomeSplitItemsCore\(items, fieldName, toKrwInteger\)/
  );
  assert.match(
    statutoryAdapterHelpers,
    /return calculateProgressiveIncomeTaxKrwCore\(taxableBaseKrw, brackets, toKrwInteger\)/
  );
  assert.match(statutoryAdapterHelpers, /return calculateLookupIncomeTaxKrwCore\(/);
  assert.match(
    statutoryAdapterHelpers,
    /return applyContributionCapCore\(baseKrw, capKrw, fieldName, toKrwInteger\)/
  );
  assert.match(statutoryAdapterHelpers, /return normalizeInsuranceRoundingRulesCore\(rules, fieldPrefix\)/);
  assert.match(statutoryAdapterHelpers, /return normalizeSettlementInsuranceRoundingRulesCore\(rules\)/);
  assert.match(
    statutoryAdapterHelpers,
    /return roundKrwByRuleCore\(rawValueKrw, fieldName, mode, unitKrw, toKrwInteger\)/
  );

  assert.match(statutoryHelpers, /export function normalizeIncomeTaxBrackets/);
  assert.match(statutoryHelpers, /export function normalizeIncomeTaxLookupTable/);
  assert.match(statutoryHelpers, /export function normalizeStatutoryIncomeSplitItems/);
  assert.match(statutoryHelpers, /export function calculateProgressiveIncomeTaxKrw/);
  assert.match(statutoryHelpers, /export function calculateLookupIncomeTaxKrw/);
  assert.match(statutoryHelpers, /export function normalizeInsuranceRoundingRules/);
  assert.match(statutoryHelpers, /export function normalizeSettlementInsuranceRoundingRules/);

  assert.match(workItem, /WI-0300/i);
  assert.match(workItem, /modular split/i);
  assert.match(roadmap, /WI-0300/i);
}

run()
  .then(() => {
    console.log("e2e-wi0300-payroll-service-modular-split-phase3.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
