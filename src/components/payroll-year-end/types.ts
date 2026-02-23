export type PayrollYearEndSettlementResponse = {
  summary: {
    year: number;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
      previewedRunIds: string[];
    };
    annualTotalsKrw: {
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
    };
    settlementKrw: {
      nonTaxableAnnualIncomeKrw: number;
      taxableAnnualIncomeKrw: number;
      annualIncomeTaxBeforeCreditKrw: number;
      additionalTaxCreditKrw: number;
      totalTaxCreditInputKrw: number;
      totalTaxCreditAppliedKrw: number;
      taxCreditRulesKrw: {
        earnedIncomeTaxCreditKrw: number;
        childTaxCreditKrw: number;
        additionalTaxCreditKrw: number;
      };
      taxCreditAppliedByItemKrw: {
        earnedIncomeTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        childTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        additionalTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
      };
      annualIncomeTaxAfterCreditKrw: number;
      annualLocalIncomeTaxKrw: number;
      annualTaxLiabilityKrw: number;
      priorWithheldTaxKrw: number;
      withholdingDeltaKrw: number;
    };
  };
};

export type PayrollYearEndRecalculationResponse = {
  recalculation: {
    year: number;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
      previewedRunIds: string[];
    };
    annualTotalsKrw: {
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
    };
    deductionItemsKrw: {
      personalPensionKrw: number;
      insurancePremiumKrw: number;
      medicalExpenseKrw: number;
      educationExpenseKrw: number;
      donationKrw: number;
      housingSavingsKrw: number;
      totalIncomeDeductionKrw: number;
      cappedIncomeDeductionKrw: number;
      appliedIncomeDeductionKrw: number;
      taxableAnnualIncomeBeforeDeductionKrw: number;
      taxableAnnualIncomeAfterDeductionKrw: number;
      capRulesKrw: {
        personalPensionKrw: number;
        insurancePremiumKrw: number;
        medicalExpenseKrw: number;
        educationExpenseKrw: number;
        donationKrw: number;
        housingSavingsKrw: number;
      };
      capAppliedByItemKrw: {
        personalPensionKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        insurancePremiumKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        medicalExpenseKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        educationExpenseKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        donationKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        housingSavingsKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
      };
    };
    baselineSettlementKrw: {
      nonTaxableAnnualIncomeKrw: number;
      taxableAnnualIncomeKrw: number;
      annualIncomeTaxBeforeCreditKrw: number;
      additionalTaxCreditKrw: number;
      totalTaxCreditInputKrw: number;
      totalTaxCreditAppliedKrw: number;
      taxCreditRulesKrw: {
        earnedIncomeTaxCreditKrw: number;
        childTaxCreditKrw: number;
        additionalTaxCreditKrw: number;
      };
      taxCreditAppliedByItemKrw: {
        earnedIncomeTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        childTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        additionalTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
      };
      annualIncomeTaxAfterCreditKrw: number;
      annualLocalIncomeTaxKrw: number;
      annualTaxLiabilityKrw: number;
      priorWithheldTaxKrw: number;
      withholdingDeltaKrw: number;
    };
    recalculatedSettlementKrw: {
      nonTaxableAnnualIncomeKrw: number;
      taxableAnnualIncomeKrw: number;
      annualIncomeTaxBeforeCreditKrw: number;
      additionalTaxCreditKrw: number;
      totalTaxCreditInputKrw: number;
      totalTaxCreditAppliedKrw: number;
      taxCreditRulesKrw: {
        earnedIncomeTaxCreditKrw: number;
        childTaxCreditKrw: number;
        additionalTaxCreditKrw: number;
      };
      taxCreditAppliedByItemKrw: {
        earnedIncomeTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        childTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
        additionalTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean };
      };
      annualIncomeTaxAfterCreditKrw: number;
      annualLocalIncomeTaxKrw: number;
      annualTaxLiabilityKrw: number;
      priorWithheldTaxKrw: number;
      withholdingDeltaKrw: number;
    };
    deltaKrw: {
      annualTaxLiabilityDeltaKrw: number;
      withholdingDeltaChangeKrw: number;
      taxableIncomeReductionKrw: number;
    };
  };
};

export type PayrollWithholdingReceiptResponse = {
  receipt: {
    year: number;
    employeeId: string;
    issue: boolean;
    canIssue: boolean;
    issued: boolean;
    receiptNumber: string;
    issuerName: string;
    issuedAt: string | null;
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
      undistributedRuns: number;
      pendingReceiptRuns: number;
      previewedRunIds: string[];
      undistributedRunIds: string[];
      pendingReceiptRunIds: string[];
    };
    annualTotalsKrw: {
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
    };
    blockingReasons: string[];
  };
};

export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};

export function currentYear() {
  return new Date().getFullYear();
}

export function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")} KRW`;
}
