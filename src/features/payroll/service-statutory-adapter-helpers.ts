import {
  applyContributionCap as applyContributionCapCore,
  calculateLookupIncomeTaxKrw as calculateLookupIncomeTaxKrwCore,
  calculateProgressiveIncomeTaxKrw as calculateProgressiveIncomeTaxKrwCore,
  normalizeIncomeTaxBrackets as normalizeIncomeTaxBracketsCore,
  normalizeIncomeTaxLookupTable as normalizeIncomeTaxLookupTableCore,
  normalizeInsuranceRoundingRules as normalizeInsuranceRoundingRulesCore,
  normalizeSettlementInsuranceRoundingRules as normalizeSettlementInsuranceRoundingRulesCore,
  normalizeStatutoryIncomeSplitItems as normalizeStatutoryIncomeSplitItemsCore,
  roundKrwByRule as roundKrwByRuleCore
} from "@/features/payroll/kr-statutory-helpers";
import { toKrwInteger, toRateNumber } from "@/features/payroll/service-runtime-helpers";

export type IncomeTaxBracket = {
  upToKrw: number | null;
  rate: number;
};

export type IncomeTaxLookupRow = {
  upToKrw: number | null;
  taxKrw: number;
  dependentTaxKrw?: Array<{
    dependentCount: number;
    taxKrw: number;
  }>;
};

export type StatutoryIncomeSplitItem = {
  code: string;
  category: string;
  amountKrw: number;
};

export type InsuranceRoundingMode = "round" | "floor" | "ceil";

export type InsuranceRoundingRules = {
  mode: InsuranceRoundingMode;
  nationalPensionUnitKrw: number;
  healthInsuranceUnitKrw: number;
  longTermCareUnitKrw: number;
  employmentInsuranceUnitKrw: number;
};

export type InsuranceRoundingInput = {
  mode?: InsuranceRoundingMode;
  nationalPensionUnitKrw?: number;
  healthInsuranceUnitKrw?: number;
  longTermCareUnitKrw?: number;
  employmentInsuranceUnitKrw?: number;
};

export type InsuranceSettlementRoundingInput = InsuranceRoundingInput & {
  industrialAccidentUnitKrw?: number;
};

export type LookupIncomeTaxResolution = {
  taxKrw: number;
  selectedIncomeTaxLookupRow: {
    upToKrw: number | null;
    taxKrw: number;
  };
  selectedIncomeTaxLookupDependentTier: {
    dependentCount: number;
    taxKrw: number;
  } | null;
};

export function normalizeIncomeTaxBrackets(brackets?: IncomeTaxBracket[]): IncomeTaxBracket[] | null {
  return normalizeIncomeTaxBracketsCore(brackets, toRateNumber, toKrwInteger) as
    | IncomeTaxBracket[]
    | null;
}

export function normalizeIncomeTaxLookupTable(
  lookupTable?: IncomeTaxLookupRow[]
): IncomeTaxLookupRow[] | null {
  return normalizeIncomeTaxLookupTableCore(lookupTable, toKrwInteger) as IncomeTaxLookupRow[] | null;
}

export function normalizeStatutoryIncomeSplitItems(
  items: StatutoryIncomeSplitItem[] | undefined,
  fieldName: "statutory.taxableIncomeItems" | "statutory.nonTaxableIncomeItems"
) {
  return normalizeStatutoryIncomeSplitItemsCore(items, fieldName, toKrwInteger) as
    | StatutoryIncomeSplitItem[]
    | null;
}

export function calculateProgressiveIncomeTaxKrw(taxableBaseKrw: number, brackets: IncomeTaxBracket[]) {
  return calculateProgressiveIncomeTaxKrwCore(taxableBaseKrw, brackets, toKrwInteger);
}

export function calculateLookupIncomeTaxKrw(
  taxableBaseKrw: number,
  dependentCount: number,
  lookupTable: IncomeTaxLookupRow[]
): LookupIncomeTaxResolution {
  return calculateLookupIncomeTaxKrwCore(
    taxableBaseKrw,
    dependentCount,
    lookupTable
  ) as LookupIncomeTaxResolution;
}

export function applyContributionCap(baseKrw: number, capKrw: number | undefined, fieldName: string) {
  return applyContributionCapCore(baseKrw, capKrw, fieldName, toKrwInteger);
}

export function normalizeInsuranceRoundingRules(
  rules?: InsuranceRoundingInput,
  fieldPrefix = "statutory.insuranceRounding"
): InsuranceRoundingRules {
  return normalizeInsuranceRoundingRulesCore(rules, fieldPrefix) as InsuranceRoundingRules;
}

export function normalizeSettlementInsuranceRoundingRules(rules?: InsuranceSettlementRoundingInput) {
  return normalizeSettlementInsuranceRoundingRulesCore(rules);
}

export function roundKrwByRule(
  rawValueKrw: number,
  fieldName: string,
  mode: InsuranceRoundingMode,
  unitKrw: number
) {
  return roundKrwByRuleCore(rawValueKrw, fieldName, mode, unitKrw, toKrwInteger);
}
