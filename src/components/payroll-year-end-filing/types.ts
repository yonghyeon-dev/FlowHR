export type PayrollYearEndFinalizationResponse = {
  settlement: {
    year: number;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    apply: boolean;
    canFinalize: boolean;
    finalized: boolean;
    finalizationId: string;
    finalizedAt: string | null;
    finalizedByNote: string | null;
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
    deductionItemsKrw: {
      personalPensionKrw: number;
      insurancePremiumKrw: number;
      medicalExpenseKrw: number;
      educationExpenseKrw: number;
      donationKrw: number;
      housingSavingsKrw: number;
      totalIncomeDeductionKrw: number;
      appliedIncomeDeductionKrw: number;
      taxableAnnualIncomeBeforeDeductionKrw: number;
      taxableAnnualIncomeAfterDeductionKrw: number;
    };
    settlementKrw: {
      annualTaxLiabilityKrw: number;
      withholdingDeltaKrw: number;
      taxableAnnualIncomeKrw: number;
    };
    blockingReasons: string[];
  };
};

export type PayrollYearEndFilingExportResponse = {
  filingData: {
    year: number;
    employeeId: string;
    finalizationId: string;
    finalizedAt: string;
    exportedAt: string;
    format: "json" | "csv" | "jsonl" | "hometax_csv";
    validationMode: "basic" | "strict";
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
      undistributedRuns: number;
      pendingReceiptRuns: number;
    };
    annualTotalsKrw: {
      grossPayKrw: number;
      withholdingTaxKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
    };
    settlementKrw: {
      annualTaxLiabilityKrw: number;
      withholdingDeltaKrw: number;
    };
    records: Array<{
      runId: string;
      periodStart: string;
      periodEnd: string;
      state: string;
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
      payslipDistributedAt: string | null;
      payslipReceiptConfirmedAt: string | null;
    }>;
    csv: string | null;
    artifact: {
      fileName: string;
      contentType: string;
      checksumSha256: string;
      byteLength: number;
      content: string;
    };
    validation: {
      status: "pass" | "fail";
      issues: string[];
      checks: {
        totalsMatch: boolean;
        confirmedRunCountMatch: boolean;
        uniqueRunIds: boolean;
        receiptCoverage: boolean;
        nonNegativeAmounts: boolean;
      };
    };
  };
};

export type PayrollYearEndFilingSubmission = {
  submissionId: string;
  year: number;
  employeeId: string;
  attempt: number;
  resubmissionOfSubmissionId: string | null;
  resubmissionReason: string | null;
  finalizationId: string;
  format: "json" | "csv" | "jsonl" | "hometax_csv";
  validationMode: "basic" | "strict";
  transport: "manual_portal" | "hometax_upload" | "nts_api_mock";
  artifact: {
    fileName: string;
    contentType: string;
    checksumSha256: string;
    byteLength: number;
  };
  validationStatus: "pass" | "fail";
  submittedAt: string;
  submittedByRole: string;
  submittedById: string | null;
  status: "submitted" | "acknowledged";
  ack: {
    ackStatus: "accepted" | "rejected";
    ackCode: string | null;
    ackNote: string | null;
    rejectionReasonCode: string | null;
    rejectionReasonDetail: string | null;
    acknowledgedAt: string;
    acknowledgedByRole: string;
    acknowledgedById: string | null;
  } | null;
  submissionNote: string | null;
};

export type PayrollYearEndFilingSubmissionResponse = {
  submission: PayrollYearEndFilingSubmission;
};

export type PayrollYearEndFilingSubmissionListResponse = {
  submissions: PayrollYearEndFilingSubmission[];
};

export type PayrollYearEndFilingAckCatalogResponse = {
  acceptedCodes: Array<{
    code: string;
    label: string;
    description: string;
    defaultNote: string | null;
  }>;
  rejectedCodes: Array<{
    code: string;
    label: string;
    description: string;
    defaultNote: string | null;
  }>;
  rejectionReasons: Array<{
    code: string;
    label: string;
    description: string;
  }>;
};

export type PayrollYearEndFilingTimelineEntry = {
  action: "submitted" | "resubmitted" | "acknowledged" | "evidence_note_added";
  submissionId: string;
  occurredAt: string;
  actorRole: string;
  actorId: string | null;
  attempt: number | null;
  submissionNote: string | null;
  resubmissionOfSubmissionId: string | null;
  resubmissionReason: string | null;
  ackStatus: "accepted" | "rejected" | null;
  ackCode: string | null;
  ackNote: string | null;
  rejectionReasonCode: string | null;
  rejectionReasonDetail: string | null;
  evidenceNote: string | null;
};

export type PayrollYearEndFilingSubmissionTimelineResponse = {
  submission: PayrollYearEndFilingSubmission;
  timeline: PayrollYearEndFilingTimelineEntry[];
};

export type PayrollYearEndFilingEvidenceNoteResponse = {
  evidenceNote: {
    submissionId: string;
    year: number;
    employeeId: string;
    note: string;
    notedAt: string;
    notedByRole: string;
    notedById: string | null;
  };
};

export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};
