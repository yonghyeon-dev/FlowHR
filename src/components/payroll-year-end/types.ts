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
      annualIncomeTaxAfterCreditKrw: number;
      annualLocalIncomeTaxKrw: number;
      annualTaxLiabilityKrw: number;
      priorWithheldTaxKrw: number;
      withholdingDeltaKrw: number;
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
