import type { FinalizedYearEndSettlementResponse } from "@/components/withholding-receipt/types";
import { formatKrw } from "@/components/withholding-receipt/types";
import type { EmployeeYearEndInputCopy } from "@/components/payroll-year-end/employee-year-end-input-copy";

export const deductionCaps = {
  personalPensionKrw: 7_000_000,
  insurancePremiumKrw: 1_000_000,
  medicalExpenseKrw: 15_000_000,
  educationExpenseKrw: 9_000_000,
  donationKrw: 10_000_000,
  housingSavingsKrw: 4_000_000
} as const;

export const taxCreditCaps = {
  earnedIncomeTaxCreditKrw: 740_000,
  childTaxCreditKrw: 900_000,
  additionalTaxCreditKrw: 1_000_000
} as const;

export function parseNonNegativeInt(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

export function parseRate(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }
  return parsed;
}

export function isNonNegativeIntegerText(value: string) {
  return /^\d+$/.test(value.trim());
}

export type EmployeeYearEndSimulation = {
  annualGrossPayKrw: number;
  priorWithheldTaxKrw: number;
  baselineTaxLiabilityKrw: number;
  normalizedNonTaxableAnnualIncomeKrw: number;
  totalAppliedDeductionKrw: number;
  taxableAnnualIncomeKrw: number;
  totalAppliedTaxCreditKrw: number;
  annualTaxLiabilityKrw: number;
  withholdingDeltaKrw: number;
  additionalWithholdingDueKrw: number;
  withholdingRefundKrw: number;
  liabilityChangeKrw: number;
};

type BuildSimulationArgs = {
  finalizedSettlement: FinalizedYearEndSettlementResponse | null;
  nonTaxableAnnualIncomeKrw: string;
  earnedIncomeTaxCreditKrw: string;
  childTaxCreditKrw: string;
  additionalTaxCreditKrw: string;
  personalPensionKrw: string;
  insurancePremiumKrw: string;
  medicalExpenseKrw: string;
  educationExpenseKrw: string;
  donationKrw: string;
  housingSavingsKrw: string;
  annualIncomeTaxRate: string;
  localIncomeTaxRate: string;
};

export function buildEmployeeYearEndSimulation(
  args: BuildSimulationArgs
): EmployeeYearEndSimulation | null {
  const {
    finalizedSettlement,
    nonTaxableAnnualIncomeKrw,
    earnedIncomeTaxCreditKrw,
    childTaxCreditKrw,
    additionalTaxCreditKrw,
    personalPensionKrw,
    insurancePremiumKrw,
    medicalExpenseKrw,
    educationExpenseKrw,
    donationKrw,
    housingSavingsKrw,
    annualIncomeTaxRate,
    localIncomeTaxRate
  } = args;

  if (!finalizedSettlement) {
    return null;
  }

  const annualGrossPayKrw = finalizedSettlement.settlement.annualTotalsKrw.grossPayKrw;
  const priorWithheldTaxKrw = finalizedSettlement.settlement.settlementKrw.priorWithheldTaxKrw;
  const baselineTaxLiabilityKrw = finalizedSettlement.settlement.settlementKrw.annualTaxLiabilityKrw;
  const normalizedNonTaxableAnnualIncomeKrw = Math.min(
    parseNonNegativeInt(nonTaxableAnnualIncomeKrw),
    annualGrossPayKrw
  );
  const normalizedTaxCreditInputs = {
    earnedIncomeTaxCreditKrw: parseNonNegativeInt(earnedIncomeTaxCreditKrw),
    childTaxCreditKrw: parseNonNegativeInt(childTaxCreditKrw),
    additionalTaxCreditKrw: parseNonNegativeInt(additionalTaxCreditKrw)
  };
  const normalizedDeductions = {
    personalPensionKrw: parseNonNegativeInt(personalPensionKrw),
    insurancePremiumKrw: parseNonNegativeInt(insurancePremiumKrw),
    medicalExpenseKrw: parseNonNegativeInt(medicalExpenseKrw),
    educationExpenseKrw: parseNonNegativeInt(educationExpenseKrw),
    donationKrw: parseNonNegativeInt(donationKrw),
    housingSavingsKrw: parseNonNegativeInt(housingSavingsKrw)
  };
  const appliedDeductions = {
    personalPensionKrw: Math.min(normalizedDeductions.personalPensionKrw, deductionCaps.personalPensionKrw),
    insurancePremiumKrw: Math.min(normalizedDeductions.insurancePremiumKrw, deductionCaps.insurancePremiumKrw),
    medicalExpenseKrw: Math.min(normalizedDeductions.medicalExpenseKrw, deductionCaps.medicalExpenseKrw),
    educationExpenseKrw: Math.min(normalizedDeductions.educationExpenseKrw, deductionCaps.educationExpenseKrw),
    donationKrw: Math.min(normalizedDeductions.donationKrw, deductionCaps.donationKrw),
    housingSavingsKrw: Math.min(normalizedDeductions.housingSavingsKrw, deductionCaps.housingSavingsKrw)
  };
  const totalAppliedDeductionKrw = Object.values(appliedDeductions).reduce((sum, value) => sum + value, 0);
  const taxableBeforeDeductionKrw = Math.max(annualGrossPayKrw - normalizedNonTaxableAnnualIncomeKrw, 0);
  const taxableAnnualIncomeKrw = Math.max(taxableBeforeDeductionKrw - totalAppliedDeductionKrw, 0);

  const appliedTaxCredits = {
    earnedIncomeTaxCreditKrw: Math.min(
      normalizedTaxCreditInputs.earnedIncomeTaxCreditKrw,
      taxCreditCaps.earnedIncomeTaxCreditKrw
    ),
    childTaxCreditKrw: Math.min(
      normalizedTaxCreditInputs.childTaxCreditKrw,
      taxCreditCaps.childTaxCreditKrw
    ),
    additionalTaxCreditKrw: Math.min(
      normalizedTaxCreditInputs.additionalTaxCreditKrw,
      taxCreditCaps.additionalTaxCreditKrw
    )
  };
  const totalAppliedTaxCreditKrw = Object.values(appliedTaxCredits).reduce((sum, value) => sum + value, 0);

  const annualRate = parseRate(annualIncomeTaxRate, 0.03);
  const localRate = parseRate(localIncomeTaxRate, 0.1);
  const annualIncomeTaxBeforeCreditKrw = Math.round(taxableAnnualIncomeKrw * annualRate);
  const annualIncomeTaxAfterCreditKrw = Math.max(
    annualIncomeTaxBeforeCreditKrw - totalAppliedTaxCreditKrw,
    0
  );
  const annualLocalIncomeTaxKrw = Math.round(annualIncomeTaxAfterCreditKrw * localRate);
  const annualTaxLiabilityKrw = annualIncomeTaxAfterCreditKrw + annualLocalIncomeTaxKrw;
  const withholdingDeltaKrw = annualTaxLiabilityKrw - priorWithheldTaxKrw;

  return {
    annualGrossPayKrw,
    priorWithheldTaxKrw,
    baselineTaxLiabilityKrw,
    normalizedNonTaxableAnnualIncomeKrw,
    totalAppliedDeductionKrw,
    taxableAnnualIncomeKrw,
    totalAppliedTaxCreditKrw,
    annualTaxLiabilityKrw,
    withholdingDeltaKrw,
    additionalWithholdingDueKrw: Math.max(withholdingDeltaKrw, 0),
    withholdingRefundKrw: Math.max(-withholdingDeltaKrw, 0),
    liabilityChangeKrw: annualTaxLiabilityKrw - baselineTaxLiabilityKrw
  };
}

type BuildAccuracyGuidanceArgs = {
  copy: EmployeeYearEndInputCopy;
  runtimeLocale: string;
  finalizedSettlement: FinalizedYearEndSettlementResponse | null;
  nonTaxableWithinGrossValid: boolean;
  simulation: EmployeeYearEndSimulation | null;
  earnedIncomeTaxCreditKrw: string;
  childTaxCreditKrw: string;
  additionalTaxCreditKrw: string;
  personalPensionKrw: string;
  insurancePremiumKrw: string;
  medicalExpenseKrw: string;
  educationExpenseKrw: string;
  donationKrw: string;
  housingSavingsKrw: string;
};

export function buildEmployeeYearEndAccuracyGuidance(
  args: BuildAccuracyGuidanceArgs
): string[] {
  const {
    copy,
    runtimeLocale,
    finalizedSettlement,
    nonTaxableWithinGrossValid,
    simulation,
    earnedIncomeTaxCreditKrw,
    childTaxCreditKrw,
    additionalTaxCreditKrw,
    personalPensionKrw,
    insurancePremiumKrw,
    medicalExpenseKrw,
    educationExpenseKrw,
    donationKrw,
    housingSavingsKrw
  } = args;
  const items: string[] = [];
  const deductionInputs = [
    { label: copy.personalPensionLabel, input: parseNonNegativeInt(personalPensionKrw), cap: deductionCaps.personalPensionKrw },
    { label: copy.insurancePremiumLabel, input: parseNonNegativeInt(insurancePremiumKrw), cap: deductionCaps.insurancePremiumKrw },
    { label: copy.medicalExpenseLabel, input: parseNonNegativeInt(medicalExpenseKrw), cap: deductionCaps.medicalExpenseKrw },
    { label: copy.educationExpenseLabel, input: parseNonNegativeInt(educationExpenseKrw), cap: deductionCaps.educationExpenseKrw },
    { label: copy.donationLabel, input: parseNonNegativeInt(donationKrw), cap: deductionCaps.donationKrw },
    { label: copy.housingSavingsLabel, input: parseNonNegativeInt(housingSavingsKrw), cap: deductionCaps.housingSavingsKrw }
  ];
  for (const entry of deductionInputs) {
    if (entry.input > entry.cap) {
      items.push(
        `${copy.accuracyGuideCapAppliedPrefix}: ${entry.label} ${formatKrw(entry.input, runtimeLocale)} -> ${formatKrw(entry.cap, runtimeLocale)}`
      );
    }
  }

  const taxCreditInputs = [
    { label: copy.earnedIncomeTaxCreditLabel, input: parseNonNegativeInt(earnedIncomeTaxCreditKrw), cap: taxCreditCaps.earnedIncomeTaxCreditKrw },
    { label: copy.childTaxCreditLabel, input: parseNonNegativeInt(childTaxCreditKrw), cap: taxCreditCaps.childTaxCreditKrw },
    { label: copy.additionalTaxCreditLabel, input: parseNonNegativeInt(additionalTaxCreditKrw), cap: taxCreditCaps.additionalTaxCreditKrw }
  ];
  for (const entry of taxCreditInputs) {
    if (entry.input > entry.cap) {
      items.push(
        `${copy.accuracyGuideCapAppliedPrefix}: ${entry.label} ${formatKrw(entry.input, runtimeLocale)} -> ${formatKrw(entry.cap, runtimeLocale)}`
      );
    }
  }

  if (!nonTaxableWithinGrossValid && finalizedSettlement) {
    items.push(
      `${copy.accuracyGuideNonTaxableAdjusted} (${formatKrw(finalizedSettlement.settlement.annualTotalsKrw.grossPayKrw, runtimeLocale)})`
    );
  }

  if (!simulation) {
    return items;
  }

  if (simulation.liabilityChangeKrw > 0) {
    items.push(
      `${copy.accuracyGuideLiabilityIncreasePrefix}: ${formatKrw(simulation.liabilityChangeKrw, runtimeLocale)}`
    );
  } else if (simulation.liabilityChangeKrw < 0) {
    items.push(
      `${copy.accuracyGuideLiabilityDecreasePrefix}: ${formatKrw(Math.abs(simulation.liabilityChangeKrw), runtimeLocale)}`
    );
  } else {
    items.push(copy.accuracyGuideLiabilityNoChange);
  }

  if (simulation.additionalWithholdingDueKrw > 0) {
    items.push(
      `${copy.accuracyGuideAdditionalDuePrefix}: ${formatKrw(simulation.additionalWithholdingDueKrw, runtimeLocale)}`
    );
  }
  if (simulation.withholdingRefundKrw > 0) {
    items.push(
      `${copy.accuracyGuideRefundPrefix}: ${formatKrw(simulation.withholdingRefundKrw, runtimeLocale)}`
    );
  }

  return items;
}
