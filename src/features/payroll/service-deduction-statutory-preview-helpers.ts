import { createHash } from "node:crypto";

import { getPayrollKrIncomeSplitItemPreset } from "@/features/payroll/kr-income-split-item-presets";
import {
  getPayrollKrIncomeTaxLookupPreset,
  resolvePayrollKrIncomeTaxLookupPresetByAsOf
} from "@/features/payroll/kr-income-tax-lookup-presets";
import { DEFAULT_INSURANCE_RATES, type InsuranceRates } from "@/features/payroll/insurance-rates";
import type { PreviewPayrollWithDeductionsInput } from "@/features/payroll/service-input-types";
import {
  ensureMonthlyBoundaryInSeoul,
  formatSeoulDateTime,
  toKrwInteger,
  toRateNumber,
  toSeoulDateTimeParts
} from "@/features/payroll/service-runtime-helpers";
import {
  applyContributionCap,
  calculateLookupIncomeTaxKrw,
  calculateProgressiveIncomeTaxKrw,
  normalizeIncomeTaxBrackets,
  normalizeIncomeTaxLookupTable,
  normalizeInsuranceRoundingRules,
  normalizeStatutoryIncomeSplitItems,
  roundKrwByRule
} from "@/features/payroll/service-statutory-adapter-helpers";
import { ServiceError } from "@/features/shared/service-error";

type StatutoryDeductionPreviewResult = {
  withholdingTaxKrw: number;
  socialInsuranceKrw: number;
  otherDeductionsKrw: number;
  insuranceBreakdown: {
    nps: number;
    nhi: number;
    ei: number;
    wci: number;
  };
  additionalBreakdown: Record<string, unknown>;
};

export function calculateStatutoryKrBaselineDeductionPreview(
  input: PreviewPayrollWithDeductionsInput,
  grossPayKrw: number,
  resolvedInsuranceRates: InsuranceRates = DEFAULT_INSURANCE_RATES
): StatutoryDeductionPreviewResult {
  if (input.deductionMode !== "statutory_kr_baseline") {
    throw new ServiceError(400, "deductionMode must be statutory_kr_baseline");
  }

  const nonTaxableIncomeKrw = toKrwInteger(
    input.statutory?.nonTaxableIncomeKrw ?? 0,
    "statutory.nonTaxableIncomeKrw"
  );
  const additionalTaxCreditKrw = toKrwInteger(
    input.statutory?.additionalTaxCreditKrw ?? 0,
    "statutory.additionalTaxCreditKrw"
  );
  const dependentCount = toKrwInteger(
    input.statutory?.dependentCount ?? 0,
    "statutory.dependentCount"
  );
  const dependentTaxCreditPerPersonKrw = toKrwInteger(
    input.statutory?.dependentTaxCreditPerPersonKrw ?? 0,
    "statutory.dependentTaxCreditPerPersonKrw"
  );
  const requireMonthlyBoundary = input.statutory?.requireMonthlyBoundary ?? false;
  if (requireMonthlyBoundary) {
    ensureMonthlyBoundaryInSeoul(input.periodStart, input.periodEnd);
  }

  const incomeTaxRate =
    toRateNumber(input.statutory?.incomeTaxRate ?? 0.03, "statutory.incomeTaxRate") ?? 0;
  const incomeTaxBrackets = normalizeIncomeTaxBrackets(input.statutory?.incomeTaxBrackets);
  const requestedIncomeTaxLookupTable = normalizeIncomeTaxLookupTable(
    input.statutory?.incomeTaxLookupTable
  );
  const incomeTaxLookupPresetAuto = input.statutory?.incomeTaxLookupPresetAuto ?? false;
  const incomeTaxLookupAsOfInput = input.statutory?.incomeTaxLookupAsOf;
  const incomeTaxLookupAsOf = incomeTaxLookupAsOfInput
    ? new Date(incomeTaxLookupAsOfInput)
    : input.periodEnd;
  if (incomeTaxLookupAsOfInput && Number.isNaN(incomeTaxLookupAsOf.getTime())) {
    throw new ServiceError(400, "statutory.incomeTaxLookupAsOf must be a valid datetime");
  }
  const incomeTaxLookupPresetId = input.statutory?.incomeTaxLookupPresetId?.trim() || null;
  if (incomeTaxLookupPresetAuto && incomeTaxLookupPresetId) {
    throw new ServiceError(
      400,
      "statutory.incomeTaxLookupPresetAuto and statutory.incomeTaxLookupPresetId are mutually exclusive"
    );
  }
  const autoSelectedIncomeTaxLookupPreset = incomeTaxLookupPresetAuto
    ? resolvePayrollKrIncomeTaxLookupPresetByAsOf(incomeTaxLookupAsOf)
    : null;
  const incomeTaxLookupPreset = incomeTaxLookupPresetId
    ? getPayrollKrIncomeTaxLookupPreset(incomeTaxLookupPresetId)
    : autoSelectedIncomeTaxLookupPreset;
  if (incomeTaxLookupPresetId && !incomeTaxLookupPreset) {
    throw new ServiceError(
      400,
      `statutory.incomeTaxLookupPresetId is not supported: ${incomeTaxLookupPresetId}`
    );
  }
  if (incomeTaxLookupPresetAuto && !autoSelectedIncomeTaxLookupPreset) {
    throw new ServiceError(
      400,
      "statutory.incomeTaxLookupPresetAuto could not resolve preset for reference date"
    );
  }
  const presetIncomeTaxLookupTable = normalizeIncomeTaxLookupTable(incomeTaxLookupPreset?.rows);
  if (
    (incomeTaxBrackets && requestedIncomeTaxLookupTable) ||
    (incomeTaxBrackets && presetIncomeTaxLookupTable) ||
    (requestedIncomeTaxLookupTable && presetIncomeTaxLookupTable)
  ) {
    throw new ServiceError(
      400,
      "statutory.incomeTaxBrackets/statutory.incomeTaxLookupTable/statutory.incomeTaxLookupPresetId/statutory.incomeTaxLookupPresetAuto are mutually exclusive"
    );
  }
  const incomeTaxLookupTable = requestedIncomeTaxLookupTable ?? presetIncomeTaxLookupTable ?? null;
  const incomeTaxLookupTableChecksum = incomeTaxLookupTable
    ? createHash("sha256").update(JSON.stringify(incomeTaxLookupTable)).digest("hex")
    : null;
  const localIncomeTaxRate =
    toRateNumber(input.statutory?.localIncomeTaxRate ?? 0.1, "statutory.localIncomeTaxRate") ?? 0;
  const nationalPensionRate =
    toRateNumber(
      input.statutory?.nationalPensionRate ?? resolvedInsuranceRates.nps,
      "statutory.nationalPensionRate"
    ) ??
    0;
  const healthInsuranceRate =
    toRateNumber(
      input.statutory?.healthInsuranceRate ?? resolvedInsuranceRates.nhi,
      "statutory.healthInsuranceRate"
    ) ??
    0;
  const longTermCareRateOnHealth =
    toRateNumber(
      input.statutory?.longTermCareRateOnHealth ?? 0.1295,
      "statutory.longTermCareRateOnHealth"
    ) ?? 0;
  const employmentInsuranceRate =
    toRateNumber(
      input.statutory?.employmentInsuranceRate ?? resolvedInsuranceRates.ei,
      "statutory.employmentInsuranceRate"
    ) ??
    0;
  const workersCompensationRate =
    toRateNumber(resolvedInsuranceRates.wci ?? 0, "statutory.workersCompensationRate") ??
    0;
  const otherDeductionsKrw = toKrwInteger(
    input.statutory?.otherDeductionsKrw ?? 0,
    "statutory.otherDeductionsKrw"
  );
  const insuranceRoundingRules = normalizeInsuranceRoundingRules(input.statutory?.insuranceRounding);
  const requestedTaxableIncomeItems = normalizeStatutoryIncomeSplitItems(
    input.statutory?.taxableIncomeItems,
    "statutory.taxableIncomeItems"
  );
  const requestedNonTaxableIncomeItems = normalizeStatutoryIncomeSplitItems(
    input.statutory?.nonTaxableIncomeItems,
    "statutory.nonTaxableIncomeItems"
  );
  const incomeSplitItemPresetId = input.statutory?.incomeSplitItemPresetId?.trim() || null;
  const incomeSplitItemPreset = incomeSplitItemPresetId
    ? getPayrollKrIncomeSplitItemPreset(incomeSplitItemPresetId)
    : null;
  if (incomeSplitItemPresetId && !incomeSplitItemPreset) {
    throw new ServiceError(
      400,
      `statutory.incomeSplitItemPresetId is not supported: ${incomeSplitItemPresetId}`
    );
  }
  if (incomeSplitItemPreset && (requestedTaxableIncomeItems || requestedNonTaxableIncomeItems)) {
    throw new ServiceError(
      400,
      "statutory.incomeSplitItemPresetId and statutory.taxableIncomeItems/nonTaxableIncomeItems are mutually exclusive"
    );
  }
  const taxableIncomeKrwInput =
    input.statutory?.taxableIncomeKrw === undefined
      ? null
      : toKrwInteger(input.statutory.taxableIncomeKrw, "statutory.taxableIncomeKrw");
  if (nonTaxableIncomeKrw > grossPayKrw) {
    throw new ServiceError(400, "statutory.nonTaxableIncomeKrw cannot exceed grossPayKrw");
  }
  const derivedTaxableIncomeKrwFromNumericNonTaxable = grossPayKrw - nonTaxableIncomeKrw;
  const splitTaxableIncomeKrw = taxableIncomeKrwInput ?? derivedTaxableIncomeKrwFromNumericNonTaxable;

  const taxableIncomeItems = incomeSplitItemPreset
    ? [
      {
        code: incomeSplitItemPreset.taxableTemplate.code,
        category: incomeSplitItemPreset.taxableTemplate.category,
        amountKrw: splitTaxableIncomeKrw
      }
    ]
    : requestedTaxableIncomeItems;
  const nonTaxableIncomeItems = incomeSplitItemPreset
    ? nonTaxableIncomeKrw > 0
      ? [
        {
          code: incomeSplitItemPreset.nonTaxableTemplate.code,
          category: incomeSplitItemPreset.nonTaxableTemplate.category,
          amountKrw: nonTaxableIncomeKrw
        }
      ]
      : []
    : requestedNonTaxableIncomeItems;
  const taxableIncomeItemTotalKrw =
    taxableIncomeItems?.reduce((sum, item) => sum + item.amountKrw, 0) ?? 0;
  const nonTaxableIncomeItemTotalKrw =
    nonTaxableIncomeItems?.reduce((sum, item) => sum + item.amountKrw, 0) ?? 0;

  if (
    taxableIncomeItems &&
    taxableIncomeKrwInput !== null &&
    taxableIncomeKrwInput !== taxableIncomeItemTotalKrw
  ) {
    throw new ServiceError(
      400,
      "statutory.taxableIncomeItems sum must match statutory.taxableIncomeKrw when taxableIncomeKrw is provided"
    );
  }

  if (
    nonTaxableIncomeItems &&
    nonTaxableIncomeKrw > 0 &&
    nonTaxableIncomeKrw !== nonTaxableIncomeItemTotalKrw
  ) {
    throw new ServiceError(
      400,
      "statutory.nonTaxableIncomeItems sum must match statutory.nonTaxableIncomeKrw when nonTaxableIncomeKrw is provided"
    );
  }

  const effectiveNonTaxableIncomeKrw =
    nonTaxableIncomeItems?.length ? nonTaxableIncomeItemTotalKrw : nonTaxableIncomeKrw;
  const effectiveTaxableIncomeKrwInput =
    taxableIncomeKrwInput ?? (taxableIncomeItems?.length ? taxableIncomeItemTotalKrw : null);
  if (effectiveNonTaxableIncomeKrw > grossPayKrw) {
    throw new ServiceError(400, "statutory.nonTaxableIncomeKrw cannot exceed grossPayKrw");
  }

  const derivedTaxableIncomeKrw = grossPayKrw - effectiveNonTaxableIncomeKrw;
  if (
    effectiveTaxableIncomeKrwInput !== null &&
    effectiveTaxableIncomeKrwInput + effectiveNonTaxableIncomeKrw !== grossPayKrw
  ) {
    throw new ServiceError(
      400,
      "statutory.taxableIncomeKrw plus statutory.nonTaxableIncomeKrw must equal grossPayKrw"
    );
  }
  const taxableBaseKrw = effectiveTaxableIncomeKrwInput ?? derivedTaxableIncomeKrw;
  const taxableSource = taxableIncomeKrwInput !== null
    ? "explicit"
    : incomeSplitItemPreset
      ? "from_income_split_item_preset"
      : taxableIncomeItems?.length
        ? "from_taxable_income_items"
        : "derived_from_gross_minus_non_taxable";
  const nonTaxableSource = nonTaxableIncomeItems?.length
    ? incomeSplitItemPreset
      ? "from_income_split_item_preset"
      : "from_non_taxable_income_items"
    : "explicit_or_default";
  const taxMethod = incomeTaxLookupTable
    ? incomeTaxLookupPreset
      ? "simple_lookup_table_preset"
      : "simple_lookup_table"
    : incomeTaxBrackets
      ? "progressive_brackets"
      : "flat_rate";
  const lookupIncomeTaxResolution = incomeTaxLookupTable
    ? calculateLookupIncomeTaxKrw(taxableBaseKrw, dependentCount, incomeTaxLookupTable)
    : null;
  const preCreditIncomeTaxKrw = lookupIncomeTaxResolution
    ? lookupIncomeTaxResolution.taxKrw
    : incomeTaxBrackets
      ? calculateProgressiveIncomeTaxKrw(taxableBaseKrw, incomeTaxBrackets)
      : toKrwInteger(Math.round(taxableBaseKrw * incomeTaxRate), "statutory.incomeTaxKrw");
  const selectedIncomeTaxLookupRow = lookupIncomeTaxResolution
    ? lookupIncomeTaxResolution.selectedIncomeTaxLookupRow
    : null;
  const selectedIncomeTaxLookupDependentTier = lookupIncomeTaxResolution
    ? lookupIncomeTaxResolution.selectedIncomeTaxLookupDependentTier
    : null;
  const dependentTaxCreditKrw = dependentCount * dependentTaxCreditPerPersonKrw;
  const totalTaxCreditKrw = additionalTaxCreditKrw + dependentTaxCreditKrw;
  const incomeTaxKrw = toKrwInteger(
    Math.max(preCreditIncomeTaxKrw - totalTaxCreditKrw, 0),
    "statutory.incomeTaxKrw"
  );
  const localIncomeTaxKrw = toKrwInteger(
    Math.round(incomeTaxKrw * localIncomeTaxRate),
    "statutory.localIncomeTaxKrw"
  );
  const nationalPensionBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.statutory?.nationalPensionCapKrw,
    "statutory.nationalPensionCapKrw"
  );
  const healthInsuranceBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.statutory?.healthInsuranceCapKrw,
    "statutory.healthInsuranceCapKrw"
  );
  const employmentInsuranceBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.statutory?.employmentInsuranceCapKrw,
    "statutory.employmentInsuranceCapKrw"
  );
  const nationalPensionRawKrw = nationalPensionBaseKrw * nationalPensionRate;
  const nationalPensionKrw = roundKrwByRule(
    nationalPensionRawKrw,
    "statutory.nationalPensionKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.nationalPensionUnitKrw
  );
  const healthInsuranceRawKrw = healthInsuranceBaseKrw * healthInsuranceRate;
  const healthInsuranceKrw = roundKrwByRule(
    healthInsuranceRawKrw,
    "statutory.healthInsuranceKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.healthInsuranceUnitKrw
  );
  const longTermCareRawKrw = healthInsuranceKrw * longTermCareRateOnHealth;
  const longTermCareKrw = roundKrwByRule(
    longTermCareRawKrw,
    "statutory.longTermCareKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.longTermCareUnitKrw
  );
  const employmentInsuranceRawKrw = employmentInsuranceBaseKrw * employmentInsuranceRate;
  const employmentInsuranceKrw = roundKrwByRule(
    employmentInsuranceRawKrw,
    "statutory.employmentInsuranceKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.employmentInsuranceUnitKrw
  );
  const workersCompensationRawKrw = taxableBaseKrw * workersCompensationRate;
  const workersCompensationKrw = roundKrwByRule(
    workersCompensationRawKrw,
    "statutory.workersCompensationKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.employmentInsuranceUnitKrw
  );

  const withholdingTaxKrw = toKrwInteger(incomeTaxKrw + localIncomeTaxKrw, "withholdingTaxKrw");
  const insuranceBreakdown = {
    nps: nationalPensionKrw,
    nhi: healthInsuranceKrw,
    ei: employmentInsuranceKrw,
    wci: workersCompensationKrw
  };
  const socialInsuranceKrw = toKrwInteger(
    nationalPensionKrw +
      healthInsuranceKrw +
      longTermCareKrw +
      employmentInsuranceKrw +
      workersCompensationKrw,
    "socialInsuranceKrw"
  );

  const periodStartSeoul = toSeoulDateTimeParts(input.periodStart);
  const periodEndSeoul = toSeoulDateTimeParts(input.periodEnd);

  const additionalBreakdown: Record<string, unknown> = {
    statutoryModel: "kr_baseline_v1",
    taxMethod,
    taxableBaseKrw,
    incomeSplitKrw: {
      grossPayKrw,
      nonTaxableIncomeKrw: effectiveNonTaxableIncomeKrw,
      taxableIncomeKrw: taxableBaseKrw,
      taxableSource,
      nonTaxableSource,
      validated: true
    },
    incomeSplitItems: {
      taxableIncomeItems: taxableIncomeItems ?? [],
      nonTaxableIncomeItems: nonTaxableIncomeItems ?? [],
      taxableIncomeItemTotalKrw,
      nonTaxableIncomeItemTotalKrw
    },
    incomeSplitItemPreset: incomeSplitItemPreset
      ? {
        id: incomeSplitItemPreset.id,
        label: incomeSplitItemPreset.label,
        effectiveFrom: incomeSplitItemPreset.effectiveFrom,
        source: incomeSplitItemPreset.source,
        taxableTemplate: incomeSplitItemPreset.taxableTemplate,
        nonTaxableTemplate: incomeSplitItemPreset.nonTaxableTemplate
      }
      : null,
    incomeTaxBrackets,
    incomeTaxLookupTable,
    incomeTaxLookupTableChecksum,
    incomeTaxLookupPreset: incomeTaxLookupPreset
      ? {
        id: incomeTaxLookupPreset.id,
        label: incomeTaxLookupPreset.label,
        effectiveFrom: incomeTaxLookupPreset.effectiveFrom,
        source: incomeTaxLookupPreset.source
      }
      : null,
    incomeTaxLookupPresetAuto: {
      enabled: incomeTaxLookupPresetAuto,
      autoSelected: incomeTaxLookupPresetAuto && Boolean(autoSelectedIncomeTaxLookupPreset),
      resolvedBy: incomeTaxLookupAsOfInput ? "statutory.incomeTaxLookupAsOf" : "periodEnd",
      asOf: incomeTaxLookupAsOf.toISOString()
    },
    selectedIncomeTaxLookupRow,
    selectedIncomeTaxLookupDependentTier,
    contributionBasesKrw: {
      nationalPensionBaseKrw,
      healthInsuranceBaseKrw,
      employmentInsuranceBaseKrw
    },
    contributionCapsKrw: {
      nationalPensionCapKrw: input.statutory?.nationalPensionCapKrw ?? null,
      healthInsuranceCapKrw: input.statutory?.healthInsuranceCapKrw ?? null,
      employmentInsuranceCapKrw: input.statutory?.employmentInsuranceCapKrw ?? null
    },
    rates: {
      incomeTaxRate,
      localIncomeTaxRate,
      nationalPensionRate,
      healthInsuranceRate,
      longTermCareRateOnHealth,
      employmentInsuranceRate,
      workersCompensationRate
    },
    insuranceRounding: {
      mode: insuranceRoundingRules.mode,
      unitsKrw: {
        nationalPensionUnitKrw: insuranceRoundingRules.nationalPensionUnitKrw,
        healthInsuranceUnitKrw: insuranceRoundingRules.healthInsuranceUnitKrw,
        longTermCareUnitKrw: insuranceRoundingRules.longTermCareUnitKrw,
        employmentInsuranceUnitKrw: insuranceRoundingRules.employmentInsuranceUnitKrw
      }
    },
    rawComponentsKrw: {
      nationalPensionKrw: nationalPensionRawKrw,
      healthInsuranceKrw: healthInsuranceRawKrw,
      longTermCareKrw: longTermCareRawKrw,
      employmentInsuranceKrw: employmentInsuranceRawKrw,
      workersCompensationKrw: workersCompensationRawKrw
    },
    components: {
      incomeTaxKrw,
      localIncomeTaxKrw,
      nationalPensionKrw,
      healthInsuranceKrw,
      longTermCareKrw,
      employmentInsuranceKrw
    },
    insuranceBreakdown,
    taxCreditsKrw: {
      preCreditIncomeTaxKrw,
      additionalTaxCreditKrw,
      dependentCount,
      dependentTaxCreditPerPersonKrw,
      dependentTaxCreditKrw,
      totalTaxCreditKrw
    },
    monthlyBoundary: {
      required: requireMonthlyBoundary,
      validated: requireMonthlyBoundary,
      periodStartSeoul: formatSeoulDateTime(periodStartSeoul),
      periodEndSeoul: formatSeoulDateTime(periodEndSeoul)
    }
  };

  return {
    withholdingTaxKrw,
    socialInsuranceKrw,
    otherDeductionsKrw,
    insuranceBreakdown,
    additionalBreakdown
  };
}
