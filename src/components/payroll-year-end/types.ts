export type PayrollYearEndSettlementResponse = {
  summary: {
    year: number;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    inputVectorHash: string;
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
        earnedIncomeTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        childTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        additionalTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
      };
      annualIncomeTaxAfterCreditKrw: number;
      annualLocalIncomeTaxKrw: number;
      annualTaxLiabilityKrw: number;
      priorWithheldTaxKrw: number;
      withholdingDeltaKrw: number;
      additionalWithholdingDueKrw: number;
      withholdingRefundKrw: number;
    };
  };
};

export type PayrollYearEndRecalculationResponse = {
  recalculation: {
    year: number;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    inputVectorHash: string;
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
    deductionEligibility: {
      personalPensionEligible: boolean;
      insurancePremiumEligible: boolean;
      medicalExpenseEligible: boolean;
      educationExpenseEligible: boolean;
      donationEligible: boolean;
      housingSavingsEligible: boolean;
    };
    deductionEligibilityBlockingReasons: string[];
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
        personalPensionKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        insurancePremiumKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        medicalExpenseKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        educationExpenseKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        donationKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        housingSavingsKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
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
        earnedIncomeTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        childTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        additionalTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
      };
      annualIncomeTaxAfterCreditKrw: number;
      annualLocalIncomeTaxKrw: number;
      annualTaxLiabilityKrw: number;
      priorWithheldTaxKrw: number;
      withholdingDeltaKrw: number;
      additionalWithholdingDueKrw: number;
      withholdingRefundKrw: number;
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
        earnedIncomeTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        childTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
        additionalTaxCreditKrw: { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean; applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED"; applicationReason: string };
      };
      annualIncomeTaxAfterCreditKrw: number;
      annualLocalIncomeTaxKrw: number;
      annualTaxLiabilityKrw: number;
      priorWithheldTaxKrw: number;
      withholdingDeltaKrw: number;
      additionalWithholdingDueKrw: number;
      withholdingRefundKrw: number;
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

export type PayrollYearEndInsuranceReconciliationReportResponse = {
  report: {
    year: number;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
      confirmedRunIds: string[];
      previewedRunIds: string[];
    };
    annualRunSocialInsuranceKrw: number;
    finalization: {
      finalized: boolean;
      finalizationId: string | null;
      settlementHash: string | null;
      finalizedAt: string | null;
      insurancePremiumInputKrw: number | null;
      insurancePremiumAppliedKrw: number | null;
      insurancePremiumCapKrw: number | null;
      applicationReasonCode: "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED" | null;
      applicationReason: string | null;
    };
    reconciliation: {
      baselineKrw: number;
      comparedKrw: number;
      deltaKrw: number;
      status: "matched" | "mismatch" | "pending_finalization";
    };
    monthlyBreakdown: Array<{
      month: string;
      runCount: number;
      confirmedRunCount: number;
      previewedRunCount: number;
      grossPayKrw: number;
      socialInsuranceKrw: number;
      withholdingTaxKrw: number;
    }>;
  };
};

export type PayrollYearEndPreflightChecklistResponse = {
  checklist: {
    year: number;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    summary: {
      readyToFinalize: boolean;
      passCount: number;
      failCount: number;
      warnCount: number;
    };
    metrics: {
      annualGrossPayKrw: number;
      nonTaxableAnnualIncomeKrw: number;
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
      undistributedRuns: number;
      pendingReceiptRuns: number;
      pendingSubmissionCount: number;
      rejectedSubmissionCount: number;
      settlementHash: string | null;
    };
    checks: Array<{
      key:
        | "confirmed_runs_present"
        | "no_previewed_runs"
        | "no_undistributed_runs"
        | "no_pending_receipts"
        | "non_taxable_within_annual_gross"
        | "no_pending_filing_submissions"
        | "settlement_hash_available";
      label: string;
      status: "pass" | "fail" | "warn";
      detail: string;
    }>;
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

export function formatKrw(value: number, runtimeLocale = "ko-KR") {
  return `${value.toLocaleString(runtimeLocale)} KRW`;
}
