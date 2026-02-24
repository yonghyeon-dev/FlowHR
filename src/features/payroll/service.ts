import type { Actor } from "@/lib/actor";
import { createHash } from "node:crypto";
import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions, type Permission } from "@/lib/rbac";
import { applyApprovalExecutionAction, assertApprovalPolicyGate } from "@/features/approval/service";
import { ensureTenantMatch, requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import {
  calculateGrossPay,
  derivePayableMinutes,
  type PayableMinutes
} from "@/lib/payroll-rules";
import type {
  DataAccess,
  DeductionProfileEntity,
  PayrollRunEntity
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ServiceError } from "@/features/shared/service-error";
import {
  getPayrollKrIncomeTaxLookupPreset,
  resolvePayrollKrIncomeTaxLookupPresetByAsOf
} from "@/features/payroll/kr-income-tax-lookup-presets";
import { getPayrollKrIncomeSplitItemPreset } from "@/features/payroll/kr-income-split-item-presets";
import {
  applyYearEndDeductionCaps as applyYearEndDeductionCapsCore,
  buildYearEndInputVectorHash as buildYearEndInputVectorHashCore,
  calculateYearEndSettlementKrw as calculateYearEndSettlementKrwCore,
  collectYearEndDeductionEligibilityBlockingReasons as collectYearEndDeductionEligibilityBlockingReasonsCore,
  normalizeYearEndDeductionEligibility as normalizeYearEndDeductionEligibilityCore,
  normalizeYearEndDeductionItems as normalizeYearEndDeductionItemsCore,
  normalizeYearEndTaxCreditItems as normalizeYearEndTaxCreditItemsCore
} from "@/features/payroll/year-end-calculation-helpers";
import {
  buildYearEndFilingArtifact as buildYearEndFilingArtifactCore,
  buildYearEndFilingRecords as buildYearEndFilingRecordsCore,
  buildYearEndWithholdingReceiptDocumentArtifact as buildYearEndWithholdingReceiptDocumentArtifactCore,
  validateYearEndFilingRecords as validateYearEndFilingRecordsCore
} from "@/features/payroll/year-end-filing-artifact-helpers";
import {
  buildYearEndFilingSubmissionListSummary as buildYearEndFilingSubmissionListSummaryCore,
  matchesYearEndFilingSubmissionFilters as matchesYearEndFilingSubmissionFiltersCore,
  sortYearEndFilingSubmissions as sortYearEndFilingSubmissionsCore
} from "@/features/payroll/year-end-filing-submission-query-helpers";
import {
  asYearEndFinalizationAuditPayload as asYearEndFinalizationAuditPayloadCore,
  asYearEndWithholdingReceiptSummaryPayload as asYearEndWithholdingReceiptSummaryPayloadCore,
  buildYearEndSettlementHash as buildYearEndSettlementHashCore,
  normalizeYearEndSettlementHash as normalizeYearEndSettlementHashCore,
  resolveYearEndSettlementHashFromFinalizationPayload as resolveYearEndSettlementHashFromFinalizationPayloadCore
} from "@/features/payroll/year-end-audit-payload-helpers";
import {
  buildYearEndFilingSubmissionSummaries as buildYearEndFilingSubmissionSummariesCore,
  buildYearEndFilingSubmissionTimeline as buildYearEndFilingSubmissionTimelineCore
} from "@/features/payroll/year-end-filing-lifecycle-helpers";
import {
  buildYearEndFilingSubmissionId as buildYearEndFilingSubmissionIdCore,
  ensureNoPendingFilingSubmission as ensureNoPendingFilingSubmissionCore,
  listYearEndFilingLifecycleLogs as listYearEndFilingLifecycleLogsCore
} from "@/features/payroll/year-end-filing-submission-lifecycle-helpers";
import {
  buildPayrollYearEndFilingAckCatalog as buildPayrollYearEndFilingAckCatalogCore,
  resolvePayrollYearEndFilingAckPayload as resolvePayrollYearEndFilingAckPayloadCore
} from "@/features/payroll/year-end-filing-ack-catalog-helpers";
import {
  buildYearEndFilingGuard as buildYearEndFilingGuardCore,
  buildYearEndInsuranceReconciliationMonthlyBreakdown as buildYearEndInsuranceReconciliationMonthlyBreakdownCore
} from "@/features/payroll/year-end-finalization-run-helpers";
import {
  buildYearEndWithholdingReceiptGuard as buildYearEndWithholdingReceiptGuardCore,
  buildYearEndWithholdingReceiptSummary as buildYearEndWithholdingReceiptSummaryCore
} from "@/features/payroll/year-end-withholding-receipt-helpers";
import {
  ensureMonthlyBoundaryInSeoul,
  ensureValidPeriod,
  formatSeoulDateTime,
  getYearPeriodInSeoul,
  isPayrollClosePeriodEnabled,
  isPayrollDeductionProfileEnabled,
  isPayrollDeductionsEnabled,
  isPayrollKrBaselineEnabled,
  isPayrollKrInsuranceSettlementEnabled,
  isPayrollPayslipDeliveryEnabled,
  isPayrollYearEndDeductionInputEnabled,
  isPayrollYearEndEnabled,
  isPayrollYearEndFilingExportEnabled,
  isPayrollYearEndFilingSubmissionEnabled,
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
  normalizeSettlementInsuranceRoundingRules,
  normalizeStatutoryIncomeSplitItems,
  roundKrwByRule,
  type InsuranceRoundingMode
} from "@/features/payroll/service-statutory-adapter-helpers";


import type {
  AcknowledgePayrollPayslipReceiptInput,
  AcknowledgePayrollYearEndFilingPackageInput,
  AddPayrollYearEndFilingEvidenceNoteInput,
  CancelPayrollYearEndFilingPackageInput,
  ClosePayrollPeriodInput,
  DistributePayrollPayslipsInput,
  ExportPayrollYearEndFilingDataInput,
  FinalizePayrollYearEndSettlementInput,
  GetPayrollYearEndFinalizedSettlementInput,
  GetPayrollYearEndInsuranceReconciliationReportInput,
  GetPayrollYearEndPreflightChecklistInput,
  GetPayrollYearEndWithholdingReceiptDocumentInput,
  IssuePayrollYearEndWithholdingReceiptInput,
  ListPayrollYearEndFilingSubmissionTimelineInput,
  ListPayrollYearEndFilingSubmissionsInput,
  PayslipDeliveryChannel,
  PayrollYearEndFilingAckStatus,
  PayrollYearEndFilingExportFormat,
  PayrollYearEndFilingSubmissionSortBy,
  PayrollYearEndFilingSubmissionSortDirection,
  PayrollYearEndFilingTransport,
  PayrollYearEndFilingValidationMode,
  PayrollYearEndWithholdingReceiptDocumentFormat,
  PreviewPayrollInput,
  PreviewPayrollInsuranceSettlementInput,
  PreviewPayrollWithDeductionsInput,
  PreviewPayrollYearEndSettlementInput,
  RecalculatePayrollYearEndSettlementInput,
  ReopenPayrollYearEndFilingPackageInput,
  ResubmitPayrollYearEndFilingPackageInput,
  SubmitPayrollYearEndFilingPackageInput,
  UpsertDeductionProfileInput,
  YearEndAppliedReasonCode,
  YearEndDeductionCapAppliedBreakdownKrw,
  YearEndDeductionEligibilityInput,
  YearEndDeductionItemsInput,
  YearEndTaxCreditCapAppliedBreakdownKrw,
  YearEndTaxCreditItemsInput
} from "@/features/payroll/service-input-types";


type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

type PreviewPayrollResult = {
  run: PayrollRunEntity;
  summary: {
    sourceRecordCount: number;
    totals: PayableMinutes;
    grossPayKrw: number;
  };
};

type PreviewPayrollWithDeductionsResult = {
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

type PreviewPayrollInsuranceSettlementResult = {
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

type ClosePayrollPeriodResult = {
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

type DistributePayrollPayslipsResult = {
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

type AcknowledgePayrollPayslipReceiptResult = {
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

type YearEndSettlementKrw = {
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

type YearEndRunStates = {
  totalRuns: number;
  confirmedRuns: number;
  previewedRuns: number;
  previewedRunIds: string[];
};

type PayrollTotalsKrw = {
  grossPayKrw: number;
  withholdingTaxKrw: number;
  socialInsuranceKrw: number;
  otherDeductionsKrw: number;
  totalDeductionsKrw: number;
  netPayKrw: number;
};

type YearEndSettlementSummary = {
  year: number;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  inputVectorHash: string;
  runStates: YearEndRunStates;
  annualTotalsKrw: PayrollTotalsKrw;
  settlementKrw: YearEndSettlementKrw;
};

type YearEndDeductionSummaryKrw = YearEndDeductionItemsInput & {
  totalIncomeDeductionKrw: number;
  cappedIncomeDeductionKrw: number;
  appliedIncomeDeductionKrw: number;
  taxableAnnualIncomeBeforeDeductionKrw: number;
  taxableAnnualIncomeAfterDeductionKrw: number;
  capRulesKrw: YearEndDeductionItemsInput;
  capAppliedByItemKrw: YearEndDeductionCapAppliedBreakdownKrw;
};

type PreviewPayrollYearEndSettlementResult = {
  summary: YearEndSettlementSummary;
};

type RecalculatePayrollYearEndSettlementResult = {
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

type YearEndFilingGuardRunStates = {
  totalRuns: number;
  confirmedRuns: number;
  previewedRuns: number;
  undistributedRuns: number;
  pendingReceiptRuns: number;
  previewedRunIds: string[];
  undistributedRunIds: string[];
  pendingReceiptRunIds: string[];
};

type YearEndFilingRecord = {
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

type FinalizePayrollYearEndSettlementResult = {
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

type ExportPayrollYearEndFilingDataResult = {
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

type PayrollYearEndFilingSubmissionStatus = "submitted" | "acknowledged" | "canceled";

type PayrollYearEndFilingSubmissionSummary = {
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

type SubmitPayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

type ResubmitPayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

type AcknowledgePayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

type CancelPayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

type ReopenPayrollYearEndFilingPackageResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
};

type PayrollYearEndFilingSubmissionListSummary = {
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

type ListPayrollYearEndFilingSubmissionsResult = {
  summary: PayrollYearEndFilingSubmissionListSummary;
  submissions: PayrollYearEndFilingSubmissionSummary[];
};

type PayrollYearEndFilingTimelineAction =
  | "submitted"
  | "resubmitted"
  | "canceled"
  | "reopened"
  | "acknowledged"
  | "evidence_note_added";

type PayrollYearEndFilingTimelineEntry = {
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

type ListPayrollYearEndFilingSubmissionTimelineResult = {
  submission: PayrollYearEndFilingSubmissionSummary;
  timeline: PayrollYearEndFilingTimelineEntry[];
};

type PayrollYearEndFilingEvidenceNoteSummary = {
  submissionId: string;
  year: number;
  employeeId: string;
  note: string;
  notedAt: string;
  notedByRole: string;
  notedById: string | null;
};

type AddPayrollYearEndFilingEvidenceNoteResult = {
  evidenceNote: PayrollYearEndFilingEvidenceNoteSummary;
};

type PayrollYearEndFilingAckCodeCatalogItem = {
  code: string;
  label: string;
  description: string;
  defaultNote: string | null;
};

type PayrollYearEndFilingRejectionReasonCatalogItem = {
  code: string;
  label: string;
  description: string;
};

type ListPayrollYearEndFilingAckCatalogResult = {
  acceptedCodes: PayrollYearEndFilingAckCodeCatalogItem[];
  rejectedCodes: PayrollYearEndFilingAckCodeCatalogItem[];
  rejectionReasons: PayrollYearEndFilingRejectionReasonCatalogItem[];
};

type PayrollYearEndWithholdingReceiptSummary = {
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

type IssuePayrollYearEndWithholdingReceiptResult = {
  receipt: PayrollYearEndWithholdingReceiptSummary;
};

type GetPayrollYearEndWithholdingReceiptDocumentResult = {
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

type GetPayrollYearEndFinalizedSettlementResult = {
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

type GetPayrollYearEndInsuranceReconciliationReportResult = {
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

type GetPayrollYearEndPreflightChecklistResult = {
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

type UpsertDeductionProfileResult = {
  profile: Awaited<ReturnType<DataAccess["deductionProfiles"]["upsert"]>>;
};

type ListDeductionProfilesInput = {
  active?: boolean;
  mode?: "manual" | "profile";
};

type ListPayrollRunsInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  state?: "PREVIEWED" | "CONFIRMED";
};

type PayrollComputation = {
  recordsCount: number;
  totals: PayableMinutes;
  grossPayKrw: number;
};

const emptyTotals: PayableMinutes = {
  regular: 0,
  overtime: 0,
  night: 0,
  holiday: 0
};

async function requirePayrollPermission(
  context: ServiceContext,
  permission: Permission,
  action: "preview" | "confirm" | "list"
) {
  await requirePermission(context, permission, `payroll ${action} requires ${permission}`);
}

async function requireDeductionProfilePermission(
  context: ServiceContext,
  permission: Permission,
  action: "read" | "write"
) {
  await requirePermission(context, permission, `deduction profile ${action} requires ${permission}`);
}

function buildPayrollYearEndFilingAckCatalog(): ListPayrollYearEndFilingAckCatalogResult {
  return buildPayrollYearEndFilingAckCatalogCore() as ListPayrollYearEndFilingAckCatalogResult;
}

function resolvePayrollYearEndFilingAckPayload(input: {
  ackStatus: PayrollYearEndFilingAckStatus;
  ackCode?: string;
  ackNote?: string;
  rejectionReasonCode?: string;
  rejectionReasonDetail?: string;
}) {
  return resolvePayrollYearEndFilingAckPayloadCore(input);
}

async function calculatePayrollComputation(
  dataAccess: DataAccess,
  input: PreviewPayrollInput,
  tenantScope: string | null
): Promise<PayrollComputation> {
  ensureValidPeriod(input.periodStart, input.periodEnd);

  const records = await dataAccess.attendance.listApprovedInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId
  });

  let totals = emptyTotals;
  for (const record of records) {
    if (!record.checkOutAt) {
      continue;
    }
    const split = derivePayableMinutes(
      record.checkInAt,
      record.checkOutAt,
      record.breakMinutes,
      record.isHoliday
    );
    totals = {
      regular: totals.regular + split.regular,
      overtime: totals.overtime + split.overtime,
      night: totals.night + split.night,
      holiday: totals.holiday + split.holiday
    };
  }

  const grossPayKrw = calculateGrossPay(totals, input.hourlyRateKrw, input.multipliers);
  return {
    recordsCount: records.length,
    totals,
    grossPayKrw
  };
}

export async function previewPayroll(
  context: ServiceContext,
  input: PreviewPayrollInput
): Promise<PreviewPayrollResult> {
  await requirePayrollPermission(context, Permissions.payrollRunPreview, "preview");
  const tenantScope = resolveTenantScope(context.actor);

  const employee = input.employeeId
    ? await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId)
    : null;

  const computed = await calculatePayrollComputation(context.dataAccess, input, tenantScope);
  const run = await context.dataAccess.payroll.create({
    organizationId: employee?.organizationId ?? tenantScope ?? null,
    employeeId: input.employeeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    grossPayKrw: computed.grossPayKrw,
    sourceRecordCount: computed.recordsCount
  });

  await context.dataAccess.audit.append({
    action: "payroll.calculated",
    entityType: "PayrollRun",
    entityId: run.id,
    organizationId: run.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw
    }
  });
  await getEventPublisher(context).publish({
    name: "payroll.calculated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: run.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId ?? null,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw
    }
  });

  return {
    run,
    summary: {
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw
    }
  };
}

export async function previewPayrollWithDeductions(
  context: ServiceContext,
  input: PreviewPayrollWithDeductionsInput
): Promise<PreviewPayrollWithDeductionsResult> {
  await requirePayrollPermission(context, Permissions.payrollRunPreview, "preview");
  if (!isPayrollDeductionsEnabled()) {
    throw new ServiceError(409, "payroll_deductions_v1 feature flag is disabled");
  }

  const tenantScope = resolveTenantScope(context.actor);
  const employee = input.employeeId
    ? await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId)
    : null;

  const computed = await calculatePayrollComputation(context.dataAccess, input, tenantScope);
  const deductionMode = input.deductionMode;
  let withholdingTaxKrw = 0;
  let socialInsuranceKrw = 0;
  let otherDeductionsKrw = 0;
  let profileId: string | null = null;
  let profileVersion: number | null = null;
  const additionalBreakdown: Record<string, unknown> = {};

  if (deductionMode === "manual") {
    withholdingTaxKrw = toKrwInteger(input.deductions.withholdingTaxKrw, "withholdingTaxKrw");
    socialInsuranceKrw = toKrwInteger(input.deductions.socialInsuranceKrw, "socialInsuranceKrw");
    otherDeductionsKrw = toKrwInteger(input.deductions.otherDeductionsKrw, "otherDeductionsKrw");

    const manualAdditional: Record<string, number> = {};
    for (const [name, amount] of Object.entries(input.deductions.breakdown ?? {})) {
      manualAdditional[name] = toKrwInteger(amount, `deductions.breakdown.${name}`);
    }
    Object.assign(additionalBreakdown, manualAdditional);
  } else if (deductionMode === "profile") {
    if (!isPayrollDeductionProfileEnabled()) {
      throw new ServiceError(409, "payroll_deduction_profile_v1 feature flag is disabled");
    }

    const profile = await context.dataAccess.deductionProfiles.findById(input.profileId);
    if (!profile) {
      throw new ServiceError(404, "deduction profile not found");
    }
    ensureTenantMatch(tenantScope, profile.organizationId, "deduction profile not found");
    if (!profile.active) {
      throw new ServiceError(409, "deduction profile is inactive");
    }
    if (profile.mode !== "profile") {
      throw new ServiceError(409, "deduction profile mode is not profile");
    }
    if (
      input.expectedProfileVersion !== undefined &&
      input.expectedProfileVersion !== profile.version
    ) {
      throw new ServiceError(409, "deduction profile version mismatch");
    }

    const withholdingRate = toRateNumber(profile.withholdingRate, "withholdingRate") ?? 0;
    const socialInsuranceRate = toRateNumber(profile.socialInsuranceRate, "socialInsuranceRate") ?? 0;
    const fixedOtherDeductionKrw = toKrwInteger(
      profile.fixedOtherDeductionKrw,
      "fixedOtherDeductionKrw"
    );

    withholdingTaxKrw = toKrwInteger(
      Math.round(computed.grossPayKrw * withholdingRate),
      "withholdingTaxKrw"
    );
    socialInsuranceKrw = toKrwInteger(
      Math.round(computed.grossPayKrw * socialInsuranceRate),
      "socialInsuranceKrw"
    );
    otherDeductionsKrw = fixedOtherDeductionKrw;
    profileId = profile.id;
    profileVersion = profile.version;
    Object.assign(additionalBreakdown, {
      withholdingRate,
      socialInsuranceRate,
      fixedOtherDeductionKrw
    });
  } else {
    if (!isPayrollKrBaselineEnabled()) {
      throw new ServiceError(409, "payroll_kr_baseline_v1 feature flag is disabled");
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
    const incomeTaxLookupTable =
      requestedIncomeTaxLookupTable ?? presetIncomeTaxLookupTable ?? null;
    const incomeTaxLookupTableChecksum = incomeTaxLookupTable
      ? createHash("sha256").update(JSON.stringify(incomeTaxLookupTable)).digest("hex")
      : null;
    const localIncomeTaxRate =
      toRateNumber(input.statutory?.localIncomeTaxRate ?? 0.1, "statutory.localIncomeTaxRate") ??
      0;
    const nationalPensionRate =
      toRateNumber(input.statutory?.nationalPensionRate ?? 0.045, "statutory.nationalPensionRate") ??
      0;
    const healthInsuranceRate =
      toRateNumber(input.statutory?.healthInsuranceRate ?? 0.03545, "statutory.healthInsuranceRate") ??
      0;
    const longTermCareRateOnHealth =
      toRateNumber(
        input.statutory?.longTermCareRateOnHealth ?? 0.1295,
        "statutory.longTermCareRateOnHealth"
      ) ?? 0;
    const employmentInsuranceRate =
      toRateNumber(
        input.statutory?.employmentInsuranceRate ?? 0.009,
        "statutory.employmentInsuranceRate"
      ) ?? 0;
    otherDeductionsKrw = toKrwInteger(
      input.statutory?.otherDeductionsKrw ?? 0,
      "statutory.otherDeductionsKrw"
    );
    const insuranceRoundingRules = normalizeInsuranceRoundingRules(
      input.statutory?.insuranceRounding
    );
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
    if (nonTaxableIncomeKrw > computed.grossPayKrw) {
      throw new ServiceError(400, "statutory.nonTaxableIncomeKrw cannot exceed grossPayKrw");
    }
    const derivedTaxableIncomeKrwFromNumericNonTaxable = computed.grossPayKrw - nonTaxableIncomeKrw;
    const splitTaxableIncomeKrw =
      taxableIncomeKrwInput ?? derivedTaxableIncomeKrwFromNumericNonTaxable;

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
    if (effectiveNonTaxableIncomeKrw > computed.grossPayKrw) {
      throw new ServiceError(400, "statutory.nonTaxableIncomeKrw cannot exceed grossPayKrw");
    }

    const derivedTaxableIncomeKrw = computed.grossPayKrw - effectiveNonTaxableIncomeKrw;
    if (
      effectiveTaxableIncomeKrwInput !== null &&
      effectiveTaxableIncomeKrwInput + effectiveNonTaxableIncomeKrw !== computed.grossPayKrw
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

    withholdingTaxKrw = toKrwInteger(
      incomeTaxKrw + localIncomeTaxKrw,
      "withholdingTaxKrw"
    );
    socialInsuranceKrw = toKrwInteger(
      nationalPensionKrw + healthInsuranceKrw + longTermCareKrw + employmentInsuranceKrw,
      "socialInsuranceKrw"
    );

    const periodStartSeoul = toSeoulDateTimeParts(input.periodStart);
    const periodEndSeoul = toSeoulDateTimeParts(input.periodEnd);

    Object.assign(additionalBreakdown, {
      statutoryModel: "kr_baseline_v1",
      taxMethod,
      taxableBaseKrw,
      incomeSplitKrw: {
        grossPayKrw: computed.grossPayKrw,
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
      incomeTaxBrackets: incomeTaxBrackets,
      incomeTaxLookupTable: incomeTaxLookupTable,
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
        employmentInsuranceRate
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
        employmentInsuranceKrw: employmentInsuranceRawKrw
      },
      components: {
        incomeTaxKrw,
        localIncomeTaxKrw,
        nationalPensionKrw,
        healthInsuranceKrw,
        longTermCareKrw,
        employmentInsuranceKrw
      },
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
    });
  }

  const totalDeductionsKrw = withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw;
  const netPayKrw = computed.grossPayKrw - totalDeductionsKrw;
  if (netPayKrw < 0) {
    throw new ServiceError(409, "netPayKrw cannot be negative");
  }

  const deductionBreakdown: Record<string, unknown> = {
    mode: deductionMode,
    withholdingTaxKrw,
    socialInsuranceKrw,
    otherDeductionsKrw,
    ...(profileId && profileVersion
      ? {
          profile: {
            id: profileId,
            version: profileVersion
          }
        }
      : {}),
    ...(Object.keys(additionalBreakdown).length > 0 ? { additional: additionalBreakdown } : {})
  };

  const run = await context.dataAccess.payroll.create({
    organizationId: employee?.organizationId ?? tenantScope ?? null,
    employeeId: input.employeeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    grossPayKrw: computed.grossPayKrw,
    withholdingTaxKrw,
    socialInsuranceKrw,
    otherDeductionsKrw,
    totalDeductionsKrw,
    netPayKrw,
    deductionBreakdown,
    deductionProfileId: profileId,
    deductionProfileVersion: profileVersion,
    sourceRecordCount: computed.recordsCount
  });

  await context.dataAccess.audit.append({
    action: "payroll.deductions_calculated",
    entityType: "PayrollRun",
    entityId: run.id,
    organizationId: run.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw,
      deductionMode,
      profileId,
      profileVersion,
      withholdingTaxKrw,
      socialInsuranceKrw,
      otherDeductionsKrw,
      totalDeductionsKrw,
      netPayKrw,
      deductionBreakdown
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.deductions.calculated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: run.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId ?? null,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw,
      deductionMode,
      profileId,
      profileVersion,
      withholdingTaxKrw,
      socialInsuranceKrw,
      otherDeductionsKrw,
      totalDeductionsKrw,
      netPayKrw,
      deductionBreakdown
    }
  });

  return {
    run,
    summary: {
      deductionMode,
      profileId,
      profileVersion,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw,
      withholdingTaxKrw,
      socialInsuranceKrw,
      otherDeductionsKrw,
      totalDeductionsKrw,
      netPayKrw,
      deductionBreakdown
    }
  };
}

export async function previewPayrollInsuranceSettlement(
  context: ServiceContext,
  input: PreviewPayrollInsuranceSettlementInput
): Promise<PreviewPayrollInsuranceSettlementResult> {
  await requirePayrollPermission(context, Permissions.payrollRunPreview, "preview");
  if (!isPayrollKrInsuranceSettlementEnabled()) {
    throw new ServiceError(409, "payroll_kr_insurance_settlement_v1 feature flag is disabled");
  }

  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  const tenantScope = resolveTenantScope(context.actor);
  const computed = await calculatePayrollComputation(context.dataAccess, input, tenantScope);

  const nonTaxableIncomeKrw = toKrwInteger(
    input.settlement?.nonTaxableIncomeKrw ?? 0,
    "settlement.nonTaxableIncomeKrw"
  );
  const requireMonthlyBoundary = input.settlement?.requireMonthlyBoundary ?? true;
  const insuranceRoundingRules = normalizeSettlementInsuranceRoundingRules(
    input.settlement?.insuranceRounding
  );
  if (requireMonthlyBoundary) {
    ensureMonthlyBoundaryInSeoul(input.periodStart, input.periodEnd);
  }

  const nationalPensionEmployeeRate =
    toRateNumber(
      input.settlement?.nationalPensionEmployeeRate ?? 0.045,
      "settlement.nationalPensionEmployeeRate"
    ) ?? 0;
  const nationalPensionEmployerRate =
    toRateNumber(
      input.settlement?.nationalPensionEmployerRate ?? 0.045,
      "settlement.nationalPensionEmployerRate"
    ) ?? 0;
  const healthInsuranceEmployeeRate =
    toRateNumber(
      input.settlement?.healthInsuranceEmployeeRate ?? 0.03545,
      "settlement.healthInsuranceEmployeeRate"
    ) ?? 0;
  const healthInsuranceEmployerRate =
    toRateNumber(
      input.settlement?.healthInsuranceEmployerRate ?? 0.03545,
      "settlement.healthInsuranceEmployerRate"
    ) ?? 0;
  const longTermCareRateOnHealth =
    toRateNumber(
      input.settlement?.longTermCareRateOnHealth ?? 0.1295,
      "settlement.longTermCareRateOnHealth"
    ) ?? 0;
  const employmentInsuranceEmployeeRate =
    toRateNumber(
      input.settlement?.employmentInsuranceEmployeeRate ?? 0.009,
      "settlement.employmentInsuranceEmployeeRate"
    ) ?? 0;
  const employmentInsuranceEmployerRate =
    toRateNumber(
      input.settlement?.employmentInsuranceEmployerRate ?? 0.0115,
      "settlement.employmentInsuranceEmployerRate"
    ) ?? 0;
  const industrialAccidentEmployerRate =
    toRateNumber(
      input.settlement?.industrialAccidentEmployerRate ?? 0.015,
      "settlement.industrialAccidentEmployerRate"
    ) ?? 0;

  const taxableBaseKrw = Math.max(computed.grossPayKrw - nonTaxableIncomeKrw, 0);
  const nationalPensionBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.settlement?.nationalPensionCapKrw,
    "settlement.nationalPensionCapKrw"
  );
  const healthInsuranceBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.settlement?.healthInsuranceCapKrw,
    "settlement.healthInsuranceCapKrw"
  );
  const employmentInsuranceBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.settlement?.employmentInsuranceCapKrw,
    "settlement.employmentInsuranceCapKrw"
  );
  const industrialAccidentBaseKrw = taxableBaseKrw;

  const nationalPensionEmployeeRawKrw = nationalPensionBaseKrw * nationalPensionEmployeeRate;
  const nationalPensionEmployeeKrw = roundKrwByRule(
    nationalPensionEmployeeRawKrw,
    "settlement.nationalPensionEmployeeKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.nationalPensionUnitKrw
  );
  const nationalPensionEmployerRawKrw = nationalPensionBaseKrw * nationalPensionEmployerRate;
  const nationalPensionEmployerKrw = roundKrwByRule(
    nationalPensionEmployerRawKrw,
    "settlement.nationalPensionEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.nationalPensionUnitKrw
  );
  const healthInsuranceEmployeeRawKrw = healthInsuranceBaseKrw * healthInsuranceEmployeeRate;
  const healthInsuranceEmployeeKrw = roundKrwByRule(
    healthInsuranceEmployeeRawKrw,
    "settlement.healthInsuranceEmployeeKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.healthInsuranceUnitKrw
  );
  const healthInsuranceEmployerRawKrw = healthInsuranceBaseKrw * healthInsuranceEmployerRate;
  const healthInsuranceEmployerKrw = roundKrwByRule(
    healthInsuranceEmployerRawKrw,
    "settlement.healthInsuranceEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.healthInsuranceUnitKrw
  );
  const longTermCareEmployeeRawKrw = healthInsuranceEmployeeKrw * longTermCareRateOnHealth;
  const longTermCareEmployeeKrw = roundKrwByRule(
    longTermCareEmployeeRawKrw,
    "settlement.longTermCareEmployeeKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.longTermCareUnitKrw
  );
  const longTermCareEmployerRawKrw = healthInsuranceEmployerKrw * longTermCareRateOnHealth;
  const longTermCareEmployerKrw = roundKrwByRule(
    longTermCareEmployerRawKrw,
    "settlement.longTermCareEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.longTermCareUnitKrw
  );
  const employmentInsuranceEmployeeRawKrw =
    employmentInsuranceBaseKrw * employmentInsuranceEmployeeRate;
  const employmentInsuranceEmployeeKrw = roundKrwByRule(
    employmentInsuranceEmployeeRawKrw,
    "settlement.employmentInsuranceEmployeeKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.employmentInsuranceUnitKrw
  );
  const employmentInsuranceEmployerRawKrw =
    employmentInsuranceBaseKrw * employmentInsuranceEmployerRate;
  const employmentInsuranceEmployerKrw = roundKrwByRule(
    employmentInsuranceEmployerRawKrw,
    "settlement.employmentInsuranceEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.employmentInsuranceUnitKrw
  );
  const industrialAccidentEmployerRawKrw = industrialAccidentBaseKrw * industrialAccidentEmployerRate;
  const industrialAccidentEmployerKrw = roundKrwByRule(
    industrialAccidentEmployerRawKrw,
    "settlement.industrialAccidentEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.industrialAccidentUnitKrw
  );

  const employeeContributionTotalKrw = toKrwInteger(
    nationalPensionEmployeeKrw +
      healthInsuranceEmployeeKrw +
      longTermCareEmployeeKrw +
      employmentInsuranceEmployeeKrw,
    "settlement.employeeContributionTotalKrw"
  );
  const employerContributionTotalKrw = toKrwInteger(
    nationalPensionEmployerKrw +
      healthInsuranceEmployerKrw +
      longTermCareEmployerKrw +
      employmentInsuranceEmployerKrw +
      industrialAccidentEmployerKrw,
    "settlement.employerContributionTotalKrw"
  );

  const priorWithheldKrw = toKrwInteger(
    input.settlement?.priorWithheldKrw ?? 0,
    "settlement.priorWithheldKrw"
  );
  const priorEmployerPaidKrw = toKrwInteger(
    input.settlement?.priorEmployerPaidKrw ?? 0,
    "settlement.priorEmployerPaidKrw"
  );
  const employeeDeltaKrw = employeeContributionTotalKrw - priorWithheldKrw;
  const employerDeltaKrw = employerContributionTotalKrw - priorEmployerPaidKrw;
  const totalDeltaKrw = employeeDeltaKrw + employerDeltaKrw;

  await context.dataAccess.audit.append({
    action: "payroll.insurance_settlement_previewed",
    entityType: "PayrollRun",
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      employeeId: input.employeeId,
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      sourceRecordCount: computed.recordsCount,
      grossPayKrw: computed.grossPayKrw,
      taxableBaseKrw,
      requireMonthlyBoundary,
      insuranceRounding: {
        mode: insuranceRoundingRules.mode,
        unitsKrw: {
          nationalPensionUnitKrw: insuranceRoundingRules.nationalPensionUnitKrw,
          healthInsuranceUnitKrw: insuranceRoundingRules.healthInsuranceUnitKrw,
          longTermCareUnitKrw: insuranceRoundingRules.longTermCareUnitKrw,
          employmentInsuranceUnitKrw: insuranceRoundingRules.employmentInsuranceUnitKrw,
          industrialAccidentUnitKrw: insuranceRoundingRules.industrialAccidentUnitKrw
        }
      },
      employeeContributionTotalKrw,
      employerContributionTotalKrw,
      priorWithheldKrw,
      priorEmployerPaidKrw,
      employeeDeltaKrw,
      employerDeltaKrw,
      totalDeltaKrw
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.insurance_settlement.previewed.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: input.employeeId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      employeeId: input.employeeId,
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      sourceRecordCount: computed.recordsCount,
      grossPayKrw: computed.grossPayKrw,
      taxableBaseKrw,
      insuranceRoundingMode: insuranceRoundingRules.mode,
      employeeContributionTotalKrw,
      employerContributionTotalKrw,
      totalDeltaKrw
    }
  });

  return {
    summary: {
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw,
      taxableBaseKrw,
      rounding: {
        mode: insuranceRoundingRules.mode,
        unitsKrw: {
          nationalPensionUnitKrw: insuranceRoundingRules.nationalPensionUnitKrw,
          healthInsuranceUnitKrw: insuranceRoundingRules.healthInsuranceUnitKrw,
          longTermCareUnitKrw: insuranceRoundingRules.longTermCareUnitKrw,
          employmentInsuranceUnitKrw: insuranceRoundingRules.employmentInsuranceUnitKrw,
          industrialAccidentUnitKrw: insuranceRoundingRules.industrialAccidentUnitKrw
        }
      },
      rawContributionKrw: {
        employee: {
          nationalPensionKrw: nationalPensionEmployeeRawKrw,
          healthInsuranceKrw: healthInsuranceEmployeeRawKrw,
          longTermCareKrw: longTermCareEmployeeRawKrw,
          employmentInsuranceKrw: employmentInsuranceEmployeeRawKrw
        },
        employer: {
          nationalPensionKrw: nationalPensionEmployerRawKrw,
          healthInsuranceKrw: healthInsuranceEmployerRawKrw,
          longTermCareKrw: longTermCareEmployerRawKrw,
          employmentInsuranceKrw: employmentInsuranceEmployerRawKrw,
          industrialAccidentKrw: industrialAccidentEmployerRawKrw
        }
      },
      employeeContributionKrw: {
        nationalPensionKrw: nationalPensionEmployeeKrw,
        healthInsuranceKrw: healthInsuranceEmployeeKrw,
        longTermCareKrw: longTermCareEmployeeKrw,
        employmentInsuranceKrw: employmentInsuranceEmployeeKrw,
        totalKrw: employeeContributionTotalKrw
      },
      employerContributionKrw: {
        nationalPensionKrw: nationalPensionEmployerKrw,
        healthInsuranceKrw: healthInsuranceEmployerKrw,
        longTermCareKrw: longTermCareEmployerKrw,
        employmentInsuranceKrw: employmentInsuranceEmployerKrw,
        industrialAccidentKrw: industrialAccidentEmployerKrw,
        totalKrw: employerContributionTotalKrw
      },
      contributionBasesKrw: {
        nationalPensionBaseKrw,
        healthInsuranceBaseKrw,
        employmentInsuranceBaseKrw,
        industrialAccidentBaseKrw
      },
      settlementKrw: {
        priorWithheldKrw,
        priorEmployerPaidKrw,
        employeeDeltaKrw,
        employerDeltaKrw,
        totalDeltaKrw
      }
    }
  };
}

export async function confirmPayrollRun(
  context: ServiceContext,
  runId: string
): Promise<PayrollRunEntity> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const tenantScope = resolveTenantScope(context.actor);

  const run = await context.dataAccess.payroll.findById(runId);
  if (!run) {
    throw new ServiceError(404, "payroll run not found");
  }
  ensureTenantMatch(tenantScope, run.organizationId, "payroll run not found");
  if (run.state !== "PREVIEWED") {
    throw new ServiceError(409, "only previewed payroll run can be confirmed");
  }
  if (run.organizationId) {
    const execution = await applyApprovalExecutionAction(context, {
      domain: "PAYROLL",
      organizationId: run.organizationId,
      targetEntityType: "PayrollRun",
      targetEntityId: run.id,
      action: "APPROVE",
      payrollGrossPayKrw: run.grossPayKrw
    });
    if (!execution.finalized) {
      return run;
    }
  } else {
    await assertApprovalPolicyGate(context, {
      domain: "PAYROLL",
      organizationId: run.organizationId,
      payrollGrossPayKrw: run.grossPayKrw,
      targetEntityType: "PayrollRun",
      targetEntityId: run.id
    });
  }

  const confirmed = await context.dataAccess.payroll.update(runId, {
    state: "CONFIRMED",
    confirmedAt: new Date(),
    confirmedBy: context.actor!.id
  });

  await context.dataAccess.audit.append({
    action: "payroll.confirmed",
    entityType: "PayrollRun",
    entityId: confirmed.id,
    organizationId: confirmed.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id
  });
  await getEventPublisher(context).publish({
    name: "payroll.confirmed.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: confirmed.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      confirmedAt: confirmed.confirmedAt?.toISOString() ?? null
    }
  });

  return confirmed;
}

export async function listPayrollRuns(
  context: ServiceContext,
  input: ListPayrollRunsInput
): Promise<PayrollRunEntity[]> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);

  if (!canListAny && !canListOwn) {
    throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
  }

  if (!canListAny) {
    const targetEmployeeId = input.employeeId?.trim() ?? "";
    if (!targetEmployeeId || targetEmployeeId !== actor.id) {
      throw new ServiceError(403, "employees can only list their own confirmed payroll runs");
    }
    if (input.state && input.state !== "CONFIRMED") {
      throw new ServiceError(403, "employees can only access confirmed payroll runs");
    }
    // Enforce confirmed-only view for employee self-service payslips.
    input = { ...input, employeeId: targetEmployeeId, state: "CONFIRMED" };
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);

  return await context.dataAccess.payroll.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId,
    state: input.state
  });
}

function aggregatePayrollTotalsKrw(runs: PayrollRunEntity[]) {
  return runs.reduce(
    (acc, run) => {
      const withholdingTaxKrw = run.withholdingTaxKrw ?? 0;
      const socialInsuranceKrw = run.socialInsuranceKrw ?? 0;
      const otherDeductionsKrw = run.otherDeductionsKrw ?? 0;
      const totalDeductionsKrw =
        run.totalDeductionsKrw ?? withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw;
      const netPayKrw = run.netPayKrw ?? run.grossPayKrw - totalDeductionsKrw;
      return {
        grossPayKrw: acc.grossPayKrw + run.grossPayKrw,
        withholdingTaxKrw: acc.withholdingTaxKrw + withholdingTaxKrw,
        socialInsuranceKrw: acc.socialInsuranceKrw + socialInsuranceKrw,
        otherDeductionsKrw: acc.otherDeductionsKrw + otherDeductionsKrw,
        totalDeductionsKrw: acc.totalDeductionsKrw + totalDeductionsKrw,
        netPayKrw: acc.netPayKrw + netPayKrw
      };
    },
    {
      grossPayKrw: 0,
      withholdingTaxKrw: 0,
      socialInsuranceKrw: 0,
      otherDeductionsKrw: 0,
      totalDeductionsKrw: 0,
      netPayKrw: 0
    }
  );
}

type YearEndRunSnapshot = {
  organizationId: string | null;
  periodStart: Date;
  periodEnd: Date;
  runs: PayrollRunEntity[];
  confirmedRuns: PayrollRunEntity[];
  previewedRuns: PayrollRunEntity[];
  totalsKrw: PayrollTotalsKrw;
};

async function loadYearEndRunSnapshot(
  context: ServiceContext,
  year: number,
  employeeId: string
): Promise<YearEndRunSnapshot> {
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, employeeId);
  const { periodStart, periodEnd } = getYearPeriodInSeoul(year);
  const tenantScope = resolveTenantScope(context.actor);
  const runs = await context.dataAccess.payroll.listInPeriod({
    periodStart,
    periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId
  });
  const confirmedRuns = runs.filter((run) => run.state === "CONFIRMED");
  const previewedRuns = runs.filter((run) => run.state !== "CONFIRMED");
  return {
    organizationId: employee.organizationId,
    periodStart,
    periodEnd,
    runs,
    confirmedRuns,
    previewedRuns,
    totalsKrw: aggregatePayrollTotalsKrw(confirmedRuns)
  };
}

function normalizeYearEndDeductionItems(
  deductionItems: YearEndDeductionItemsInput
): YearEndDeductionItemsInput {
  return normalizeYearEndDeductionItemsCore(deductionItems, toKrwInteger);
}

function normalizeYearEndDeductionEligibility(
  deductionEligibility?: Partial<YearEndDeductionEligibilityInput>
): YearEndDeductionEligibilityInput {
  return normalizeYearEndDeductionEligibilityCore(deductionEligibility);
}

function collectYearEndDeductionEligibilityBlockingReasons(
  deductionItems: YearEndDeductionItemsInput,
  deductionEligibility: YearEndDeductionEligibilityInput
) {
  return collectYearEndDeductionEligibilityBlockingReasonsCore(
    deductionItems,
    deductionEligibility
  );
}

function normalizeYearEndTaxCreditItems(
  input: PreviewPayrollYearEndSettlementInput
): YearEndTaxCreditItemsInput {
  return normalizeYearEndTaxCreditItemsCore(input, toKrwInteger);
}

function buildYearEndInputVectorHash(input: {
  year: number;
  employeeId: string;
  nonTaxableAnnualIncomeKrw: number;
  annualIncomeTaxRate: number;
  localIncomeTaxRate: number;
  taxCredits: YearEndTaxCreditItemsInput;
  deductionItems: YearEndDeductionItemsInput | null;
  deductionEligibility: YearEndDeductionEligibilityInput | null;
}) {
  return buildYearEndInputVectorHashCore(input);
}

function applyYearEndDeductionCaps(deductionItems: YearEndDeductionItemsInput) {
  return applyYearEndDeductionCapsCore(deductionItems, toKrwInteger);
}

function calculateYearEndSettlementKrw(
  totalsKrw: PayrollTotalsKrw,
  input: PreviewPayrollYearEndSettlementInput,
  incomeDeductionKrw: number
) {
  return calculateYearEndSettlementKrwCore(
    totalsKrw,
    input,
    incomeDeductionKrw,
    toKrwInteger,
    toRateNumber,
    ({ nonTaxableAnnualIncomeKrw, annualGrossPayKrw, overflowKrw }) => {
      throw new ServiceError(409, "year-end non-taxable annual income exceeds annual gross pay", {
        nonTaxableAnnualIncomeKrw,
        annualGrossPayKrw,
        overflowKrw
      });
    }
  );
}

type YearEndFilingGuard = {
  undistributedRuns: PayrollRunEntity[];
  pendingReceiptRuns: PayrollRunEntity[];
  runStates: YearEndFilingGuardRunStates;
  blockingReasons: string[];
  canFinalize: boolean;
};

function buildYearEndFilingGuard(snapshot: YearEndRunSnapshot): YearEndFilingGuard {
  return buildYearEndFilingGuardCore(snapshot) as YearEndFilingGuard;
}

function buildYearEndInsuranceReconciliationMonthlyBreakdown(runs: PayrollRunEntity[]) {
  return buildYearEndInsuranceReconciliationMonthlyBreakdownCore(runs, (periodStart) => {
    const monthParts = toSeoulDateTimeParts(periodStart);
    return `${monthParts.year}-${String(monthParts.month).padStart(2, "0")}`;
  });
}

type YearEndFinalizationAuditPayload = FinalizePayrollYearEndSettlementResult["settlement"];

function buildYearEndSettlementHash(payload: {
  year: number;
  employeeId: string;
  runStates: YearEndFilingGuardRunStates;
  annualTotalsKrw: PayrollTotalsKrw;
  deductionEligibility: YearEndDeductionEligibilityInput;
  deductionItemsKrw: YearEndDeductionSummaryKrw;
  settlementKrw: YearEndSettlementKrw;
}) {
  return buildYearEndSettlementHashCore(payload);
}

function normalizeYearEndSettlementHash(value: unknown): string | null {
  return normalizeYearEndSettlementHashCore(value);
}

function resolveYearEndSettlementHashFromFinalizationPayload(
  payload: YearEndFinalizationAuditPayload
): string {
  return resolveYearEndSettlementHashFromFinalizationPayloadCore(payload);
}

function asYearEndFinalizationAuditPayload(payload: unknown): YearEndFinalizationAuditPayload | null {
  return asYearEndFinalizationAuditPayloadCore(payload) as YearEndFinalizationAuditPayload | null;
}

function asYearEndWithholdingReceiptSummaryPayload(
  payload: unknown
): PayrollYearEndWithholdingReceiptSummary | null {
  return asYearEndWithholdingReceiptSummaryPayloadCore(payload) as PayrollYearEndWithholdingReceiptSummary | null;
}

function buildYearEndWithholdingReceiptDocumentArtifact(
  receipt: PayrollYearEndWithholdingReceiptSummary,
  format: PayrollYearEndWithholdingReceiptDocumentFormat
) {
  return buildYearEndWithholdingReceiptDocumentArtifactCore(receipt, format);
}

function buildYearEndFilingRecords(runs: PayrollRunEntity[]): YearEndFilingRecord[] {
  return buildYearEndFilingRecordsCore(runs);
}

function buildYearEndFilingArtifact(
  format: PayrollYearEndFilingExportFormat,
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayload
) {
  return buildYearEndFilingArtifactCore(format, rows, payload);
}

function validateYearEndFilingRecords(rows: YearEndFilingRecord[], payload: YearEndFinalizationAuditPayload) {
  return validateYearEndFilingRecordsCore(rows, payload);
}

export async function closePayrollPeriod(
  context: ServiceContext,
  input: ClosePayrollPeriodInput
): Promise<ClosePayrollPeriodResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollClosePeriodEnabled()) {
    throw new ServiceError(409, "payroll_close_period_v1 feature flag is disabled");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);
  const runs = await context.dataAccess.payroll.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined
  });

  const confirmedRuns = runs.filter((run) => run.state === "CONFIRMED");
  const blockingRuns = runs.filter((run) => run.state !== "CONFIRMED");
  const blockingRunIds = blockingRuns.map((run) => run.id);
  const blockingReasons: string[] = [];
  if (runs.length === 0) {
    blockingReasons.push("no payroll runs found in selected period");
  }
  if (blockingRunIds.length > 0) {
    blockingReasons.push("all payroll runs must be confirmed before period close");
  }
  const canClose = blockingReasons.length === 0;

  const totalsKrw = aggregatePayrollTotalsKrw(confirmedRuns);

  const priorPaidWithholdingTaxKrw = toKrwInteger(
    input.settlement?.priorPaidWithholdingTaxKrw ?? 0,
    "settlement.priorPaidWithholdingTaxKrw"
  );
  const priorPaidSocialInsuranceKrw = toKrwInteger(
    input.settlement?.priorPaidSocialInsuranceKrw ?? 0,
    "settlement.priorPaidSocialInsuranceKrw"
  );
  const priorPaidNetPayKrw = toKrwInteger(
    input.settlement?.priorPaidNetPayKrw ?? 0,
    "settlement.priorPaidNetPayKrw"
  );

  const withholdingTaxDeltaKrw = totalsKrw.withholdingTaxKrw - priorPaidWithholdingTaxKrw;
  const socialInsuranceDeltaKrw = totalsKrw.socialInsuranceKrw - priorPaidSocialInsuranceKrw;
  const netPayDeltaKrw = totalsKrw.netPayKrw - priorPaidNetPayKrw;
  const remittanceDeltaKrw = withholdingTaxDeltaKrw + socialInsuranceDeltaKrw;

  const organizationId = tenantScope ?? confirmedRuns[0]?.organizationId ?? null;
  const entityId = `${input.periodStart.toISOString()}_${input.periodEnd.toISOString()}`;
  const commonPayload = {
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    runStates: {
      totalRuns: runs.length,
      confirmedRuns: confirmedRuns.length,
      previewedRuns: blockingRunIds.length,
      blockingRunIds,
      blockingReasons
    },
    totalsKrw,
    settlementKrw: {
      priorPaidWithholdingTaxKrw,
      priorPaidSocialInsuranceKrw,
      priorPaidNetPayKrw,
      withholdingTaxDeltaKrw,
      socialInsuranceDeltaKrw,
      netPayDeltaKrw,
      remittanceDeltaKrw
    }
  };

  if (input.apply && !canClose) {
    throw new ServiceError(409, "payroll period cannot be closed", commonPayload.runStates);
  }

  if (input.apply) {
    await context.dataAccess.audit.append({
      action: "payroll.period_closed",
      entityType: "PayrollPeriod",
      entityId,
      organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
    await getEventPublisher(context).publish({
      name: "payroll.period.closed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollPeriod",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
  } else {
    await context.dataAccess.audit.append({
      action: "payroll.period_close_previewed",
      entityType: "PayrollPeriod",
      entityId,
      organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
    await getEventPublisher(context).publish({
      name: "payroll.period.close_previewed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollPeriod",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
  }

  return {
    summary: {
      periodStart: commonPayload.periodStart,
      periodEnd: commonPayload.periodEnd,
      apply: input.apply,
      canClose,
      runStates: commonPayload.runStates,
      totalsKrw: commonPayload.totalsKrw,
      settlementKrw: commonPayload.settlementKrw
    }
  };
}

export async function distributePayrollPayslips(
  context: ServiceContext,
  input: DistributePayrollPayslipsInput
): Promise<DistributePayrollPayslipsResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollPayslipDeliveryEnabled()) {
    throw new ServiceError(409, "payroll_payslip_delivery_v1 feature flag is disabled");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  if (input.employeeId) {
    await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  }

  const tenantScope = resolveTenantScope(context.actor);
  const runs = await context.dataAccess.payroll.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId
  });

  const confirmedRuns = runs.filter((run) => run.state === "CONFIRMED");
  const previewedRuns = runs.filter((run) => run.state !== "CONFIRMED");
  const alreadyDistributedRuns = confirmedRuns.filter((run) => run.payslipDistributedAt !== null);
  const newlyDistributableRuns = confirmedRuns.filter((run) => run.payslipDistributedAt === null);

  if (!input.dryRun) {
    const distributedAt = new Date();
    for (const run of newlyDistributableRuns) {
      await context.dataAccess.payroll.update(run.id, {
        payslipDeliveryChannel: input.deliveryChannel,
        payslipDistributedAt: distributedAt,
        payslipDistributedBy: context.actor!.id
      });
    }
  }

  const organizationId = tenantScope ?? confirmedRuns[0]?.organizationId ?? null;
  const commonPayload = {
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    employeeId: input.employeeId ?? null,
    dryRun: input.dryRun,
    deliveryChannel: input.deliveryChannel,
    runStates: {
      totalRuns: runs.length,
      confirmedRuns: confirmedRuns.length,
      previewedRuns: previewedRuns.length
    },
    distribution: {
      targetCount: confirmedRuns.length,
      alreadyDistributedCount: alreadyDistributedRuns.length,
      newlyDistributedCount: newlyDistributableRuns.length,
      targetRunIds: confirmedRuns.map((run) => run.id),
      alreadyDistributedRunIds: alreadyDistributedRuns.map((run) => run.id),
      newlyDistributedRunIds: newlyDistributableRuns.map((run) => run.id)
    }
  };

  const entityId = `${commonPayload.periodStart}_${commonPayload.periodEnd}_${input.deliveryChannel}`;
  if (input.dryRun) {
    await context.dataAccess.audit.append({
      action: "payroll.payslip_distribution_previewed",
      entityType: "PayrollPeriod",
      entityId,
      organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
    await getEventPublisher(context).publish({
      name: "payroll.payslip.distribution_previewed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollPeriod",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
  } else {
    await context.dataAccess.audit.append({
      action: "payroll.payslip_distributed",
      entityType: "PayrollPeriod",
      entityId,
      organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
    await getEventPublisher(context).publish({
      name: "payroll.payslip.distributed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollPeriod",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
  }

  return {
    summary: {
      periodStart: commonPayload.periodStart,
      periodEnd: commonPayload.periodEnd,
      dryRun: input.dryRun,
      deliveryChannel: input.deliveryChannel,
      runStates: commonPayload.runStates,
      distribution: commonPayload.distribution
    }
  };
}

export async function acknowledgePayrollPayslipReceipt(
  context: ServiceContext,
  input: AcknowledgePayrollPayslipReceiptInput
): Promise<AcknowledgePayrollPayslipReceiptResult> {
  if (!isPayrollPayslipDeliveryEnabled()) {
    throw new ServiceError(409, "payroll_payslip_delivery_v1 feature flag is disabled");
  }

  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (!input.runId.trim()) {
    throw new ServiceError(400, "runId is required");
  }

  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);
  if (!canListAny && !canListOwn) {
    throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
  }

  const run = await context.dataAccess.payroll.findById(input.runId);
  if (!run) {
    throw new ServiceError(404, "payroll run not found");
  }
  ensureTenantMatch(resolveTenantScope(actor), run.organizationId, "payroll run not found");

  if (run.state !== "CONFIRMED") {
    throw new ServiceError(409, "only confirmed payroll run can accept payslip receipt confirmation");
  }
  if (!run.employeeId) {
    throw new ServiceError(409, "payroll run has no employee owner");
  }
  if (!canListAny && actor.id !== run.employeeId) {
    throw new ServiceError(403, "employees can only confirm receipt for their own payslip");
  }
  if (!run.payslipDistributedAt) {
    throw new ServiceError(409, "payslip must be distributed before receipt confirmation");
  }

  if (run.payslipReceiptConfirmedAt && run.payslipReceiptConfirmedBy) {
    return {
      receipt: {
        runId: run.id,
        employeeId: run.employeeId,
        deliveryChannel: run.payslipDeliveryChannel,
        distributedAt: run.payslipDistributedAt.toISOString(),
        receiptConfirmedAt: run.payslipReceiptConfirmedAt.toISOString(),
        receiptConfirmedBy: run.payslipReceiptConfirmedBy,
        alreadyConfirmed: true
      }
    };
  }

  const receiptConfirmedAt = new Date();
  const updated = await context.dataAccess.payroll.update(run.id, {
    payslipReceiptConfirmedAt: receiptConfirmedAt,
    payslipReceiptConfirmedBy: actor.id
  });

  await context.dataAccess.audit.append({
    action: "payroll.payslip_receipt_confirmed",
    entityType: "PayrollRun",
    entityId: updated.id,
    organizationId: updated.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: updated.employeeId,
      deliveryChannel: updated.payslipDeliveryChannel,
      distributedAt: updated.payslipDistributedAt?.toISOString() ?? null,
      receiptConfirmedAt: updated.payslipReceiptConfirmedAt?.toISOString() ?? null,
      receiptConfirmedBy: updated.payslipReceiptConfirmedBy
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.payslip.receipt_confirmed.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: updated.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: updated.employeeId,
      deliveryChannel: updated.payslipDeliveryChannel,
      distributedAt: updated.payslipDistributedAt?.toISOString() ?? null,
      receiptConfirmedAt: updated.payslipReceiptConfirmedAt?.toISOString() ?? null
    }
  });

  return {
    receipt: {
      runId: updated.id,
      employeeId: updated.employeeId!,
      deliveryChannel: updated.payslipDeliveryChannel,
      distributedAt: updated.payslipDistributedAt!.toISOString(),
      receiptConfirmedAt: updated.payslipReceiptConfirmedAt!.toISOString(),
      receiptConfirmedBy: updated.payslipReceiptConfirmedBy!,
      alreadyConfirmed: false
    }
  };
}

export async function previewPayrollYearEndSettlement(
  context: ServiceContext,
  input: PreviewPayrollYearEndSettlementInput
): Promise<PreviewPayrollYearEndSettlementResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const settled = calculateYearEndSettlementKrw(snapshot.totalsKrw, input, 0);
  const normalizedTaxCredits = normalizeYearEndTaxCreditItems(input);
  const inputVectorHash = buildYearEndInputVectorHash({
    year: input.year,
    employeeId: input.employeeId,
    nonTaxableAnnualIncomeKrw: settled.settlementKrw.nonTaxableAnnualIncomeKrw,
    annualIncomeTaxRate: toRateNumber(input.annualIncomeTaxRate, "annualIncomeTaxRate") ?? 0,
    localIncomeTaxRate: toRateNumber(input.localIncomeTaxRate, "localIncomeTaxRate") ?? 0,
    taxCredits: normalizedTaxCredits,
    deductionItems: null,
    deductionEligibility: null
  });

  const payload: YearEndSettlementSummary = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    inputVectorHash,
    runStates: {
      totalRuns: snapshot.runs.length,
      confirmedRuns: snapshot.confirmedRuns.length,
      previewedRuns: snapshot.previewedRuns.length,
      previewedRunIds: snapshot.previewedRuns.map((run) => run.id)
    },
    annualTotalsKrw: snapshot.totalsKrw,
    settlementKrw: settled.settlementKrw
  };

  const entityId = `${input.year}_${input.employeeId}`;
  await context.dataAccess.audit.append({
    action: "payroll.year_end.settlement_previewed",
    entityType: "PayrollYearEnd",
    entityId,
    organizationId: snapshot.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.settlement.previewed.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollYearEnd",
    entityId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });

  return {
    summary: payload
  };
}

export async function recalculatePayrollYearEndSettlement(
  context: ServiceContext,
  input: RecalculatePayrollYearEndSettlementInput
): Promise<RecalculatePayrollYearEndSettlementResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndDeductionInputEnabled()) {
    throw new ServiceError(409, "payroll_year_end_deduction_input_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const normalizedDeductionItems = normalizeYearEndDeductionItems(input.deductionItems);
  const normalizedDeductionEligibility = normalizeYearEndDeductionEligibility(input.deductionEligibility);
  const normalizedTaxCredits = normalizeYearEndTaxCreditItems(input);
  const deductionEligibilityBlockingReasons = collectYearEndDeductionEligibilityBlockingReasons(
    normalizedDeductionItems,
    normalizedDeductionEligibility
  );
  if (deductionEligibilityBlockingReasons.length > 0) {
    throw new ServiceError(409, "year-end deduction eligibility validation failed", {
      deductionEligibility: normalizedDeductionEligibility,
      blockingReasons: deductionEligibilityBlockingReasons
    });
  }
  const deductionCapApplied = applyYearEndDeductionCaps(normalizedDeductionItems);
  const baselineSettled = calculateYearEndSettlementKrw(snapshot.totalsKrw, input, 0);
  const recalculatedSettled = calculateYearEndSettlementKrw(
    snapshot.totalsKrw,
    input,
    deductionCapApplied.cappedIncomeDeductionKrw
  );
  const inputVectorHash = buildYearEndInputVectorHash({
    year: input.year,
    employeeId: input.employeeId,
    nonTaxableAnnualIncomeKrw: recalculatedSettled.settlementKrw.nonTaxableAnnualIncomeKrw,
    annualIncomeTaxRate: toRateNumber(input.annualIncomeTaxRate, "annualIncomeTaxRate") ?? 0,
    localIncomeTaxRate: toRateNumber(input.localIncomeTaxRate, "localIncomeTaxRate") ?? 0,
    taxCredits: normalizedTaxCredits,
    deductionItems: normalizedDeductionItems,
    deductionEligibility: normalizedDeductionEligibility
  });

  const payload = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    inputVectorHash,
    runStates: {
      totalRuns: snapshot.runs.length,
      confirmedRuns: snapshot.confirmedRuns.length,
      previewedRuns: snapshot.previewedRuns.length,
      previewedRunIds: snapshot.previewedRuns.map((run) => run.id)
    },
    annualTotalsKrw: snapshot.totalsKrw,
    deductionEligibility: normalizedDeductionEligibility,
    deductionEligibilityBlockingReasons,
    deductionItemsKrw: {
      ...normalizedDeductionItems,
      totalIncomeDeductionKrw: deductionCapApplied.totalIncomeDeductionKrw,
      cappedIncomeDeductionKrw: deductionCapApplied.cappedIncomeDeductionKrw,
      appliedIncomeDeductionKrw: recalculatedSettled.appliedIncomeDeductionKrw,
      taxableAnnualIncomeBeforeDeductionKrw: recalculatedSettled.taxableAnnualIncomeBeforeDeductionKrw,
      taxableAnnualIncomeAfterDeductionKrw: recalculatedSettled.settlementKrw.taxableAnnualIncomeKrw,
      capRulesKrw: deductionCapApplied.capRulesKrw,
      capAppliedByItemKrw: deductionCapApplied.capAppliedByItemKrw
    },
    baselineSettlementKrw: baselineSettled.settlementKrw,
    recalculatedSettlementKrw: recalculatedSettled.settlementKrw,
    deltaKrw: {
      annualTaxLiabilityDeltaKrw:
        recalculatedSettled.settlementKrw.annualTaxLiabilityKrw -
        baselineSettled.settlementKrw.annualTaxLiabilityKrw,
      withholdingDeltaChangeKrw:
        recalculatedSettled.settlementKrw.withholdingDeltaKrw -
        baselineSettled.settlementKrw.withholdingDeltaKrw,
      taxableIncomeReductionKrw:
        baselineSettled.settlementKrw.taxableAnnualIncomeKrw -
        recalculatedSettled.settlementKrw.taxableAnnualIncomeKrw
    }
  };

  const entityId = `${input.year}_${input.employeeId}`;
  await context.dataAccess.audit.append({
    action: "payroll.year_end.settlement_recalculated",
    entityType: "PayrollYearEnd",
    entityId,
    organizationId: snapshot.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.settlement.recalculated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollYearEnd",
    entityId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });

  return {
    recalculation: payload
  };
}

export async function finalizePayrollYearEndSettlement(
  context: ServiceContext,
  input: FinalizePayrollYearEndSettlementInput
): Promise<FinalizePayrollYearEndSettlementResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndDeductionInputEnabled()) {
    throw new ServiceError(409, "payroll_year_end_deduction_input_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const filingGuard = buildYearEndFilingGuard(snapshot);
  if (input.apply && !filingGuard.canFinalize) {
    throw new ServiceError(409, "year-end settlement cannot be finalized", {
      blockingReasons: filingGuard.blockingReasons,
      runStates: {
        totalRuns: filingGuard.runStates.totalRuns,
        confirmedRuns: filingGuard.runStates.confirmedRuns,
        previewedRuns: filingGuard.runStates.previewedRuns,
        undistributedRuns: filingGuard.runStates.undistributedRuns,
        pendingReceiptRuns: filingGuard.runStates.pendingReceiptRuns
      }
    });
  }

  const normalizedDeductionItems = normalizeYearEndDeductionItems(input.deductionItems);
  const normalizedDeductionEligibility = normalizeYearEndDeductionEligibility(input.deductionEligibility);
  const normalizedTaxCredits = normalizeYearEndTaxCreditItems(input);
  const deductionEligibilityBlockingReasons = collectYearEndDeductionEligibilityBlockingReasons(
    normalizedDeductionItems,
    normalizedDeductionEligibility
  );
  if (deductionEligibilityBlockingReasons.length > 0) {
    throw new ServiceError(409, "year-end deduction eligibility validation failed", {
      deductionEligibility: normalizedDeductionEligibility,
      blockingReasons: deductionEligibilityBlockingReasons
    });
  }
  const deductionCapApplied = applyYearEndDeductionCaps(normalizedDeductionItems);
  const settled = calculateYearEndSettlementKrw(
    snapshot.totalsKrw,
    input,
    deductionCapApplied.cappedIncomeDeductionKrw
  );
  const deductionItemsKrw: YearEndDeductionSummaryKrw = {
    ...normalizedDeductionItems,
    totalIncomeDeductionKrw: deductionCapApplied.totalIncomeDeductionKrw,
    cappedIncomeDeductionKrw: deductionCapApplied.cappedIncomeDeductionKrw,
    appliedIncomeDeductionKrw: settled.appliedIncomeDeductionKrw,
    taxableAnnualIncomeBeforeDeductionKrw: settled.taxableAnnualIncomeBeforeDeductionKrw,
    taxableAnnualIncomeAfterDeductionKrw: settled.settlementKrw.taxableAnnualIncomeKrw,
    capRulesKrw: deductionCapApplied.capRulesKrw,
    capAppliedByItemKrw: deductionCapApplied.capAppliedByItemKrw
  };
  const inputVectorHash = buildYearEndInputVectorHash({
    year: input.year,
    employeeId: input.employeeId,
    nonTaxableAnnualIncomeKrw: settled.settlementKrw.nonTaxableAnnualIncomeKrw,
    annualIncomeTaxRate: toRateNumber(input.annualIncomeTaxRate, "annualIncomeTaxRate") ?? 0,
    localIncomeTaxRate: toRateNumber(input.localIncomeTaxRate, "localIncomeTaxRate") ?? 0,
    taxCredits: normalizedTaxCredits,
    deductionItems: normalizedDeductionItems,
    deductionEligibility: normalizedDeductionEligibility
  });
  const settlementHash = buildYearEndSettlementHash({
    year: input.year,
    employeeId: input.employeeId,
    runStates: filingGuard.runStates,
    annualTotalsKrw: snapshot.totalsKrw,
    deductionEligibility: normalizedDeductionEligibility,
    deductionItemsKrw,
    settlementKrw: settled.settlementKrw
  });
  const expectedSettlementHash = input.expectedSettlementHash?.trim().toLowerCase();
  if (
    input.apply &&
    typeof expectedSettlementHash === "string" &&
    expectedSettlementHash.length > 0 &&
    expectedSettlementHash !== settlementHash
  ) {
    throw new ServiceError(409, "year-end settlement hash mismatch", {
      expectedSettlementHash,
      computedSettlementHash: settlementHash
    });
  }
  const entityId = `${input.year}_${input.employeeId}`;
  if (input.apply) {
    const finalizationLogs = await context.dataAccess.audit.list({
      actions: ["payroll.year_end.settlement_finalized"],
      entityType: "PayrollYearEnd",
      entityId,
      limit: 200
    });
    const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
    const latestFinalizationPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
    if (latestFinalizationPayload?.finalized && latestFinalizationPayload.finalizedAt) {
      const latestSettlementHash = resolveYearEndSettlementHashFromFinalizationPayload(
        latestFinalizationPayload
      );
      if (latestSettlementHash === settlementHash) {
        throw new ServiceError(409, "year-end settlement already finalized for same hash", {
          settlementHash,
          latestFinalizationId: latestFinalizationPayload.finalizationId,
          latestFinalizedAt: latestFinalizationPayload.finalizedAt
        });
      }
    }
  }
  const finalizationId = `YEF-${input.year}-${input.employeeId}`;
  const finalizedAt = input.apply ? new Date().toISOString() : null;
  const finalizedByNote = input.finalizedByNote?.trim() ? input.finalizedByNote.trim() : null;
  const payload: FinalizePayrollYearEndSettlementResult["settlement"] = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    apply: input.apply,
    canFinalize: filingGuard.canFinalize,
    finalized: input.apply,
    finalizationId,
    finalizedAt,
    finalizedByNote,
    inputVectorHash,
    runStates: filingGuard.runStates,
    annualTotalsKrw: snapshot.totalsKrw,
    deductionEligibility: normalizedDeductionEligibility,
    deductionEligibilityBlockingReasons,
    deductionItemsKrw,
    settlementKrw: settled.settlementKrw,
    settlementHash,
    blockingReasons: filingGuard.blockingReasons
  };

  if (input.apply) {
    await context.dataAccess.audit.append({
      action: "payroll.year_end.settlement_finalized",
      entityType: "PayrollYearEnd",
      entityId,
      organizationId: snapshot.organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload
    });
    await getEventPublisher(context).publish({
      name: "payroll.year_end.settlement.finalized.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollYearEnd",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload
    });
  } else {
    await context.dataAccess.audit.append({
      action: "payroll.year_end.settlement_finalize_previewed",
      entityType: "PayrollYearEnd",
      entityId,
      organizationId: snapshot.organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload
    });
    await getEventPublisher(context).publish({
      name: "payroll.year_end.settlement.finalize_previewed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollYearEnd",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload
    });
  }

  return {
    settlement: payload
  };
}

export async function exportPayrollYearEndFilingData(
  context: ServiceContext,
  input: ExportPayrollYearEndFilingDataInput
): Promise<ExportPayrollYearEndFilingDataResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const filingGuard = buildYearEndFilingGuard(snapshot);
  if (!filingGuard.canFinalize) {
    throw new ServiceError(409, "year-end filing data export is blocked", {
      blockingReasons: filingGuard.blockingReasons,
      runStates: {
        totalRuns: filingGuard.runStates.totalRuns,
        confirmedRuns: filingGuard.runStates.confirmedRuns,
        previewedRuns: filingGuard.runStates.previewedRuns,
        undistributedRuns: filingGuard.runStates.undistributedRuns,
        pendingReceiptRuns: filingGuard.runStates.pendingReceiptRuns
      }
    });
  }

  const entityId = `${input.year}_${input.employeeId}`;
  const finalizationLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 500
  });
  const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
  const finalizedPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
  if (!finalizedPayload || !finalizedPayload.finalized || !finalizedPayload.finalizedAt) {
    throw new ServiceError(409, "year-end settlement must be finalized before filing data export");
  }
  const settledSettlementHash = resolveYearEndSettlementHashFromFinalizationPayload(finalizedPayload);
  const expectedSettlementHash = normalizeYearEndSettlementHash(input.expectedSettlementHash);
  if (expectedSettlementHash && expectedSettlementHash !== settledSettlementHash) {
    throw new ServiceError(409, "year-end settlement hash mismatch", {
      expectedSettlementHash,
      computedSettlementHash: settledSettlementHash
    });
  }

  const records = buildYearEndFilingRecords(snapshot.confirmedRuns);
  const validation = validateYearEndFilingRecords(records, finalizedPayload);
  if (input.validationMode === "strict" && validation.status === "fail") {
    throw new ServiceError(409, "year-end filing export validation failed", {
      issues: validation.issues,
      checks: validation.checks
    });
  }

  const artifact = buildYearEndFilingArtifact(input.format, records, finalizedPayload);
  const exportedAt = new Date().toISOString();
  const payload: ExportPayrollYearEndFilingDataResult["filingData"] = {
    year: input.year,
    employeeId: input.employeeId,
    finalizationId: finalizedPayload.finalizationId,
    settlementHash: settledSettlementHash,
    finalizedAt: finalizedPayload.finalizedAt,
    exportedAt,
    format: input.format,
    validationMode: input.validationMode,
    runStates: finalizedPayload.runStates,
    annualTotalsKrw: finalizedPayload.annualTotalsKrw,
    deductionItemsKrw: finalizedPayload.deductionItemsKrw,
    settlementKrw: finalizedPayload.settlementKrw,
    records,
    csv: input.format === "csv" || input.format === "hometax_csv" ? artifact.content : null,
    artifact,
    validation
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_data_exported",
    entityType: "PayrollYearEnd",
    entityId,
    organizationId: snapshot.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_data.exported.v1",
    occurredAt: exportedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });

  return {
    filingData: payload
  };
}

function matchesYearEndFilingSubmissionFilters(
  submission: PayrollYearEndFilingSubmissionSummary,
  filters: ListPayrollYearEndFilingSubmissionsInput
) {
  return matchesYearEndFilingSubmissionFiltersCore(submission, filters);
}

function sortYearEndFilingSubmissions(
  submissions: PayrollYearEndFilingSubmissionSummary[],
  options: {
    sortBy?: PayrollYearEndFilingSubmissionSortBy;
    sortDirection?: PayrollYearEndFilingSubmissionSortDirection;
  }
) {
  return sortYearEndFilingSubmissionsCore(submissions, options);
}

function buildYearEndFilingSubmissionListSummary(input: {
  allSubmissions: PayrollYearEndFilingSubmissionSummary[];
  filteredSubmissions: PayrollYearEndFilingSubmissionSummary[];
}): PayrollYearEndFilingSubmissionListSummary {
  return buildYearEndFilingSubmissionListSummaryCore(input);
}

async function listYearEndFilingSubmissionSummaries(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionsInput
) {
  const logs = await listYearEndFilingLifecycleLogs(context, input);
  return buildYearEndFilingSubmissionSummariesCore(logs) as PayrollYearEndFilingSubmissionSummary[];
}

async function listYearEndFilingLifecycleLogs(
  context: ServiceContext,
  input: {
    year: number;
    employeeId: string;
  }
) {
  return listYearEndFilingLifecycleLogsCore(context.dataAccess.audit, input);
}

function ensureNoPendingFilingSubmission(submissions: PayrollYearEndFilingSubmissionSummary[]) {
  ensureNoPendingFilingSubmissionCore(submissions);
}

function buildYearEndFilingSubmissionId(input: {
  year: number;
  employeeId: string;
  checksumSha256: string;
  attempt: number;
}) {
  return buildYearEndFilingSubmissionIdCore(input);
}

async function createYearEndFilingSubmission(
  context: ServiceContext,
  input: {
    year: number;
    employeeId: string;
    format: PayrollYearEndFilingExportFormat;
    validationMode: PayrollYearEndFilingValidationMode;
    expectedSettlementHash?: string;
    transport: PayrollYearEndFilingTransport;
    submissionNote?: string;
    attempt: number;
    resubmissionOfSubmissionId: string | null;
    resubmissionReason: string | null;
    auditAction: "payroll.year_end.filing_package_submitted" | "payroll.year_end.filing_package_resubmitted";
    eventName:
      | "payroll.year_end.filing_package.submitted.v1"
      | "payroll.year_end.filing_package.resubmitted.v1";
  }
): Promise<PayrollYearEndFilingSubmissionSummary> {
  const exportResult = await exportPayrollYearEndFilingData(context, {
    year: input.year,
    employeeId: input.employeeId,
    format: input.format,
    validationMode: input.validationMode,
    expectedSettlementHash: input.expectedSettlementHash
  });

  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const entityId = `${input.year}_${input.employeeId}`;
  const submittedAt = new Date().toISOString();
  const submissionId = buildYearEndFilingSubmissionId({
    year: input.year,
    employeeId: input.employeeId,
    checksumSha256: exportResult.filingData.artifact.checksumSha256,
    attempt: input.attempt
  });
  const submissionNote = input.submissionNote?.trim() ? input.submissionNote.trim() : null;

  const submission: PayrollYearEndFilingSubmissionSummary = {
    submissionId,
    year: input.year,
    employeeId: input.employeeId,
    attempt: input.attempt,
    resubmissionOfSubmissionId: input.resubmissionOfSubmissionId,
    resubmissionReason: input.resubmissionReason,
    finalizationId: exportResult.filingData.finalizationId,
    settlementHash: exportResult.filingData.settlementHash,
    format: input.format,
    validationMode: input.validationMode,
    transport: input.transport,
    artifact: {
      fileName: exportResult.filingData.artifact.fileName,
      contentType: exportResult.filingData.artifact.contentType,
      checksumSha256: exportResult.filingData.artifact.checksumSha256,
      byteLength: exportResult.filingData.artifact.byteLength
    },
    validationStatus: exportResult.filingData.validation.status,
    submittedAt,
    submittedByRole: actorRole,
    submittedById: actorId,
    status: "submitted",
    ack: null,
    submissionNote
  };

  await context.dataAccess.audit.append({
    action: input.auditAction,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: submission
  });
  await getEventPublisher(context).publish({
    name: input.eventName,
    occurredAt: submittedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: submission as unknown as Record<string, unknown>
  });

  return submission;
}

export async function submitPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: SubmitPayrollYearEndFilingPackageInput
): Promise<SubmitPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }
  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  ensureNoPendingFilingSubmission(submissions);
  if (submissions.length > 0) {
    throw new ServiceError(
      409,
      "existing filing submission history found; use resubmit endpoint for rejected submissions"
    );
  }

  const submission = await createYearEndFilingSubmission(context, {
    year: input.year,
    employeeId: input.employeeId,
    format: input.format,
    validationMode: input.validationMode,
    expectedSettlementHash: input.expectedSettlementHash,
    transport: input.transport,
    submissionNote: input.submissionNote,
    attempt: 1,
    resubmissionOfSubmissionId: null,
    resubmissionReason: null,
    auditAction: "payroll.year_end.filing_package_submitted",
    eventName: "payroll.year_end.filing_package.submitted.v1"
  });

  return { submission };
}

export async function resubmitPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: ResubmitPayrollYearEndFilingPackageInput
): Promise<ResubmitPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const target = submissions.find((submission) => submission.submissionId === input.submissionId);
  if (!target) {
    throw new ServiceError(404, "filing submission not found for resubmission");
  }
  if (target.status !== "acknowledged" || target.ack?.ackStatus !== "rejected") {
    throw new ServiceError(409, "only rejected acknowledged submissions can be resubmitted");
  }
  if (
    submissions.some(
      (submission) => submission.resubmissionOfSubmissionId === target.submissionId
    )
  ) {
    throw new ServiceError(409, "selected submission has already been resubmitted");
  }
  ensureNoPendingFilingSubmission(submissions);

  const submission = await createYearEndFilingSubmission(context, {
    year: input.year,
    employeeId: input.employeeId,
    format: input.format,
    validationMode: input.validationMode,
    expectedSettlementHash: input.expectedSettlementHash,
    transport: input.transport,
    submissionNote: input.submissionNote,
    attempt: target.attempt + 1,
    resubmissionOfSubmissionId: target.submissionId,
    resubmissionReason: input.resubmissionReason?.trim() ? input.resubmissionReason.trim() : null,
    auditAction: "payroll.year_end.filing_package_resubmitted",
    eventName: "payroll.year_end.filing_package.resubmitted.v1"
  });

  return { submission };
}

export async function acknowledgePayrollYearEndFilingPackage(
  context: ServiceContext,
  input: AcknowledgePayrollYearEndFilingPackageInput
): Promise<AcknowledgePayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);

  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const target = submissions.find((submission) => submission.submissionId === input.submissionId);
  if (!target) {
    throw new ServiceError(404, "filing submission not found");
  }
  if (target.status === "canceled") {
    throw new ServiceError(409, "canceled filing submission cannot be acknowledged");
  }
  if (target.status === "acknowledged") {
    throw new ServiceError(409, "filing submission is already acknowledged");
  }
  const expectedSettlementHash = normalizeYearEndSettlementHash(input.expectedSettlementHash);
  const submissionSettlementHash = normalizeYearEndSettlementHash(target.settlementHash);
  if (expectedSettlementHash && expectedSettlementHash !== submissionSettlementHash) {
    throw new ServiceError(409, "filing submission settlement hash mismatch", {
      expectedSettlementHash,
      submissionSettlementHash
    });
  }

  const resolvedAck = resolvePayrollYearEndFilingAckPayload({
    ackStatus: input.ackStatus,
    ackCode: input.ackCode,
    ackNote: input.ackNote,
    rejectionReasonCode: input.rejectionReasonCode,
    rejectionReasonDetail: input.rejectionReasonDetail
  });
  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const acknowledgedAt = new Date().toISOString();
  const entityId = `${input.year}_${input.employeeId}`;
  const ackPayload: {
    submissionId: string;
    settlementHash: string | null;
    expectedSettlementHash: string | null;
    ackStatus: PayrollYearEndFilingAckStatus;
    ackCode: string | null;
    ackNote: string | null;
    rejectionReasonCode: string | null;
    rejectionReasonDetail: string | null;
    acknowledgedAt: string;
    acknowledgedByRole: string;
    acknowledgedById: string | null;
  } = {
    submissionId: input.submissionId,
    settlementHash: submissionSettlementHash,
    expectedSettlementHash: expectedSettlementHash,
    ackStatus: input.ackStatus,
    ackCode: resolvedAck.ackCode,
    ackNote: resolvedAck.ackNote,
    rejectionReasonCode: resolvedAck.rejectionReasonCode,
    rejectionReasonDetail: resolvedAck.rejectionReasonDetail,
    acknowledgedAt,
    acknowledgedByRole: actorRole,
    acknowledgedById: actorId
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_package_acknowledged",
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: ackPayload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_package.acknowledged.v1",
    occurredAt: acknowledgedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: ackPayload as unknown as Record<string, unknown>
  });

  return {
    submission: {
      ...target,
      status: "acknowledged",
      ack: {
        ackStatus: input.ackStatus,
        ackCode: resolvedAck.ackCode,
        ackNote: resolvedAck.ackNote,
        rejectionReasonCode: resolvedAck.rejectionReasonCode,
        rejectionReasonDetail: resolvedAck.rejectionReasonDetail,
        acknowledgedAt,
        acknowledgedByRole: actorRole,
        acknowledgedById: actorId
      }
    }
  };
}

export async function cancelPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: CancelPayrollYearEndFilingPackageInput
): Promise<CancelPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const target = submissions.find((submission) => submission.submissionId === input.submissionId);
  if (!target) {
    throw new ServiceError(404, "filing submission not found");
  }
  if (target.status === "canceled") {
    throw new ServiceError(409, "filing submission is already canceled");
  }
  if (target.status === "acknowledged") {
    throw new ServiceError(409, "acknowledged filing submission cannot be canceled");
  }

  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const canceledAt = new Date().toISOString();
  const entityId = `${input.year}_${input.employeeId}`;
  const payload: {
    submissionId: string;
    canceledAt: string;
    canceledByRole: string;
    canceledById: string | null;
  } = {
    submissionId: input.submissionId,
    canceledAt,
    canceledByRole: actorRole,
    canceledById: actorId
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_package_canceled",
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_package.canceled.v1",
    occurredAt: canceledAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: payload as unknown as Record<string, unknown>
  });

  return {
    submission: {
      ...target,
      status: "canceled",
      ack: null
    }
  };
}

export async function reopenPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: ReopenPayrollYearEndFilingPackageInput
): Promise<ReopenPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const target = submissions.find((submission) => submission.submissionId === input.submissionId);
  if (!target) {
    throw new ServiceError(404, "filing submission not found");
  }
  if (target.status !== "canceled") {
    throw new ServiceError(409, "only canceled filing submission can be reopened");
  }
  if (
    submissions.some(
      (submission) =>
        submission.status === "submitted" && submission.submissionId !== target.submissionId
    )
  ) {
    throw new ServiceError(
      409,
      "another pending filing submission exists; acknowledge or cancel it before reopening"
    );
  }

  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const reopenedAt = new Date().toISOString();
  const entityId = `${input.year}_${input.employeeId}`;
  const payload: {
    submissionId: string;
    reopenedAt: string;
    reopenedByRole: string;
    reopenedById: string | null;
  } = {
    submissionId: input.submissionId,
    reopenedAt,
    reopenedByRole: actorRole,
    reopenedById: actorId
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_package_reopened",
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_package.reopened.v1",
    occurredAt: reopenedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: payload as unknown as Record<string, unknown>
  });

  return {
    submission: {
      ...target,
      status: "submitted",
      ack: null
    }
  };
}

export async function listPayrollYearEndFilingSubmissions(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionsInput
): Promise<ListPayrollYearEndFilingSubmissionsResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const allSubmissions = await listYearEndFilingSubmissionSummaries(context, input);
  const filteredSubmissions = allSubmissions.filter((submission) =>
    matchesYearEndFilingSubmissionFilters(submission, input)
  );
  const submissions = sortYearEndFilingSubmissions(filteredSubmissions, {
    sortBy: input.sortBy,
    sortDirection: input.sortDirection
  });
  return {
    summary: buildYearEndFilingSubmissionListSummary({
      allSubmissions,
      filteredSubmissions
    }),
    submissions
  };
}

export async function listPayrollYearEndFilingAckCatalog(
  context: ServiceContext
): Promise<ListPayrollYearEndFilingAckCatalogResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  return buildPayrollYearEndFilingAckCatalog();
}

export async function listPayrollYearEndFilingSubmissionTimeline(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionTimelineInput
): Promise<ListPayrollYearEndFilingSubmissionTimelineResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const submission = submissions.find((candidate) => candidate.submissionId === input.submissionId);
  if (!submission) {
    throw new ServiceError(404, "filing submission not found");
  }
  const logs = await listYearEndFilingLifecycleLogs(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const timeline = buildYearEndFilingSubmissionTimelineCore(logs, input.submissionId) as PayrollYearEndFilingTimelineEntry[];

  return {
    submission,
    timeline
  };
}

export async function addPayrollYearEndFilingEvidenceNote(
  context: ServiceContext,
  input: AddPayrollYearEndFilingEvidenceNoteInput
): Promise<AddPayrollYearEndFilingEvidenceNoteResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  if (!submissions.some((submission) => submission.submissionId === input.submissionId)) {
    throw new ServiceError(404, "filing submission not found");
  }

  const note = input.note.trim();
  if (!note) {
    throw new ServiceError(400, "evidence note must not be empty");
  }
  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const notedAt = new Date().toISOString();
  const entityId = `${input.year}_${input.employeeId}`;
  const payload: PayrollYearEndFilingEvidenceNoteSummary = {
    submissionId: input.submissionId,
    year: input.year,
    employeeId: input.employeeId,
    note,
    notedAt,
    notedByRole: actorRole,
    notedById: actorId
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_evidence_note_added",
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_evidence_note.added.v1",
    occurredAt: notedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: payload as unknown as Record<string, unknown>
  });

  return {
    evidenceNote: payload
  };
}

export async function getPayrollYearEndInsuranceReconciliationReport(
  context: ServiceContext,
  input: GetPayrollYearEndInsuranceReconciliationReportInput
): Promise<GetPayrollYearEndInsuranceReconciliationReportResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const annualRunSocialInsuranceKrw = snapshot.confirmedRuns.reduce(
    (total, run) => total + (run.socialInsuranceKrw ?? 0),
    0
  );
  const entityId = `${input.year}_${input.employeeId}`;
  const finalizationLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 500
  });
  const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
  const finalizedPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
  const insuranceCapApplied = finalizedPayload?.deductionItemsKrw.capAppliedByItemKrw.insurancePremiumKrw;
  const insurancePremiumAppliedKrw = insuranceCapApplied?.appliedKrw ?? null;
  const status: GetPayrollYearEndInsuranceReconciliationReportResult["report"]["reconciliation"]["status"] =
    insurancePremiumAppliedKrw === null
      ? "pending_finalization"
      : annualRunSocialInsuranceKrw === insurancePremiumAppliedKrw
        ? "matched"
        : "mismatch";
  const comparedKrw = insurancePremiumAppliedKrw ?? 0;

  return {
    report: {
      year: input.year,
      employeeId: input.employeeId,
      periodStart: snapshot.periodStart.toISOString(),
      periodEnd: snapshot.periodEnd.toISOString(),
      runStates: {
        totalRuns: snapshot.runs.length,
        confirmedRuns: snapshot.confirmedRuns.length,
        previewedRuns: snapshot.previewedRuns.length,
        confirmedRunIds: snapshot.confirmedRuns.map((run) => run.id),
        previewedRunIds: snapshot.previewedRuns.map((run) => run.id)
      },
      annualRunSocialInsuranceKrw,
      finalization: {
        finalized: Boolean(finalizedPayload?.finalized && finalizedPayload.finalizedAt),
        finalizationId: finalizedPayload?.finalizationId ?? null,
        settlementHash: finalizedPayload
          ? resolveYearEndSettlementHashFromFinalizationPayload(finalizedPayload)
          : null,
        finalizedAt: finalizedPayload?.finalizedAt ?? null,
        insurancePremiumInputKrw: insuranceCapApplied?.inputKrw ?? null,
        insurancePremiumAppliedKrw,
        insurancePremiumCapKrw: insuranceCapApplied?.capKrw ?? null,
        applicationReasonCode: insuranceCapApplied?.applicationReasonCode ?? null,
        applicationReason: insuranceCapApplied?.applicationReason ?? null
      },
      reconciliation: {
        baselineKrw: annualRunSocialInsuranceKrw,
        comparedKrw,
        deltaKrw: annualRunSocialInsuranceKrw - comparedKrw,
        status
      },
      monthlyBreakdown: buildYearEndInsuranceReconciliationMonthlyBreakdown(snapshot.runs)
    }
  };
}

export async function getPayrollYearEndPreflightChecklist(
  context: ServiceContext,
  input: GetPayrollYearEndPreflightChecklistInput
): Promise<GetPayrollYearEndPreflightChecklistResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const filingGuard = buildYearEndFilingGuard(snapshot);
  const annualGrossPayKrw = snapshot.totalsKrw.grossPayKrw;
  const nonTaxableAnnualIncomeKrw = toKrwInteger(
    input.nonTaxableAnnualIncomeKrw ?? 0,
    "nonTaxableAnnualIncomeKrw"
  );
  const nonTaxableWithinAnnualGross = nonTaxableAnnualIncomeKrw <= annualGrossPayKrw;

  const submissions = isPayrollYearEndFilingSubmissionEnabled()
    ? await listYearEndFilingSubmissionSummaries(context, {
      year: input.year,
      employeeId: input.employeeId
    })
    : [];
  const pendingSubmissionCount = submissions.filter((submission) => submission.status === "submitted").length;
  const rejectedSubmissionCount = submissions.filter(
    (submission) => submission.status === "acknowledged" && submission.ack?.ackStatus === "rejected"
  ).length;

  const entityId = `${input.year}_${input.employeeId}`;
  const finalizationLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 200
  });
  const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
  const finalizationPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
  const settlementHash = finalizationPayload
    ? resolveYearEndSettlementHashFromFinalizationPayload(finalizationPayload)
    : null;

  const checks: GetPayrollYearEndPreflightChecklistResult["checklist"]["checks"] = [
    {
      key: "confirmed_runs_present",
      label: "Confirmed Runs Present",
      status: snapshot.confirmedRuns.length > 0 ? "pass" : "fail",
      detail:
        snapshot.confirmedRuns.length > 0
          ? `${snapshot.confirmedRuns.length} confirmed runs found`
          : "no confirmed payroll runs found for selected year"
    },
    {
      key: "no_previewed_runs",
      label: "No Previewed Runs",
      status: snapshot.previewedRuns.length === 0 ? "pass" : "fail",
      detail:
        snapshot.previewedRuns.length === 0
          ? "all runs are confirmed"
          : `${snapshot.previewedRuns.length} previewed runs remain`
    },
    {
      key: "no_undistributed_runs",
      label: "No Undistributed Runs",
      status: filingGuard.undistributedRuns.length === 0 ? "pass" : "fail",
      detail:
        filingGuard.undistributedRuns.length === 0
          ? "all confirmed runs are distributed"
          : `${filingGuard.undistributedRuns.length} confirmed runs are not distributed`
    },
    {
      key: "no_pending_receipts",
      label: "No Pending Payslip Receipts",
      status: filingGuard.pendingReceiptRuns.length === 0 ? "pass" : "fail",
      detail:
        filingGuard.pendingReceiptRuns.length === 0
          ? "all distributed runs are receipt-confirmed"
          : `${filingGuard.pendingReceiptRuns.length} distributed runs are pending receipt confirmation`
    },
    {
      key: "non_taxable_within_annual_gross",
      label: "Non-Taxable Income Guard",
      status: nonTaxableWithinAnnualGross ? "pass" : "fail",
      detail: nonTaxableWithinAnnualGross
        ? `non-taxable annual income ${nonTaxableAnnualIncomeKrw.toLocaleString("ko-KR")} KRW is within annual gross ${annualGrossPayKrw.toLocaleString("ko-KR")} KRW`
        : `non-taxable annual income ${nonTaxableAnnualIncomeKrw.toLocaleString("ko-KR")} KRW exceeds annual gross ${annualGrossPayKrw.toLocaleString("ko-KR")} KRW`
    },
    {
      key: "no_pending_filing_submissions",
      label: "No Pending Filing Submissions",
      status: pendingSubmissionCount === 0 ? "pass" : "fail",
      detail:
        pendingSubmissionCount === 0
          ? "no pending filing submissions"
          : `${pendingSubmissionCount} pending filing submissions require acknowledge/cancel before finalize handoff`
    },
    {
      key: "settlement_hash_available",
      label: "Settlement Hash Trace",
      status: settlementHash ? "pass" : "warn",
      detail: settlementHash
        ? `latest settlement hash available (${settlementHash.slice(0, 12)}...)`
        : "no finalized settlement hash found yet"
    }
  ];

  const passCount = checks.filter((check) => check.status === "pass").length;
  const failCount = checks.filter((check) => check.status === "fail").length;
  const warnCount = checks.filter((check) => check.status === "warn").length;

  return {
    checklist: {
      year: input.year,
      employeeId: input.employeeId,
      periodStart: snapshot.periodStart.toISOString(),
      periodEnd: snapshot.periodEnd.toISOString(),
      summary: {
        readyToFinalize: failCount === 0,
        passCount,
        failCount,
        warnCount
      },
      metrics: {
        annualGrossPayKrw,
        nonTaxableAnnualIncomeKrw,
        totalRuns: snapshot.runs.length,
        confirmedRuns: snapshot.confirmedRuns.length,
        previewedRuns: snapshot.previewedRuns.length,
        undistributedRuns: filingGuard.undistributedRuns.length,
        pendingReceiptRuns: filingGuard.pendingReceiptRuns.length,
        pendingSubmissionCount,
        rejectedSubmissionCount,
        settlementHash
      },
      checks
    }
  };
}

export async function getPayrollYearEndWithholdingReceiptDocument(
  context: ServiceContext,
  input: GetPayrollYearEndWithholdingReceiptDocumentInput
): Promise<GetPayrollYearEndWithholdingReceiptDocumentResult> {
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requireEmployeeWithinTenant(context.dataAccess, actor, input.employeeId);
  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canManage = permissions.has(Permissions.payrollRunConfirm);
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);

  if (!canManage && !canListAny && !canListOwn) {
    throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
  }
  if (!canManage && !canListAny && actor.id !== input.employeeId) {
    throw new ServiceError(403, "employees can only read their own withholding receipt document");
  }

  const entityId = `${input.year}_${input.employeeId}`;
  const issuedLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.withholding_receipt_issued"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 200
  });
  const latestIssuedLog = issuedLogs[issuedLogs.length - 1] ?? null;
  const receipt = asYearEndWithholdingReceiptSummaryPayload(latestIssuedLog?.payload ?? null);
  if (!receipt || !receipt.issued || !receipt.issuedAt) {
    throw new ServiceError(404, "issued withholding receipt not found");
  }

  const artifact = buildYearEndWithholdingReceiptDocumentArtifact(receipt, input.format);
  const generatedAt = new Date().toISOString();
  const contentSha256 = createHash("sha256").update(artifact.content).digest("hex");

  return {
    document: {
      year: input.year,
      employeeId: input.employeeId,
      receiptNumber: receipt.receiptNumber,
      issuedAt: receipt.issuedAt,
      issuerName: receipt.issuerName,
      format: input.format,
      fileName: artifact.fileName,
      contentType: artifact.contentType,
      contentSha256,
      generatedAt,
      receipt,
      content: artifact.content
    }
  };
}

export async function getPayrollYearEndFinalizedSettlement(
  context: ServiceContext,
  input: GetPayrollYearEndFinalizedSettlementInput
): Promise<GetPayrollYearEndFinalizedSettlementResult> {
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requireEmployeeWithinTenant(context.dataAccess, actor, input.employeeId);
  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canManage = permissions.has(Permissions.payrollRunConfirm);
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);

  if (!canManage && !canListAny && !canListOwn) {
    throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
  }
  if (!canManage && !canListAny && actor.id !== input.employeeId) {
    throw new ServiceError(403, "employees can only read their own finalized year-end settlement");
  }

  const entityId = `${input.year}_${input.employeeId}`;
  const finalizationLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 200
  });
  const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
  const finalizationPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
  if (
    !finalizationPayload ||
    !finalizationPayload.finalizedAt ||
    !finalizationPayload.finalized
  ) {
    throw new ServiceError(404, "finalized year-end settlement not found");
  }

  const settlementHash = resolveYearEndSettlementHashFromFinalizationPayload(finalizationPayload);

  return {
    settlement: {
      year: finalizationPayload.year,
      employeeId: finalizationPayload.employeeId,
      finalizationId: finalizationPayload.finalizationId,
      finalizedAt: finalizationPayload.finalizedAt,
      settlementHash,
      annualTotalsKrw: finalizationPayload.annualTotalsKrw,
      settlementKrw: finalizationPayload.settlementKrw,
      deductionEligibility: finalizationPayload.deductionEligibility,
      deductionItemsKrw: finalizationPayload.deductionItemsKrw,
      runStates: finalizationPayload.runStates
    }
  };
}

export async function issuePayrollYearEndWithholdingReceipt(
  context: ServiceContext,
  input: IssuePayrollYearEndWithholdingReceiptInput
): Promise<IssuePayrollYearEndWithholdingReceiptResult> {
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, input.employeeId);
  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canManage = permissions.has(Permissions.payrollRunConfirm);
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);

  if (input.issue) {
    if (!canManage) {
      throw new ServiceError(403, `payroll issue requires ${Permissions.payrollRunConfirm} permission`);
    }
  } else {
    if (!canManage && !canListAny && !canListOwn) {
      throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
    }
    if (!canManage && !canListAny && actor.id !== input.employeeId) {
      throw new ServiceError(403, "employees can only preview their own withholding receipt");
    }
  }

  const { periodStart, periodEnd } = getYearPeriodInSeoul(input.year);
  const tenantScope = resolveTenantScope(actor);
  const runs = await context.dataAccess.payroll.listInPeriod({
    periodStart,
    periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId
  });

  const confirmedRuns = runs.filter((run) => run.state === "CONFIRMED");
  const previewedRuns = runs.filter((run) => run.state !== "CONFIRMED");
  const totalsKrw = aggregatePayrollTotalsKrw(confirmedRuns);
  const withholdingReceiptGuard = buildYearEndWithholdingReceiptGuardCore({
    runs,
    confirmedRuns,
    previewedRuns
  }) as {
    runStates: YearEndFilingGuardRunStates;
    blockingReasons: string[];
    canIssue: boolean;
  };

  if (input.issue && !withholdingReceiptGuard.canIssue) {
    throw new ServiceError(409, "withholding receipt cannot be issued", {
      blockingReasons: withholdingReceiptGuard.blockingReasons,
      runStates: withholdingReceiptGuard.runStates
    });
  }

  const receiptNumber = `WR-${input.year}-${input.employeeId}`;
  const issuerName = input.issuerName?.trim() ? input.issuerName.trim() : actor.role;
  const issuedAt = input.issue ? new Date().toISOString() : null;
  const payload = buildYearEndWithholdingReceiptSummaryCore({
    year: input.year,
    employeeId: input.employeeId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    issue: input.issue,
    receiptNumber,
    issuerName,
    issuedAt,
    runStates: withholdingReceiptGuard.runStates,
    annualTotalsKrw: totalsKrw,
    blockingReasons: withholdingReceiptGuard.blockingReasons
  }) as PayrollYearEndWithholdingReceiptSummary;

  const entityId = `${input.year}_${input.employeeId}`;
  if (input.issue) {
    await context.dataAccess.audit.append({
      action: "payroll.year_end.withholding_receipt_issued",
      entityType: "PayrollYearEnd",
      entityId,
      organizationId: employee.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
    await getEventPublisher(context).publish({
      name: "payroll.year_end.withholding_receipt.issued.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollYearEnd",
      entityId,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
  } else {
    await context.dataAccess.audit.append({
      action: "payroll.year_end.withholding_receipt_previewed",
      entityType: "PayrollYearEnd",
      entityId,
      organizationId: employee.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
    await getEventPublisher(context).publish({
      name: "payroll.year_end.withholding_receipt.previewed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollYearEnd",
      entityId,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
  }

  return {
    receipt: payload
  };
}

export async function readDeductionProfile(
  context: ServiceContext,
  profileId: string
): Promise<DeductionProfileEntity> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileRead, "read");
  if (!profileId.trim()) {
    throw new ServiceError(400, "profileId is required");
  }

  const tenantScope = resolveTenantScope(context.actor);
  const profile = await context.dataAccess.deductionProfiles.findById(profileId);
  if (!profile) {
    throw new ServiceError(404, "deduction profile not found");
  }
  ensureTenantMatch(tenantScope, profile.organizationId, "deduction profile not found");

  await context.dataAccess.audit.append({
    action: "payroll.deduction_profile.read",
    entityType: "DeductionProfile",
    entityId: profile.id,
    organizationId: profile.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id
  });

  return profile;
}

export async function upsertDeductionProfile(
  context: ServiceContext,
  input: UpsertDeductionProfileInput
): Promise<UpsertDeductionProfileResult> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileWrite, "write");
  if (!input.profileId.trim()) {
    throw new ServiceError(400, "profileId is required");
  }
  if (!input.name.trim()) {
    throw new ServiceError(400, "name is required");
  }

  const tenantScope = resolveTenantScope(context.actor);
  const withholdingRate = toRateNumber(input.withholdingRate, "withholdingRate");
  const socialInsuranceRate = toRateNumber(input.socialInsuranceRate, "socialInsuranceRate");
  const fixedOtherDeductionKrw = toKrwInteger(
    input.fixedOtherDeductionKrw,
    "fixedOtherDeductionKrw"
  );

  const profile = await context.dataAccess.deductionProfiles.upsert({
    id: input.profileId,
    organizationId: tenantScope ?? null,
    name: input.name,
    mode: input.mode,
    withholdingRate,
    socialInsuranceRate,
    fixedOtherDeductionKrw,
    active: input.active
  });

  await context.dataAccess.audit.append({
    action: "payroll.deduction_profile.updated",
    entityType: "DeductionProfile",
    entityId: profile.id,
    organizationId: profile.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      version: profile.version,
      mode: profile.mode,
      withholdingRate: profile.withholdingRate,
      socialInsuranceRate: profile.socialInsuranceRate,
      fixedOtherDeductionKrw: profile.fixedOtherDeductionKrw,
      active: profile.active
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.deduction_profile.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "DeductionProfile",
    entityId: profile.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      version: profile.version,
      organizationId: profile.organizationId,
      mode: profile.mode,
      withholdingRate: profile.withholdingRate,
      socialInsuranceRate: profile.socialInsuranceRate,
      fixedOtherDeductionKrw: profile.fixedOtherDeductionKrw,
      active: profile.active
    }
  });

  return { profile };
}

export async function listDeductionProfiles(
  context: ServiceContext,
  input: ListDeductionProfilesInput
): Promise<DeductionProfileEntity[]> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileRead, "read");
  const tenantScope = resolveTenantScope(context.actor);
  return await context.dataAccess.deductionProfiles.list({
    organizationId: tenantScope ?? undefined,
    active: input.active,
    mode: input.mode
  });
}
