import type { PayableMinutes } from "@/lib/payroll-rules";
import type { DataAccess, PayrollRunEntity } from "@/features/shared/data-access";
import type {
  PayslipDeliveryChannel,
  PayrollYearEndFilingAckStatus,
  PayrollYearEndFilingExportFormat,
  PayrollYearEndFilingTransport,
  PayrollYearEndFilingValidationMode,
  PayrollYearEndWithholdingReceiptDocumentFormat,
  YearEndAppliedReasonCode,
  YearEndDeductionCapAppliedBreakdownKrw,
  YearEndDeductionEligibilityInput,
  YearEndDeductionItemsInput,
  YearEndTaxCreditCapAppliedBreakdownKrw,
  YearEndTaxCreditItemsInput
} from "@/features/payroll/service-input-types";
import type { InsuranceRoundingMode } from "@/features/payroll/service-statutory-adapter-helpers";
export type PreviewPayrollResult = {
  run: PayrollRunEntity;
  summary: {
    sourceRecordCount: number;
    totals: PayableMinutes;
    grossPayKrw: number;
  };
};

export type PreviewPayrollWithDeductionsResult = {
  run: PayrollRunEntity;
  summary: {
    deductionMode: "manual" | "profile" | "statutory_kr_baseline";
    profileId: string | null;
    profileVersion: number | null;
    sourceRecordCount: number;
    totals: PayableMinutes;
    grossPayKrw: number;
    withholdingTaxKrw: number;
    socialInsuranceKrw: number;
    otherDeductionsKrw: number;
    totalDeductionsKrw: number;
    netPayKrw: number;
    deductionBreakdown: Record<string, unknown>;
  };
};

export type PreviewPayrollInsuranceSettlementResult = {
  summary: {
    sourceRecordCount: number;
    totals: PayableMinutes;
    grossPayKrw: number;
    taxableBaseKrw: number;
    rounding: {
      mode: InsuranceRoundingMode;
      unitsKrw: {
        nationalPensionUnitKrw: number;
        healthInsuranceUnitKrw: number;
        longTermCareUnitKrw: number;
        employmentInsuranceUnitKrw: number;
        industrialAccidentUnitKrw: number;
      };
    };
    rawContributionKrw: {
      employee: {
        nationalPensionKrw: number;
        healthInsuranceKrw: number;
        longTermCareKrw: number;
        employmentInsuranceKrw: number;
      };
      employer: {
        nationalPensionKrw: number;
        healthInsuranceKrw: number;
        longTermCareKrw: number;
        employmentInsuranceKrw: number;
        industrialAccidentKrw: number;
      };
    };
    employeeContributionKrw: {
      nationalPensionKrw: number;
      healthInsuranceKrw: number;
      longTermCareKrw: number;
      employmentInsuranceKrw: number;
      totalKrw: number;
    };
    employerContributionKrw: {
      nationalPensionKrw: number;
      healthInsuranceKrw: number;
      longTermCareKrw: number;
      employmentInsuranceKrw: number;
      industrialAccidentKrw: number;
      totalKrw: number;
    };
    contributionBasesKrw: {
      nationalPensionBaseKrw: number;
      healthInsuranceBaseKrw: number;
      employmentInsuranceBaseKrw: number;
      industrialAccidentBaseKrw: number;
    };
    settlementKrw: {
      priorWithheldKrw: number;
      priorEmployerPaidKrw: number;
      employeeDeltaKrw: number;
      employerDeltaKrw: number;
      totalDeltaKrw: number;
    };
  };
};

export type ClosePayrollPeriodResult = {
  summary: {
    periodStart: string;
    periodEnd: string;
    apply: boolean;
    canClose: boolean;
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
      blockingRunIds: string[];
      blockingReasons: string[];
    };
    totalsKrw: {
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
    };
    settlementKrw: {
      priorPaidWithholdingTaxKrw: number;
      priorPaidSocialInsuranceKrw: number;
      priorPaidNetPayKrw: number;
      withholdingTaxDeltaKrw: number;
      socialInsuranceDeltaKrw: number;
      netPayDeltaKrw: number;
      remittanceDeltaKrw: number;
    };
  };
};

export type DistributePayrollPayslipsResult = {
  summary: {
    periodStart: string;
    periodEnd: string;
    dryRun: boolean;
    deliveryChannel: PayslipDeliveryChannel;
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
    };
    distribution: {
      targetCount: number;
      alreadyDistributedCount: number;
      newlyDistributedCount: number;
      targetRunIds: string[];
      alreadyDistributedRunIds: string[];
      newlyDistributedRunIds: string[];
    };
  };
};

export type AcknowledgePayrollPayslipReceiptResult = {
  receipt: {
    runId: string;
    employeeId: string;
    deliveryChannel: string | null;
    distributedAt: string;
    receiptConfirmedAt: string;
    receiptConfirmedBy: string;
    alreadyConfirmed: boolean;
  };
};

export type YearEndSettlementKrw = {
  nonTaxableAnnualIncomeKrw: number;
  taxableAnnualIncomeKrw: number;
  annualIncomeTaxBeforeCreditKrw: number;
  additionalTaxCreditKrw: number;
  totalTaxCreditInputKrw: number;
  totalTaxCreditAppliedKrw: number;
  taxCreditRulesKrw: YearEndTaxCreditItemsInput;
  taxCreditAppliedByItemKrw: YearEndTaxCreditCapAppliedBreakdownKrw;
  annualIncomeTaxAfterCreditKrw: number;
  annualLocalIncomeTaxKrw: number;
  annualTaxLiabilityKrw: number;
  priorWithheldTaxKrw: number;
  withholdingDeltaKrw: number;
  additionalWithholdingDueKrw: number;
  withholdingRefundKrw: number;
};

export type YearEndRunStates = {
  totalRuns: number;
  confirmedRuns: number;
  previewedRuns: number;
  previewedRunIds: string[];
};

export type PayrollTotalsKrw = {
  grossPayKrw: number;
  withholdingTaxKrw: number;
  socialInsuranceKrw: number;
  otherDeductionsKrw: number;
  totalDeductionsKrw: number;
  netPayKrw: number;
};

export type YearEndSettlementSummary = {
  year: number;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  inputVectorHash: string;
  runStates: YearEndRunStates;
  annualTotalsKrw: PayrollTotalsKrw;
  settlementKrw: YearEndSettlementKrw;
};

export type YearEndDeductionSummaryKrw = YearEndDeductionItemsInput & {
  totalIncomeDeductionKrw: number;
  cappedIncomeDeductionKrw: number;
  appliedIncomeDeductionKrw: number;
  taxableAnnualIncomeBeforeDeductionKrw: number;
  taxableAnnualIncomeAfterDeductionKrw: number;
  capRulesKrw: YearEndDeductionItemsInput;
  capAppliedByItemKrw: YearEndDeductionCapAppliedBreakdownKrw;
};

export type PreviewPayrollYearEndSettlementResult = {
  summary: YearEndSettlementSummary;
};

export type RecalculatePayrollYearEndSettlementResult = {
  recalculation: {
    year: number;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    inputVectorHash: string;
    runStates: YearEndRunStates;
    annualTotalsKrw: PayrollTotalsKrw;
    deductionEligibility: YearEndDeductionEligibilityInput;
    deductionEligibilityBlockingReasons: string[];
    deductionItemsKrw: YearEndDeductionSummaryKrw;
    baselineSettlementKrw: YearEndSettlementKrw;
    recalculatedSettlementKrw: YearEndSettlementKrw;
    deltaKrw: {
      annualTaxLiabilityDeltaKrw: number;
      withholdingDeltaChangeKrw: number;
      taxableIncomeReductionKrw: number;
    };
  };
};

export type YearEndFilingGuardRunStates = {
  totalRuns: number;
  confirmedRuns: number;
  previewedRuns: number;
  undistributedRuns: number;
  pendingReceiptRuns: number;
  previewedRunIds: string[];
  undistributedRunIds: string[];
  pendingReceiptRunIds: string[];
};

export type YearEndFilingRecord = {
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
};

export type FinalizePayrollYearEndSettlementResult = {
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
    inputVectorHash: string;
    runStates: YearEndFilingGuardRunStates;
    annualTotalsKrw: PayrollTotalsKrw;
    deductionEligibility: YearEndDeductionEligibilityInput;
    deductionEligibilityBlockingReasons: string[];
    deductionItemsKrw: YearEndDeductionSummaryKrw;
    settlementKrw: YearEndSettlementKrw;
    settlementHash: string;
    blockingReasons: string[];
  };
};

export type ExportPayrollYearEndFilingDataResult = {
  filingData: {
    year: number;
    employeeId: string;
    finalizationId: string;
    settlementHash: string;
    finalizedAt: string;
    exportedAt: string;
    format: PayrollYearEndFilingExportFormat;
    validationMode: PayrollYearEndFilingValidationMode;
    runStates: YearEndFilingGuardRunStates;
    annualTotalsKrw: PayrollTotalsKrw;
    deductionItemsKrw: YearEndDeductionSummaryKrw;
    settlementKrw: YearEndSettlementKrw;
    records: YearEndFilingRecord[];
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

export type PayrollYearEndFilingSubmissionStatus = "submitted" | "acknowledged" | "canceled";

export type PayrollYearEndFilingSubmissionSummary = {
  submissionId: string;
  year: number;
  employeeId: string;
  attempt: number;
  resubmissionOfSubmissionId: string | null;
  resubmissionReason: string | null;
  finalizationId: string;
  settlementHash: string | null;
  format: PayrollYearEndFilingExportFormat;
  validationMode: PayrollYearEndFilingValidationMode;
  transport: PayrollYearEndFilingTransport;
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
  status: PayrollYearEndFilingSubmissionStatus;
  ack: {
    ackStatus: PayrollYearEndFilingAckStatus;
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

export type SubmitPayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

export type ResubmitPayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

export type AcknowledgePayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

export type CancelPayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

export type ReopenPayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

export type PayrollYearEndFilingSubmissionListSummary = {
  totalCount: number;
  filteredCount: number;
  statusCounts: {
    submitted: number;
    acknowledged: number;
    canceled: number;
  };
  ackStatusCounts: {
    accepted: number;
    rejected: number;
    none: number;
  };
  validationStatusCounts: {
    pass: number;
    fail: number;
  };
  transportCounts: {
    manual_portal: number;
    hometax_upload: number;
    nts_api_mock: number;
  };
};

export type ListPayrollYearEndFilingSubmissionsResult = {
  summary: PayrollYearEndFilingSubmissionListSummary;
  submissions: PayrollYearEndFilingSubmissionSummary[];
};

export type PayrollYearEndFilingTimelineAction =
  | "submitted"
  | "resubmitted"
  | "canceled"
  | "reopened"
  | "acknowledged"
  | "evidence_note_added";

export type PayrollYearEndFilingTimelineEntry = {
  action: PayrollYearEndFilingTimelineAction;
  submissionId: string;
  occurredAt: string;
  actorRole: string;
  actorId: string | null;
  attempt: number | null;
  submissionNote: string | null;
  resubmissionOfSubmissionId: string | null;
  resubmissionReason: string | null;
  ackStatus: PayrollYearEndFilingAckStatus | null;
  ackCode: string | null;
  ackNote: string | null;
  rejectionReasonCode: string | null;
  rejectionReasonDetail: string | null;
  evidenceNote: string | null;
};

export type ListPayrollYearEndFilingSubmissionTimelineResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
  timeline: PayrollYearEndFilingTimelineEntry[];
};

export type PayrollYearEndFilingEvidenceNoteSummary = {
  submissionId: string;
  year: number;
  employeeId: string;
  note: string;
  notedAt: string;
  notedByRole: string;
  notedById: string | null;
};

export type AddPayrollYearEndFilingEvidenceNoteResult = {
  evidenceNote: PayrollYearEndFilingEvidenceNoteSummary;
};

export type PayrollYearEndFilingAckCodeCatalogItem = {
  code: string;
  label: string;
  description: string;
  defaultNote: string | null;
};

export type PayrollYearEndFilingRejectionReasonCatalogItem = {
  code: string;
  label: string;
  description: string;
};

export type ListPayrollYearEndFilingAckCatalogResult = {
  acceptedCodes: PayrollYearEndFilingAckCodeCatalogItem[];
  rejectedCodes: PayrollYearEndFilingAckCodeCatalogItem[];
  rejectionReasons: PayrollYearEndFilingRejectionReasonCatalogItem[];
};

export type PayrollYearEndWithholdingReceiptSummary = {
  year: number;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  issue: boolean;
  canIssue: boolean;
  issued: boolean;
  receiptNumber: string;
  issuerName: string;
  issuedAt: string | null;
  runStates: YearEndFilingGuardRunStates;
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

export type IssuePayrollYearEndWithholdingReceiptResult = {
  receipt: PayrollYearEndWithholdingReceiptSummary;
};

export type GetPayrollYearEndWithholdingReceiptDocumentResult = {
  document: {
    year: number;
    employeeId: string;
    receiptNumber: string;
    issuedAt: string;
    issuerName: string;
    format: PayrollYearEndWithholdingReceiptDocumentFormat;
    fileName: string;
    contentType: string;
    contentSha256: string;
    generatedAt: string;
    receipt: PayrollYearEndWithholdingReceiptSummary;
    content: string;
  };
};

export type GetPayrollYearEndFinalizedSettlementResult = {
  settlement: {
    year: number;
    employeeId: string;
    finalizationId: string;
    finalizedAt: string;
    settlementHash: string;
    annualTotalsKrw: PayrollTotalsKrw;
    settlementKrw: YearEndSettlementKrw;
    deductionEligibility: YearEndDeductionEligibilityInput;
    deductionItemsKrw: YearEndDeductionSummaryKrw;
    runStates: YearEndFilingGuardRunStates;
  };
};

export type GetPayrollYearEndInsuranceReconciliationReportResult = {
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
      applicationReasonCode: YearEndAppliedReasonCode | null;
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

export type GetPayrollYearEndPreflightChecklistResult = {
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

export type UpsertDeductionProfileResult = {
  profile: Awaited<ReturnType<DataAccess["deductionProfiles"]["upsert"]>>;
};

export type ListDeductionProfilesInput = {
  active?: boolean;
  mode?: "manual" | "profile";
};

export type ListPayrollRunsInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  state?: "PREVIEWED" | "CONFIRMED";
};

export type PayrollComputation = {
  recordsCount: number;
  totals: PayableMinutes;
  grossPayKrw: number;
};
