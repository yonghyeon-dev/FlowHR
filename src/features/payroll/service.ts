import type { Actor } from "@/lib/actor";
import { createHash } from "node:crypto";
import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions, type Permission } from "@/lib/rbac";
import { applyApprovalExecutionAction, assertApprovalPolicyGate } from "@/features/approval/service";
import { ensureTenantMatch, requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import {
  calculateGrossPay,
  derivePayableMinutes,
  type Multipliers,
  type PayableMinutes
} from "@/lib/payroll-rules";
import type {
  AuditLogEntity,
  DataAccess,
  DeductionProfileEntity,
  PayrollRunEntity
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ServiceError } from "@/features/shared/service-error";
import { getPayrollKrIncomeTaxLookupPreset } from "@/features/payroll/kr-income-tax-lookup-presets";
import { getPayrollKrIncomeSplitItemPreset } from "@/features/payroll/kr-income-split-item-presets";
import { findPayrollKrIncomeSplitItemCodeDictionaryEntry } from "@/features/payroll/kr-income-split-item-code-dictionary";

type PreviewPayrollInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  hourlyRateKrw: number;
  multipliers: Multipliers;
};

type ManualDeductions = {
  deductionMode: "manual";
  deductions: {
    withholdingTaxKrw: number;
    socialInsuranceKrw: number;
    otherDeductionsKrw: number;
    breakdown?: Record<string, number>;
  };
};

type ProfileDeductions = {
  deductionMode: "profile";
  profileId: string;
  expectedProfileVersion?: number;
};

type StatutoryKrBaselineDeductions = {
  deductionMode: "statutory_kr_baseline";
  statutory?: {
    nonTaxableIncomeKrw: number;
    taxableIncomeKrw?: number;
    taxableIncomeItems?: Array<{
      code: string;
      category: string;
      amountKrw: number;
    }>;
    nonTaxableIncomeItems?: Array<{
      code: string;
      category: string;
      amountKrw: number;
    }>;
    incomeSplitItemPresetId?: string;
    incomeTaxBrackets?: Array<{
      upToKrw: number | null;
      rate: number;
    }>;
    incomeTaxLookupTable?: Array<{
      upToKrw: number | null;
      taxKrw: number;
    }>;
    incomeTaxLookupPresetId?: string;
    additionalTaxCreditKrw: number;
    dependentCount: number;
    dependentTaxCreditPerPersonKrw: number;
    requireMonthlyBoundary: boolean;
    incomeTaxRate: number;
    localIncomeTaxRate: number;
    nationalPensionRate: number;
    nationalPensionCapKrw?: number;
    healthInsuranceRate: number;
    healthInsuranceCapKrw?: number;
    longTermCareRateOnHealth: number;
    employmentInsuranceRate: number;
    employmentInsuranceCapKrw?: number;
    insuranceRounding?: {
      mode: "round" | "floor" | "ceil";
      nationalPensionUnitKrw: number;
      healthInsuranceUnitKrw: number;
      longTermCareUnitKrw: number;
      employmentInsuranceUnitKrw: number;
    };
    otherDeductionsKrw: number;
  };
};

type PreviewPayrollWithDeductionsInput = PreviewPayrollInput &
  (ManualDeductions | ProfileDeductions | StatutoryKrBaselineDeductions);

type PreviewPayrollInsuranceSettlementInput = PreviewPayrollInput & {
  employeeId: string;
  settlement?: {
    nonTaxableIncomeKrw: number;
    requireMonthlyBoundary: boolean;
    nationalPensionEmployeeRate: number;
    nationalPensionEmployerRate: number;
    nationalPensionCapKrw?: number;
    healthInsuranceEmployeeRate: number;
    healthInsuranceEmployerRate: number;
    healthInsuranceCapKrw?: number;
    longTermCareRateOnHealth: number;
    employmentInsuranceEmployeeRate: number;
    employmentInsuranceEmployerRate: number;
    employmentInsuranceCapKrw?: number;
    industrialAccidentEmployerRate: number;
    priorWithheldKrw: number;
    priorEmployerPaidKrw: number;
  };
};

type ClosePayrollPeriodInput = {
  periodStart: Date;
  periodEnd: Date;
  apply: boolean;
  settlement?: {
    priorPaidWithholdingTaxKrw: number;
    priorPaidSocialInsuranceKrw: number;
    priorPaidNetPayKrw: number;
  };
};

type PayslipDeliveryChannel = "in_app" | "email";

type DistributePayrollPayslipsInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  deliveryChannel: PayslipDeliveryChannel;
  dryRun: boolean;
};

type AcknowledgePayrollPayslipReceiptInput = {
  runId: string;
};

type PreviewPayrollYearEndSettlementInput = {
  year: number;
  employeeId: string;
  nonTaxableAnnualIncomeKrw: number;
  additionalTaxCreditKrw: number;
  annualIncomeTaxRate: number;
  localIncomeTaxRate: number;
};

type YearEndDeductionItemsInput = {
  personalPensionKrw: number;
  insurancePremiumKrw: number;
  medicalExpenseKrw: number;
  educationExpenseKrw: number;
  donationKrw: number;
  housingSavingsKrw: number;
};

type PayrollYearEndFilingExportFormat = "json" | "csv" | "jsonl" | "hometax_csv";
type PayrollYearEndFilingValidationMode = "basic" | "strict";
type PayrollYearEndFilingTransport = "manual_portal" | "hometax_upload" | "nts_api_mock";
type PayrollYearEndFilingAckStatus = "accepted" | "rejected";

type RecalculatePayrollYearEndSettlementInput = PreviewPayrollYearEndSettlementInput & {
  deductionItems: YearEndDeductionItemsInput;
};

type FinalizePayrollYearEndSettlementInput = PreviewPayrollYearEndSettlementInput & {
  deductionItems: YearEndDeductionItemsInput;
  apply: boolean;
  finalizedByNote?: string;
};

type ExportPayrollYearEndFilingDataInput = {
  year: number;
  employeeId: string;
  format: PayrollYearEndFilingExportFormat;
  validationMode: PayrollYearEndFilingValidationMode;
};

type SubmitPayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  format: PayrollYearEndFilingExportFormat;
  validationMode: PayrollYearEndFilingValidationMode;
  transport: PayrollYearEndFilingTransport;
  submissionNote?: string;
};

type ResubmitPayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  submissionId: string;
  format: PayrollYearEndFilingExportFormat;
  validationMode: PayrollYearEndFilingValidationMode;
  transport: PayrollYearEndFilingTransport;
  submissionNote?: string;
  resubmissionReason?: string;
};

type AcknowledgePayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  submissionId: string;
  ackStatus: PayrollYearEndFilingAckStatus;
  ackCode?: string;
  ackNote?: string;
  rejectionReasonCode?: string;
  rejectionReasonDetail?: string;
};

type CancelPayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  submissionId: string;
};

type ReopenPayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  submissionId: string;
};

type PayrollYearEndFilingSubmissionStatusFilter =
  | PayrollYearEndFilingSubmissionStatus
  | "all";
type PayrollYearEndFilingSubmissionAckStatusFilter = PayrollYearEndFilingAckStatus | "none" | "all";
type PayrollYearEndFilingSubmissionValidationStatusFilter = "pass" | "fail" | "all";
type PayrollYearEndFilingSubmissionTransportFilter = PayrollYearEndFilingTransport | "all";
type PayrollYearEndFilingSubmissionSortBy =
  | "submittedAt"
  | "attempt"
  | "status"
  | "ackStatus"
  | "validationStatus"
  | "transport";
type PayrollYearEndFilingSubmissionSortDirection = "asc" | "desc";

type ListPayrollYearEndFilingSubmissionsInput = {
  year: number;
  employeeId: string;
  status?: PayrollYearEndFilingSubmissionStatusFilter;
  ackStatus?: PayrollYearEndFilingSubmissionAckStatusFilter;
  validationStatus?: PayrollYearEndFilingSubmissionValidationStatusFilter;
  transport?: PayrollYearEndFilingSubmissionTransportFilter;
  search?: string;
  sortBy?: PayrollYearEndFilingSubmissionSortBy;
  sortDirection?: PayrollYearEndFilingSubmissionSortDirection;
};

type ListPayrollYearEndFilingSubmissionTimelineInput = {
  year: number;
  employeeId: string;
  submissionId: string;
};

type AddPayrollYearEndFilingEvidenceNoteInput = {
  year: number;
  employeeId: string;
  submissionId: string;
  note: string;
};

type IssuePayrollYearEndWithholdingReceiptInput = {
  year: number;
  employeeId: string;
  issue: boolean;
  issuerName?: string;
};

type UpsertDeductionProfileInput = {
  profileId: string;
  name: string;
  mode: "manual" | "profile";
  withholdingRate: number | null;
  socialInsuranceRate: number | null;
  fixedOtherDeductionKrw: number;
  active: boolean;
};

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
  annualIncomeTaxAfterCreditKrw: number;
  annualLocalIncomeTaxKrw: number;
  annualTaxLiabilityKrw: number;
  priorWithheldTaxKrw: number;
  withholdingDeltaKrw: number;
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
  runStates: YearEndRunStates;
  annualTotalsKrw: PayrollTotalsKrw;
  settlementKrw: YearEndSettlementKrw;
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
    runStates: YearEndRunStates;
    annualTotalsKrw: PayrollTotalsKrw;
    deductionItemsKrw: YearEndDeductionItemsInput & {
      totalIncomeDeductionKrw: number;
      appliedIncomeDeductionKrw: number;
      taxableAnnualIncomeBeforeDeductionKrw: number;
      taxableAnnualIncomeAfterDeductionKrw: number;
    };
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
    runStates: YearEndFilingGuardRunStates;
    annualTotalsKrw: PayrollTotalsKrw;
    deductionItemsKrw: YearEndDeductionItemsInput & {
      totalIncomeDeductionKrw: number;
      appliedIncomeDeductionKrw: number;
      taxableAnnualIncomeBeforeDeductionKrw: number;
      taxableAnnualIncomeAfterDeductionKrw: number;
    };
    settlementKrw: YearEndSettlementKrw;
    blockingReasons: string[];
  };
};

type ExportPayrollYearEndFilingDataResult = {
  filingData: {
    year: number;
    employeeId: string;
    finalizationId: string;
    finalizedAt: string;
    exportedAt: string;
    format: PayrollYearEndFilingExportFormat;
    validationMode: PayrollYearEndFilingValidationMode;
    runStates: YearEndFilingGuardRunStates;
    annualTotalsKrw: PayrollTotalsKrw;
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

type IssuePayrollYearEndWithholdingReceiptResult = {
  receipt: {
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

type IncomeTaxBracket = {
  upToKrw: number | null;
  rate: number;
};

type IncomeTaxLookupRow = {
  upToKrw: number | null;
  taxKrw: number;
};

type StatutoryIncomeSplitItem = {
  code: string;
  category: string;
  amountKrw: number;
};

type InsuranceRoundingMode = "round" | "floor" | "ceil";

type InsuranceRoundingRules = {
  mode: InsuranceRoundingMode;
  nationalPensionUnitKrw: number;
  healthInsuranceUnitKrw: number;
  longTermCareUnitKrw: number;
  employmentInsuranceUnitKrw: number;
};

type InsuranceRoundingInput = {
  mode?: InsuranceRoundingMode;
  nationalPensionUnitKrw?: number;
  healthInsuranceUnitKrw?: number;
  longTermCareUnitKrw?: number;
  employmentInsuranceUnitKrw?: number;
};

const emptyTotals: PayableMinutes = {
  regular: 0,
  overtime: 0,
  night: 0,
  holiday: 0
};

const payrollYearEndAcceptedAckCodeCatalog: PayrollYearEndFilingAckCodeCatalogItem[] = [
  {
    code: "ACK-OK",
    label: "Accepted",
    description: "Submission accepted without additional correction request.",
    defaultNote: "accepted"
  },
  {
    code: "ACK-2026-OK",
    label: "Accepted (Legacy)",
    description: "Legacy accepted code maintained for backward-compatible replay.",
    defaultNote: "accepted"
  },
  {
    code: "ACK-ACCEPTED-WARNING",
    label: "Accepted With Warning",
    description: "Submission accepted with follow-up recommendation.",
    defaultNote: "accepted with warning"
  }
];

const payrollYearEndRejectedAckCodeCatalog: PayrollYearEndFilingAckCodeCatalogItem[] = [
  {
    code: "ACK-REJECT",
    label: "Rejected",
    description: "Submission rejected and correction is required.",
    defaultNote: "rejected"
  },
  {
    code: "ACK-REJECT-VALIDATION",
    label: "Rejected (Validation)",
    description: "Submission failed validation checks.",
    defaultNote: "rejected due to validation errors"
  },
  {
    code: "ACK-REJECT-FORMAT",
    label: "Rejected (Format)",
    description: "Submission format is invalid for filing channel.",
    defaultNote: "rejected due to format mismatch"
  },
  {
    code: "ACK-REJECT-COVERAGE",
    label: "Rejected (Coverage)",
    description: "Submission coverage or run mapping is incomplete.",
    defaultNote: "rejected due to coverage mismatch"
  }
];

const payrollYearEndRejectionReasonCatalog: PayrollYearEndFilingRejectionReasonCatalogItem[] = [
  {
    code: "VALIDATION_ERROR",
    label: "Validation Error",
    description: "Schema or value validation failed."
  },
  {
    code: "FORMAT_MISMATCH",
    label: "Format Mismatch",
    description: "Submitted artifact format does not match required format."
  },
  {
    code: "EMPLOYEE_IDENTIFIER_MISMATCH",
    label: "Employee Identifier Mismatch",
    description: "Employee identifier values do not match filing expectation."
  },
  {
    code: "AMOUNT_MISMATCH",
    label: "Amount Mismatch",
    description: "Declared totals differ from reconciled payroll totals."
  },
  {
    code: "MISSING_SUPPORTING_EVIDENCE",
    label: "Missing Supporting Evidence",
    description: "Required notes or supporting evidence are missing."
  },
  {
    code: "OTHER",
    label: "Other",
    description: "Other rejection reason requiring manual review."
  }
];

const payrollYearEndDefaultRejectedReasonCode = "OTHER";

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
  return {
    acceptedCodes: payrollYearEndAcceptedAckCodeCatalog.map((item) => ({ ...item })),
    rejectedCodes: payrollYearEndRejectedAckCodeCatalog.map((item) => ({ ...item })),
    rejectionReasons: payrollYearEndRejectionReasonCatalog.map((item) => ({ ...item }))
  };
}

function resolvePayrollYearEndFilingAckPayload(input: {
  ackStatus: PayrollYearEndFilingAckStatus;
  ackCode?: string;
  ackNote?: string;
  rejectionReasonCode?: string;
  rejectionReasonDetail?: string;
}) {
  const allowedAckCodes =
    input.ackStatus === "accepted"
      ? payrollYearEndAcceptedAckCodeCatalog
      : payrollYearEndRejectedAckCodeCatalog;
  const fallbackAckCode = allowedAckCodes[0]?.code;
  if (!fallbackAckCode) {
    throw new ServiceError(500, "filing ack code catalog is not configured");
  }

  const ackCodeCandidate = input.ackCode?.trim() ? input.ackCode.trim() : fallbackAckCode;
  if (!allowedAckCodes.some((entry) => entry.code === ackCodeCandidate)) {
    throw new ServiceError(409, "ack code is not allowed for selected ack status", {
      ackStatus: input.ackStatus,
      allowedAckCodes: allowedAckCodes.map((entry) => entry.code)
    });
  }

  if (input.ackStatus === "accepted") {
    if (input.rejectionReasonCode?.trim() || input.rejectionReasonDetail?.trim()) {
      throw new ServiceError(409, "rejection reason fields are only allowed when ackStatus is rejected");
    }
    const ackNote = input.ackNote?.trim() ? input.ackNote.trim() : null;
    return {
      ackCode: ackCodeCandidate,
      ackNote,
      rejectionReasonCode: null,
      rejectionReasonDetail: null
    } as const;
  }

  const rejectionReasonCodeCandidate = input.rejectionReasonCode?.trim()
    ? input.rejectionReasonCode.trim()
    : payrollYearEndDefaultRejectedReasonCode;
  if (
    !payrollYearEndRejectionReasonCatalog.some(
      (entry) => entry.code === rejectionReasonCodeCandidate
    )
  ) {
    throw new ServiceError(409, "rejection reason code is not defined in catalog", {
      rejectionReasonCode: rejectionReasonCodeCandidate,
      allowedRejectionReasonCodes: payrollYearEndRejectionReasonCatalog.map((entry) => entry.code)
    });
  }

  return {
    ackCode: ackCodeCandidate,
    ackNote: input.ackNote?.trim() ? input.ackNote.trim() : null,
    rejectionReasonCode: rejectionReasonCodeCandidate,
    rejectionReasonDetail: input.rejectionReasonDetail?.trim()
      ? input.rejectionReasonDetail.trim()
      : null
  } as const;
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "periodEnd must be after periodStart");
  }
}

function toKrwInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new ServiceError(400, `${fieldName} must be a non-negative integer`);
  }
  return value;
}

function isPayrollDeductionsEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_DEDUCTIONS_V1 ?? process.env.PAYROLL_DEDUCTIONS_V1 ?? "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollDeductionProfileEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1 ??
    process.env.PAYROLL_DEDUCTION_PROFILE_V1 ??
    "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollKrBaselineEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_KR_BASELINE_V1 ?? process.env.PAYROLL_KR_BASELINE_V1 ?? "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollKrInsuranceSettlementEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_KR_INSURANCE_SETTLEMENT_V1 ??
    process.env.PAYROLL_KR_INSURANCE_SETTLEMENT_V1 ??
    "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollClosePeriodEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_CLOSE_PERIOD_V1 ?? process.env.PAYROLL_CLOSE_PERIOD_V1 ?? "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollPayslipDeliveryEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_PAYSLIP_DELIVERY_V1 ??
    process.env.PAYROLL_PAYSLIP_DELIVERY_V1 ??
    "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollYearEndEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_YEAR_END_V1 ?? process.env.PAYROLL_YEAR_END_V1 ?? "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollYearEndDeductionInputEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 ??
    process.env.PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 ??
    "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollYearEndFilingExportEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 ??
    process.env.PAYROLL_YEAR_END_FILING_EXPORT_V1 ??
    "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollYearEndFilingSubmissionEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 ??
    process.env.PAYROLL_YEAR_END_FILING_SUBMISSION_V1 ??
    "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function getYearPeriodInSeoul(year: number) {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new ServiceError(400, "year must be between 2020 and 2100");
  }
  return {
    periodStart: new Date(`${year}-01-01T00:00:00+09:00`),
    periodEnd: new Date(`${year}-12-31T23:59:59+09:00`)
  };
}

function toRateNumber(value: number | null, fieldName: string) {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ServiceError(400, `${fieldName} must be between 0 and 1`);
  }
  return value;
}

function normalizeIncomeTaxBrackets(brackets?: IncomeTaxBracket[]): IncomeTaxBracket[] | null {
  if (!brackets || brackets.length === 0) {
    return null;
  }

  const normalized: IncomeTaxBracket[] = [];
  let lastFiniteUpper = -1;
  let hasOpenEnded = false;
  for (const [index, bracket] of brackets.entries()) {
    const rate = toRateNumber(bracket.rate, `statutory.incomeTaxBrackets[${index}].rate`) ?? 0;
    if (bracket.upToKrw === null) {
      if (index !== brackets.length - 1) {
        throw new ServiceError(
          400,
          "statutory.incomeTaxBrackets open-ended bracket(upToKrw=null) must be last"
        );
      }
      hasOpenEnded = true;
      normalized.push({ upToKrw: null, rate });
      continue;
    }

    const upToKrw = toKrwInteger(
      bracket.upToKrw,
      `statutory.incomeTaxBrackets[${index}].upToKrw`
    );
    if (upToKrw <= lastFiniteUpper) {
      throw new ServiceError(
        400,
        "statutory.incomeTaxBrackets upToKrw must be strictly increasing"
      );
    }
    lastFiniteUpper = upToKrw;
    normalized.push({ upToKrw, rate });
  }

  if (!hasOpenEnded) {
    throw new ServiceError(
      400,
      "statutory.incomeTaxBrackets must include open-ended bracket(upToKrw=null) as last entry"
    );
  }

  return normalized;
}

function normalizeIncomeTaxLookupTable(lookupTable?: IncomeTaxLookupRow[]): IncomeTaxLookupRow[] | null {
  if (!lookupTable || lookupTable.length === 0) {
    return null;
  }

  const normalized: IncomeTaxLookupRow[] = [];
  let lastFiniteUpper = -1;
  let lastTaxKrw = -1;
  let hasOpenEnded = false;
  for (const [index, row] of lookupTable.entries()) {
    const taxKrw = toKrwInteger(row.taxKrw, `statutory.incomeTaxLookupTable[${index}].taxKrw`);
    if (taxKrw < lastTaxKrw) {
      throw new ServiceError(
        400,
        "statutory.incomeTaxLookupTable taxKrw must be non-decreasing"
      );
    }
    lastTaxKrw = taxKrw;

    if (row.upToKrw === null) {
      if (index !== lookupTable.length - 1) {
        throw new ServiceError(
          400,
          "statutory.incomeTaxLookupTable open-ended row(upToKrw=null) must be last"
        );
      }
      hasOpenEnded = true;
      normalized.push({ upToKrw: null, taxKrw });
      continue;
    }

    const upToKrw = toKrwInteger(
      row.upToKrw,
      `statutory.incomeTaxLookupTable[${index}].upToKrw`
    );
    if (upToKrw <= lastFiniteUpper) {
      throw new ServiceError(
        400,
        "statutory.incomeTaxLookupTable upToKrw must be strictly increasing"
      );
    }
    lastFiniteUpper = upToKrw;
    normalized.push({ upToKrw, taxKrw });
  }

  if (!hasOpenEnded) {
    throw new ServiceError(
      400,
      "statutory.incomeTaxLookupTable must include open-ended row(upToKrw=null) as last entry"
    );
  }

  return normalized;
}

function normalizeStatutoryIncomeSplitItems(
  items: StatutoryIncomeSplitItem[] | undefined,
  fieldName: "statutory.taxableIncomeItems" | "statutory.nonTaxableIncomeItems"
) {
  if (!items || items.length === 0) {
    return null;
  }

  const normalized: StatutoryIncomeSplitItem[] = [];
  const seenCodes = new Set<string>();
  const dictionaryKind = fieldName === "statutory.taxableIncomeItems" ? "taxable" : "non_taxable";
  for (const [index, item] of items.entries()) {
    const code = item.code.trim();
    const category = item.category.trim();
    const amountKrw = toKrwInteger(item.amountKrw, `${fieldName}[${index}].amountKrw`);
    if (!code) {
      throw new ServiceError(400, `${fieldName}[${index}].code must not be blank`);
    }
    if (!category) {
      throw new ServiceError(400, `${fieldName}[${index}].category must not be blank`);
    }
    const normalizedCode = code.toLowerCase();
    if (seenCodes.has(normalizedCode)) {
      throw new ServiceError(400, `${fieldName} contains duplicate code: ${code}`);
    }
    const dictionaryEntry = findPayrollKrIncomeSplitItemCodeDictionaryEntry(code, dictionaryKind);
    if (!dictionaryEntry) {
      throw new ServiceError(400, `${fieldName}[${index}].code is not supported by dictionary: ${code}`);
    }
    if (category.toLowerCase() !== dictionaryEntry.category.toLowerCase()) {
      throw new ServiceError(
        400,
        `${fieldName}[${index}].category must match dictionary category(${dictionaryEntry.category}) for code ${dictionaryEntry.code}`
      );
    }
    seenCodes.add(normalizedCode);
    normalized.push({
      code: dictionaryEntry.code,
      category: dictionaryEntry.category,
      amountKrw
    });
  }

  return normalized;
}

function calculateProgressiveIncomeTaxKrw(taxableBaseKrw: number, brackets: IncomeTaxBracket[]) {
  let tax = 0;
  let lowerBound = 0;
  for (const bracket of brackets) {
    if (taxableBaseKrw <= lowerBound) {
      break;
    }
    const upperBound = bracket.upToKrw === null ? Number.POSITIVE_INFINITY : bracket.upToKrw;
    const segment = Math.min(taxableBaseKrw, upperBound) - lowerBound;
    if (segment > 0) {
      tax += segment * bracket.rate;
    }
    lowerBound = upperBound;
  }
  return toKrwInteger(Math.round(tax), "statutory.incomeTaxKrw");
}

function calculateLookupIncomeTaxKrw(taxableBaseKrw: number, lookupTable: IncomeTaxLookupRow[]) {
  for (const row of lookupTable) {
    if (row.upToKrw === null || taxableBaseKrw <= row.upToKrw) {
      return row.taxKrw;
    }
  }

  throw new ServiceError(400, "statutory.incomeTaxLookupTable does not include an applicable row");
}

function applyContributionCap(baseKrw: number, capKrw: number | undefined, fieldName: string) {
  if (capKrw === undefined) {
    return baseKrw;
  }
  const normalizedCap = toKrwInteger(capKrw, fieldName);
  return Math.min(baseKrw, normalizedCap);
}

function toPositiveKrwUnit(value: number | undefined, fieldName: string) {
  if (value === undefined) {
    return 1;
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new ServiceError(400, `${fieldName} must be a positive integer`);
  }
  return value;
}

function normalizeInsuranceRoundingRules(rules?: InsuranceRoundingInput): InsuranceRoundingRules {
  return {
    mode: rules?.mode ?? "round",
    nationalPensionUnitKrw: toPositiveKrwUnit(
      rules?.nationalPensionUnitKrw,
      "statutory.insuranceRounding.nationalPensionUnitKrw"
    ),
    healthInsuranceUnitKrw: toPositiveKrwUnit(
      rules?.healthInsuranceUnitKrw,
      "statutory.insuranceRounding.healthInsuranceUnitKrw"
    ),
    longTermCareUnitKrw: toPositiveKrwUnit(
      rules?.longTermCareUnitKrw,
      "statutory.insuranceRounding.longTermCareUnitKrw"
    ),
    employmentInsuranceUnitKrw: toPositiveKrwUnit(
      rules?.employmentInsuranceUnitKrw,
      "statutory.insuranceRounding.employmentInsuranceUnitKrw"
    )
  };
}

function roundKrwByRule(
  rawValueKrw: number,
  fieldName: string,
  mode: InsuranceRoundingMode,
  unitKrw: number
) {
  if (!Number.isFinite(rawValueKrw) || rawValueKrw < 0) {
    throw new ServiceError(400, `${fieldName} must be a non-negative finite number before rounding`);
  }
  const scaled = rawValueKrw / unitKrw;
  const roundedScaled =
    mode === "floor" ? Math.floor(scaled) : mode === "ceil" ? Math.ceil(scaled) : Math.round(scaled);
  return toKrwInteger(roundedScaled * unitKrw, fieldName);
}

type SeoulDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const seoulDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

function toSeoulDateTimeParts(value: Date): SeoulDateTimeParts {
  const parts = seoulDateTimeFormatter.formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((item) => item.type === type);
    return part ? Number(part.value) : NaN;
  };
  const rawHour = read("hour");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: read("minute"),
    second: read("second")
  };
}

function formatSeoulDateTime(parts: SeoulDateTimeParts) {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  const hour = String(parts.hour).padStart(2, "0");
  const minute = String(parts.minute).padStart(2, "0");
  const second = String(parts.second).padStart(2, "0");
  return `${parts.year}-${month}-${day} ${hour}:${minute}:${second} (Asia/Seoul)`;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function ensureMonthlyBoundaryInSeoul(periodStart: Date, periodEnd: Date) {
  const start = toSeoulDateTimeParts(periodStart);
  const end = toSeoulDateTimeParts(periodEnd);
  if (start.year !== end.year || start.month !== end.month) {
    throw new ServiceError(
      400,
      "statutory.requireMonthlyBoundary requires periodStart/periodEnd to be in the same month (Asia/Seoul)"
    );
  }

  if (start.day !== 1 || start.hour !== 0 || start.minute !== 0 || start.second !== 0) {
    throw new ServiceError(
      400,
      "statutory.requireMonthlyBoundary requires periodStart to be first day 00:00:00 (Asia/Seoul)"
    );
  }

  const monthLastDay = lastDayOfMonth(start.year, start.month);
  if (end.day !== monthLastDay || end.hour !== 23 || end.minute !== 59) {
    throw new ServiceError(
      400,
      "statutory.requireMonthlyBoundary requires periodEnd to be last day 23:59:* (Asia/Seoul)"
    );
  }
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
    const incomeTaxLookupPresetId = input.statutory?.incomeTaxLookupPresetId?.trim() || null;
    const incomeTaxLookupPreset = incomeTaxLookupPresetId
      ? getPayrollKrIncomeTaxLookupPreset(incomeTaxLookupPresetId)
      : null;
    if (incomeTaxLookupPresetId && !incomeTaxLookupPreset) {
      throw new ServiceError(
        400,
        `statutory.incomeTaxLookupPresetId is not supported: ${incomeTaxLookupPresetId}`
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
        "statutory.incomeTaxBrackets/statutory.incomeTaxLookupTable/statutory.incomeTaxLookupPresetId are mutually exclusive"
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
    const preCreditIncomeTaxKrw = incomeTaxLookupTable
      ? calculateLookupIncomeTaxKrw(taxableBaseKrw, incomeTaxLookupTable)
      : incomeTaxBrackets
        ? calculateProgressiveIncomeTaxKrw(taxableBaseKrw, incomeTaxBrackets)
        : toKrwInteger(Math.round(taxableBaseKrw * incomeTaxRate), "statutory.incomeTaxKrw");
    const selectedIncomeTaxLookupRow = incomeTaxLookupTable
      ? incomeTaxLookupTable.find((row) => row.upToKrw === null || taxableBaseKrw <= row.upToKrw) ??
        null
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
      selectedIncomeTaxLookupRow,
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

  const nationalPensionEmployeeKrw = toKrwInteger(
    Math.round(nationalPensionBaseKrw * nationalPensionEmployeeRate),
    "settlement.nationalPensionEmployeeKrw"
  );
  const nationalPensionEmployerKrw = toKrwInteger(
    Math.round(nationalPensionBaseKrw * nationalPensionEmployerRate),
    "settlement.nationalPensionEmployerKrw"
  );
  const healthInsuranceEmployeeKrw = toKrwInteger(
    Math.round(healthInsuranceBaseKrw * healthInsuranceEmployeeRate),
    "settlement.healthInsuranceEmployeeKrw"
  );
  const healthInsuranceEmployerKrw = toKrwInteger(
    Math.round(healthInsuranceBaseKrw * healthInsuranceEmployerRate),
    "settlement.healthInsuranceEmployerKrw"
  );
  const longTermCareEmployeeKrw = toKrwInteger(
    Math.round(healthInsuranceEmployeeKrw * longTermCareRateOnHealth),
    "settlement.longTermCareEmployeeKrw"
  );
  const longTermCareEmployerKrw = toKrwInteger(
    Math.round(healthInsuranceEmployerKrw * longTermCareRateOnHealth),
    "settlement.longTermCareEmployerKrw"
  );
  const employmentInsuranceEmployeeKrw = toKrwInteger(
    Math.round(employmentInsuranceBaseKrw * employmentInsuranceEmployeeRate),
    "settlement.employmentInsuranceEmployeeKrw"
  );
  const employmentInsuranceEmployerKrw = toKrwInteger(
    Math.round(employmentInsuranceBaseKrw * employmentInsuranceEmployerRate),
    "settlement.employmentInsuranceEmployerKrw"
  );
  const industrialAccidentEmployerKrw = toKrwInteger(
    Math.round(industrialAccidentBaseKrw * industrialAccidentEmployerRate),
    "settlement.industrialAccidentEmployerKrw"
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
  return {
    personalPensionKrw: toKrwInteger(
      deductionItems.personalPensionKrw,
      "deductionItems.personalPensionKrw"
    ),
    insurancePremiumKrw: toKrwInteger(
      deductionItems.insurancePremiumKrw,
      "deductionItems.insurancePremiumKrw"
    ),
    medicalExpenseKrw: toKrwInteger(deductionItems.medicalExpenseKrw, "deductionItems.medicalExpenseKrw"),
    educationExpenseKrw: toKrwInteger(
      deductionItems.educationExpenseKrw,
      "deductionItems.educationExpenseKrw"
    ),
    donationKrw: toKrwInteger(deductionItems.donationKrw, "deductionItems.donationKrw"),
    housingSavingsKrw: toKrwInteger(deductionItems.housingSavingsKrw, "deductionItems.housingSavingsKrw")
  };
}

function getYearEndDeductionTotalKrw(deductionItems: YearEndDeductionItemsInput) {
  return (
    deductionItems.personalPensionKrw +
    deductionItems.insurancePremiumKrw +
    deductionItems.medicalExpenseKrw +
    deductionItems.educationExpenseKrw +
    deductionItems.donationKrw +
    deductionItems.housingSavingsKrw
  );
}

function calculateYearEndSettlementKrw(
  totalsKrw: PayrollTotalsKrw,
  input: PreviewPayrollYearEndSettlementInput,
  incomeDeductionKrw: number
) {
  const nonTaxableAnnualIncomeKrw = toKrwInteger(
    input.nonTaxableAnnualIncomeKrw,
    "nonTaxableAnnualIncomeKrw"
  );
  const additionalTaxCreditKrw = toKrwInteger(input.additionalTaxCreditKrw, "additionalTaxCreditKrw");
  const annualIncomeTaxRate = toRateNumber(input.annualIncomeTaxRate, "annualIncomeTaxRate") ?? 0;
  const localIncomeTaxRate = toRateNumber(input.localIncomeTaxRate, "localIncomeTaxRate") ?? 0;
  const normalizedIncomeDeductionKrw = toKrwInteger(incomeDeductionKrw, "incomeDeductionKrw");

  const taxableAnnualIncomeBeforeDeductionKrw = Math.max(
    totalsKrw.grossPayKrw - nonTaxableAnnualIncomeKrw,
    0
  );
  const appliedIncomeDeductionKrw = Math.min(
    normalizedIncomeDeductionKrw,
    taxableAnnualIncomeBeforeDeductionKrw
  );
  const taxableAnnualIncomeKrw = taxableAnnualIncomeBeforeDeductionKrw - appliedIncomeDeductionKrw;
  const annualIncomeTaxBeforeCreditKrw = toKrwInteger(
    Math.round(taxableAnnualIncomeKrw * annualIncomeTaxRate),
    "annualIncomeTaxBeforeCreditKrw"
  );
  const annualIncomeTaxAfterCreditKrw = Math.max(
    annualIncomeTaxBeforeCreditKrw - additionalTaxCreditKrw,
    0
  );
  const annualLocalIncomeTaxKrw = toKrwInteger(
    Math.round(annualIncomeTaxAfterCreditKrw * localIncomeTaxRate),
    "annualLocalIncomeTaxKrw"
  );
  const annualTaxLiabilityKrw = annualIncomeTaxAfterCreditKrw + annualLocalIncomeTaxKrw;
  const priorWithheldTaxKrw = totalsKrw.withholdingTaxKrw;
  const withholdingDeltaKrw = annualTaxLiabilityKrw - priorWithheldTaxKrw;

  return {
    settlementKrw: {
      nonTaxableAnnualIncomeKrw,
      taxableAnnualIncomeKrw,
      annualIncomeTaxBeforeCreditKrw,
      additionalTaxCreditKrw,
      annualIncomeTaxAfterCreditKrw,
      annualLocalIncomeTaxKrw,
      annualTaxLiabilityKrw,
      priorWithheldTaxKrw,
      withholdingDeltaKrw
    },
    taxableAnnualIncomeBeforeDeductionKrw,
    appliedIncomeDeductionKrw
  };
}

type YearEndFilingGuard = {
  undistributedRuns: PayrollRunEntity[];
  pendingReceiptRuns: PayrollRunEntity[];
  runStates: YearEndFilingGuardRunStates;
  blockingReasons: string[];
  canFinalize: boolean;
};

function buildYearEndFilingGuard(snapshot: YearEndRunSnapshot): YearEndFilingGuard {
  const undistributedRuns = snapshot.confirmedRuns.filter((run) => run.payslipDistributedAt === null);
  const pendingReceiptRuns = snapshot.confirmedRuns.filter(
    (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
  );

  const blockingReasons: string[] = [];
  if (snapshot.confirmedRuns.length === 0) {
    blockingReasons.push("no confirmed payroll runs found for selected year");
  }
  if (snapshot.previewedRuns.length > 0) {
    blockingReasons.push("all payroll runs must be confirmed before year-end finalization");
  }
  if (undistributedRuns.length > 0) {
    blockingReasons.push("all confirmed runs must be distributed before year-end finalization");
  }
  if (pendingReceiptRuns.length > 0) {
    blockingReasons.push(
      "all distributed runs must have payslip receipt confirmation before year-end finalization"
    );
  }

  return {
    undistributedRuns,
    pendingReceiptRuns,
    runStates: {
      totalRuns: snapshot.runs.length,
      confirmedRuns: snapshot.confirmedRuns.length,
      previewedRuns: snapshot.previewedRuns.length,
      undistributedRuns: undistributedRuns.length,
      pendingReceiptRuns: pendingReceiptRuns.length,
      previewedRunIds: snapshot.previewedRuns.map((run) => run.id),
      undistributedRunIds: undistributedRuns.map((run) => run.id),
      pendingReceiptRunIds: pendingReceiptRuns.map((run) => run.id)
    },
    blockingReasons,
    canFinalize: blockingReasons.length === 0
  };
}

type YearEndFinalizationAuditPayload = FinalizePayrollYearEndSettlementResult["settlement"];

function asYearEndFinalizationAuditPayload(payload: unknown): YearEndFinalizationAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFinalizationAuditPayload>;
  if (
    typeof candidate.year !== "number" ||
    typeof candidate.employeeId !== "string" ||
    typeof candidate.finalizationId !== "string" ||
    typeof candidate.finalizedAt !== "string" ||
    !candidate.runStates ||
    !candidate.annualTotalsKrw ||
    !candidate.deductionItemsKrw ||
    !candidate.settlementKrw
  ) {
    return null;
  }
  return candidate as YearEndFinalizationAuditPayload;
}

function buildYearEndFilingRecords(runs: PayrollRunEntity[]): YearEndFilingRecord[] {
  return runs
    .map((run) => {
      const withholdingTaxKrw = run.withholdingTaxKrw ?? 0;
      const socialInsuranceKrw = run.socialInsuranceKrw ?? 0;
      const otherDeductionsKrw = run.otherDeductionsKrw ?? 0;
      const totalDeductionsKrw =
        run.totalDeductionsKrw ?? withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw;
      const netPayKrw = run.netPayKrw ?? run.grossPayKrw - totalDeductionsKrw;
      return {
        runId: run.id,
        periodStart: run.periodStart.toISOString(),
        periodEnd: run.periodEnd.toISOString(),
        state: run.state,
        grossPayKrw: run.grossPayKrw,
        withholdingTaxKrw,
        socialInsuranceKrw,
        otherDeductionsKrw,
        totalDeductionsKrw,
        netPayKrw,
        payslipDistributedAt: run.payslipDistributedAt?.toISOString() ?? null,
        payslipReceiptConfirmedAt: run.payslipReceiptConfirmedAt?.toISOString() ?? null
      };
    })
    .sort((left, right) => left.runId.localeCompare(right.runId));
}

function buildYearEndFilingCsv(
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayload
) {
  const header = [
    "year",
    "employeeId",
    "finalizationId",
    "finalizedAt",
    "runId",
    "periodStart",
    "periodEnd",
    "state",
    "grossPayKrw",
    "withholdingTaxKrw",
    "socialInsuranceKrw",
    "otherDeductionsKrw",
    "totalDeductionsKrw",
    "netPayKrw",
    "payslipDistributedAt",
    "payslipReceiptConfirmedAt"
  ].join(",");

  const lines = rows.map((row) =>
    [
      payload.year,
      payload.employeeId,
      payload.finalizationId,
      payload.finalizedAt,
      row.runId,
      row.periodStart,
      row.periodEnd,
      row.state,
      row.grossPayKrw,
      row.withholdingTaxKrw,
      row.socialInsuranceKrw,
      row.otherDeductionsKrw,
      row.totalDeductionsKrw,
      row.netPayKrw,
      row.payslipDistributedAt ?? "",
      row.payslipReceiptConfirmedAt ?? ""
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function buildYearEndFilingJsonl(rows: YearEndFilingRecord[]) {
  return rows.map((row) => JSON.stringify(row)).join("\n");
}

function buildYearEndFilingHometaxCsv(rows: YearEndFilingRecord[], payload: YearEndFinalizationAuditPayload) {
  const header = [
    "year",
    "employeeId",
    "finalizationId",
    "runId",
    "grossPayKrw",
    "taxableAnnualIncomeKrw",
    "annualTaxLiabilityKrw",
    "withholdingDeltaKrw",
    "withholdingTaxKrw",
    "totalDeductionsKrw",
    "netPayKrw",
    "receiptConfirmedAt"
  ].join(",");
  const lines = rows.map((row) =>
    [
      payload.year,
      payload.employeeId,
      payload.finalizationId,
      row.runId,
      row.grossPayKrw,
      payload.settlementKrw.taxableAnnualIncomeKrw,
      payload.settlementKrw.annualTaxLiabilityKrw,
      payload.settlementKrw.withholdingDeltaKrw,
      row.withholdingTaxKrw,
      row.totalDeductionsKrw,
      row.netPayKrw,
      row.payslipReceiptConfirmedAt ?? ""
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function buildYearEndFilingArtifact(
  format: PayrollYearEndFilingExportFormat,
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayload
) {
  let content = "";
  let contentType = "application/json";
  let fileName = `payroll-year-end-${payload.year}-${payload.employeeId}.json`;

  if (format === "csv") {
    content = buildYearEndFilingCsv(rows, payload);
    contentType = "text/csv";
    fileName = `payroll-year-end-${payload.year}-${payload.employeeId}.csv`;
  } else if (format === "jsonl") {
    content = buildYearEndFilingJsonl(rows);
    contentType = "application/x-ndjson";
    fileName = `payroll-year-end-${payload.year}-${payload.employeeId}.jsonl`;
  } else if (format === "hometax_csv") {
    content = buildYearEndFilingHometaxCsv(rows, payload);
    contentType = "text/csv";
    fileName = `payroll-year-end-${payload.year}-${payload.employeeId}.hometax.csv`;
  } else {
    content = JSON.stringify(
      {
        year: payload.year,
        employeeId: payload.employeeId,
        finalizationId: payload.finalizationId,
        finalizedAt: payload.finalizedAt,
        records: rows
      },
      null,
      2
    );
  }

  return {
    fileName,
    contentType,
    content,
    byteLength: Buffer.byteLength(content, "utf8"),
    checksumSha256: createHash("sha256").update(content).digest("hex")
  };
}

function validateYearEndFilingRecords(rows: YearEndFilingRecord[], payload: YearEndFinalizationAuditPayload) {
  const aggregated = rows.reduce(
    (totals, row) => ({
      grossPayKrw: totals.grossPayKrw + row.grossPayKrw,
      withholdingTaxKrw: totals.withholdingTaxKrw + row.withholdingTaxKrw,
      totalDeductionsKrw: totals.totalDeductionsKrw + row.totalDeductionsKrw,
      netPayKrw: totals.netPayKrw + row.netPayKrw
    }),
    {
      grossPayKrw: 0,
      withholdingTaxKrw: 0,
      totalDeductionsKrw: 0,
      netPayKrw: 0
    }
  );

  const checks = {
    totalsMatch:
      aggregated.grossPayKrw === payload.annualTotalsKrw.grossPayKrw &&
      aggregated.withholdingTaxKrw === payload.annualTotalsKrw.withholdingTaxKrw &&
      aggregated.totalDeductionsKrw === payload.annualTotalsKrw.totalDeductionsKrw &&
      aggregated.netPayKrw === payload.annualTotalsKrw.netPayKrw,
    confirmedRunCountMatch: rows.length === payload.runStates.confirmedRuns,
    uniqueRunIds: new Set(rows.map((row) => row.runId)).size === rows.length,
    receiptCoverage: rows.every(
      (row) => typeof row.payslipReceiptConfirmedAt === "string" && row.payslipReceiptConfirmedAt.length > 0
    ),
    nonNegativeAmounts: rows.every(
      (row) =>
        row.grossPayKrw >= 0 &&
        row.withholdingTaxKrw >= 0 &&
        row.socialInsuranceKrw >= 0 &&
        row.otherDeductionsKrw >= 0 &&
        row.totalDeductionsKrw >= 0 &&
        row.netPayKrw >= 0
    )
  };

  const issues: string[] = [];
  if (!checks.totalsMatch) {
    issues.push("record totals do not match finalized annual totals");
  }
  if (!checks.confirmedRunCountMatch) {
    issues.push("record count does not match confirmed run count from finalization");
  }
  if (!checks.uniqueRunIds) {
    issues.push("duplicate run IDs detected in filing records");
  }
  if (!checks.receiptCoverage) {
    issues.push("one or more filing records are missing payslip receipt confirmation");
  }
  if (!checks.nonNegativeAmounts) {
    issues.push("one or more filing records include negative KRW amounts");
  }

  return {
    status: issues.length === 0 ? "pass" : "fail",
    issues,
    checks
  } as const;
}

type YearEndFilingPackageSubmittedAuditPayload = {
  submissionId: string;
  year: number;
  employeeId: string;
  attempt: number;
  resubmissionOfSubmissionId: string | null;
  resubmissionReason: string | null;
  finalizationId: string;
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
  submissionNote: string | null;
};

type YearEndFilingPackageAcknowledgedAuditPayload = {
  submissionId: string;
  ackStatus: PayrollYearEndFilingAckStatus;
  ackCode: string | null;
  ackNote: string | null;
  rejectionReasonCode: string | null;
  rejectionReasonDetail: string | null;
  acknowledgedAt: string;
  acknowledgedByRole: string;
  acknowledgedById: string | null;
};

type YearEndFilingPackageCanceledAuditPayload = {
  submissionId: string;
  canceledAt: string;
  canceledByRole: string;
  canceledById: string | null;
};

type YearEndFilingPackageReopenedAuditPayload = {
  submissionId: string;
  reopenedAt: string;
  reopenedByRole: string;
  reopenedById: string | null;
};

type YearEndFilingEvidenceNoteAddedAuditPayload = {
  submissionId: string;
  year: number;
  employeeId: string;
  note: string;
  notedAt: string;
  notedByRole: string;
  notedById: string | null;
};

function asYearEndFilingPackageSubmittedAuditPayload(
  payload: unknown
): YearEndFilingPackageSubmittedAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingPackageSubmittedAuditPayload>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.year !== "number" ||
    typeof candidate.employeeId !== "string" ||
    typeof candidate.finalizationId !== "string" ||
    typeof candidate.format !== "string" ||
    typeof candidate.validationMode !== "string" ||
    typeof candidate.transport !== "string" ||
    !candidate.artifact ||
    typeof candidate.submittedAt !== "string" ||
    typeof candidate.submittedByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    attempt: typeof candidate.attempt === "number" ? candidate.attempt : 1,
    resubmissionOfSubmissionId:
      typeof candidate.resubmissionOfSubmissionId === "string"
        ? candidate.resubmissionOfSubmissionId
        : null,
    resubmissionReason:
      typeof candidate.resubmissionReason === "string" ? candidate.resubmissionReason : null
  } as YearEndFilingPackageSubmittedAuditPayload;
}

function asYearEndFilingPackageAcknowledgedAuditPayload(
  payload: unknown
): YearEndFilingPackageAcknowledgedAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingPackageAcknowledgedAuditPayload>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.ackStatus !== "string" ||
    typeof candidate.acknowledgedAt !== "string" ||
    typeof candidate.acknowledgedByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    ackCode: typeof candidate.ackCode === "string" ? candidate.ackCode : null,
    ackNote: typeof candidate.ackNote === "string" ? candidate.ackNote : null,
    rejectionReasonCode:
      typeof candidate.rejectionReasonCode === "string" ? candidate.rejectionReasonCode : null,
    rejectionReasonDetail:
      typeof candidate.rejectionReasonDetail === "string" ? candidate.rejectionReasonDetail : null,
    acknowledgedById: typeof candidate.acknowledgedById === "string" ? candidate.acknowledgedById : null
  } as YearEndFilingPackageAcknowledgedAuditPayload;
}

function asYearEndFilingPackageCanceledAuditPayload(
  payload: unknown
): YearEndFilingPackageCanceledAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingPackageCanceledAuditPayload>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.canceledAt !== "string" ||
    typeof candidate.canceledByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    canceledById: typeof candidate.canceledById === "string" ? candidate.canceledById : null
  } as YearEndFilingPackageCanceledAuditPayload;
}

function asYearEndFilingPackageReopenedAuditPayload(
  payload: unknown
): YearEndFilingPackageReopenedAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingPackageReopenedAuditPayload>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.reopenedAt !== "string" ||
    typeof candidate.reopenedByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    reopenedById: typeof candidate.reopenedById === "string" ? candidate.reopenedById : null
  } as YearEndFilingPackageReopenedAuditPayload;
}

function asYearEndFilingEvidenceNoteAddedAuditPayload(
  payload: unknown
): YearEndFilingEvidenceNoteAddedAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingEvidenceNoteAddedAuditPayload>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.year !== "number" ||
    typeof candidate.employeeId !== "string" ||
    typeof candidate.note !== "string" ||
    typeof candidate.notedAt !== "string" ||
    typeof candidate.notedByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    notedById: typeof candidate.notedById === "string" ? candidate.notedById : null
  } as YearEndFilingEvidenceNoteAddedAuditPayload;
}

function buildYearEndFilingSubmissionSummaries(
  logs: AuditLogEntity[]
): PayrollYearEndFilingSubmissionSummary[] {
  const sortedLogs = [...logs].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
  );
  const submissions = new Map<string, PayrollYearEndFilingSubmissionSummary>();

  for (const log of sortedLogs) {
    if (
      log.action === "payroll.year_end.filing_package_submitted" ||
      log.action === "payroll.year_end.filing_package_resubmitted"
    ) {
      const payload = asYearEndFilingPackageSubmittedAuditPayload(log.payload);
      if (!payload) {
        continue;
      }
      submissions.set(payload.submissionId, {
        submissionId: payload.submissionId,
        year: payload.year,
        employeeId: payload.employeeId,
        attempt: payload.attempt,
        resubmissionOfSubmissionId: payload.resubmissionOfSubmissionId,
        resubmissionReason: payload.resubmissionReason,
        finalizationId: payload.finalizationId,
        format: payload.format,
        validationMode: payload.validationMode,
        transport: payload.transport,
        artifact: payload.artifact,
        validationStatus: payload.validationStatus,
        submittedAt: payload.submittedAt,
        submittedByRole: payload.submittedByRole,
        submittedById: payload.submittedById,
        status: "submitted",
        ack: null,
        submissionNote: payload.submissionNote
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_acknowledged") {
      const payload = asYearEndFilingPackageAcknowledgedAuditPayload(log.payload);
      if (!payload) {
        continue;
      }
      const existing = submissions.get(payload.submissionId);
      if (!existing) {
        continue;
      }
      existing.status = "acknowledged";
      existing.ack = {
        ackStatus: payload.ackStatus,
        ackCode: payload.ackCode,
        ackNote: payload.ackNote,
        rejectionReasonCode: payload.rejectionReasonCode,
        rejectionReasonDetail: payload.rejectionReasonDetail,
        acknowledgedAt: payload.acknowledgedAt,
        acknowledgedByRole: payload.acknowledgedByRole,
        acknowledgedById: payload.acknowledgedById
      };
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_canceled") {
      const payload = asYearEndFilingPackageCanceledAuditPayload(log.payload);
      if (!payload) {
        continue;
      }
      const existing = submissions.get(payload.submissionId);
      if (!existing) {
        continue;
      }
      existing.status = "canceled";
      existing.ack = null;
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_reopened") {
      const payload = asYearEndFilingPackageReopenedAuditPayload(log.payload);
      if (!payload) {
        continue;
      }
      const existing = submissions.get(payload.submissionId);
      if (!existing) {
        continue;
      }
      existing.status = "submitted";
      existing.ack = null;
    }
  }

  return Array.from(submissions.values()).sort(
    (left, right) =>
      right.submittedAt.localeCompare(left.submittedAt) ||
      right.submissionId.localeCompare(left.submissionId)
  );
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

  const payload: YearEndSettlementSummary = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
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
  const totalIncomeDeductionKrw = getYearEndDeductionTotalKrw(normalizedDeductionItems);
  const baselineSettled = calculateYearEndSettlementKrw(snapshot.totalsKrw, input, 0);
  const recalculatedSettled = calculateYearEndSettlementKrw(
    snapshot.totalsKrw,
    input,
    totalIncomeDeductionKrw
  );

  const payload = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    runStates: {
      totalRuns: snapshot.runs.length,
      confirmedRuns: snapshot.confirmedRuns.length,
      previewedRuns: snapshot.previewedRuns.length,
      previewedRunIds: snapshot.previewedRuns.map((run) => run.id)
    },
    annualTotalsKrw: snapshot.totalsKrw,
    deductionItemsKrw: {
      ...normalizedDeductionItems,
      totalIncomeDeductionKrw,
      appliedIncomeDeductionKrw: recalculatedSettled.appliedIncomeDeductionKrw,
      taxableAnnualIncomeBeforeDeductionKrw: recalculatedSettled.taxableAnnualIncomeBeforeDeductionKrw,
      taxableAnnualIncomeAfterDeductionKrw: recalculatedSettled.settlementKrw.taxableAnnualIncomeKrw
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
  const totalIncomeDeductionKrw = getYearEndDeductionTotalKrw(normalizedDeductionItems);
  const settled = calculateYearEndSettlementKrw(snapshot.totalsKrw, input, totalIncomeDeductionKrw);
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
    runStates: filingGuard.runStates,
    annualTotalsKrw: snapshot.totalsKrw,
    deductionItemsKrw: {
      ...normalizedDeductionItems,
      totalIncomeDeductionKrw,
      appliedIncomeDeductionKrw: settled.appliedIncomeDeductionKrw,
      taxableAnnualIncomeBeforeDeductionKrw: settled.taxableAnnualIncomeBeforeDeductionKrw,
      taxableAnnualIncomeAfterDeductionKrw: settled.settlementKrw.taxableAnnualIncomeKrw
    },
    settlementKrw: settled.settlementKrw,
    blockingReasons: filingGuard.blockingReasons
  };

  const entityId = `${input.year}_${input.employeeId}`;
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

async function listYearEndFilingSubmissionSummaries(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionsInput
) {
  const logs = await listYearEndFilingLifecycleLogs(context, input);
  return buildYearEndFilingSubmissionSummaries(logs);
}

async function listYearEndFilingLifecycleLogs(
  context: ServiceContext,
  input: {
    year: number;
    employeeId: string;
  }
) {
  const entityId = `${input.year}_${input.employeeId}`;
  return context.dataAccess.audit.list({
    actions: [
      "payroll.year_end.filing_package_submitted",
      "payroll.year_end.filing_package_resubmitted",
      "payroll.year_end.filing_package_canceled",
      "payroll.year_end.filing_package_reopened",
      "payroll.year_end.filing_package_acknowledged",
      "payroll.year_end.filing_evidence_note_added"
    ],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 1000
  });
}

function buildYearEndFilingSubmissionTimeline(
  logs: AuditLogEntity[],
  submissionId: string
): PayrollYearEndFilingTimelineEntry[] {
  const sortedLogs = [...logs].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const timeline: PayrollYearEndFilingTimelineEntry[] = [];

  for (const log of sortedLogs) {
    if (
      log.action === "payroll.year_end.filing_package_submitted" ||
      log.action === "payroll.year_end.filing_package_resubmitted"
    ) {
      const payload = asYearEndFilingPackageSubmittedAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action:
          log.action === "payroll.year_end.filing_package_submitted" ? "submitted" : "resubmitted",
        submissionId: payload.submissionId,
        occurredAt: payload.submittedAt,
        actorRole: payload.submittedByRole,
        actorId: payload.submittedById,
        attempt: payload.attempt,
        submissionNote: payload.submissionNote,
        resubmissionOfSubmissionId: payload.resubmissionOfSubmissionId,
        resubmissionReason: payload.resubmissionReason,
        ackStatus: null,
        ackCode: null,
        ackNote: null,
        rejectionReasonCode: null,
        rejectionReasonDetail: null,
        evidenceNote: null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_acknowledged") {
      const payload = asYearEndFilingPackageAcknowledgedAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action: "acknowledged",
        submissionId: payload.submissionId,
        occurredAt: payload.acknowledgedAt,
        actorRole: payload.acknowledgedByRole,
        actorId: payload.acknowledgedById,
        attempt: null,
        submissionNote: null,
        resubmissionOfSubmissionId: null,
        resubmissionReason: null,
        ackStatus: payload.ackStatus,
        ackCode: payload.ackCode,
        ackNote: payload.ackNote,
        rejectionReasonCode: payload.rejectionReasonCode,
        rejectionReasonDetail: payload.rejectionReasonDetail,
        evidenceNote: null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_canceled") {
      const payload = asYearEndFilingPackageCanceledAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action: "canceled",
        submissionId: payload.submissionId,
        occurredAt: payload.canceledAt,
        actorRole: payload.canceledByRole,
        actorId: payload.canceledById,
        attempt: null,
        submissionNote: null,
        resubmissionOfSubmissionId: null,
        resubmissionReason: null,
        ackStatus: null,
        ackCode: null,
        ackNote: null,
        rejectionReasonCode: null,
        rejectionReasonDetail: null,
        evidenceNote: null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_reopened") {
      const payload = asYearEndFilingPackageReopenedAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action: "reopened",
        submissionId: payload.submissionId,
        occurredAt: payload.reopenedAt,
        actorRole: payload.reopenedByRole,
        actorId: payload.reopenedById,
        attempt: null,
        submissionNote: null,
        resubmissionOfSubmissionId: null,
        resubmissionReason: null,
        ackStatus: null,
        ackCode: null,
        ackNote: null,
        rejectionReasonCode: null,
        rejectionReasonDetail: null,
        evidenceNote: null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_evidence_note_added") {
      const payload = asYearEndFilingEvidenceNoteAddedAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action: "evidence_note_added",
        submissionId: payload.submissionId,
        occurredAt: payload.notedAt,
        actorRole: payload.notedByRole,
        actorId: payload.notedById,
        attempt: null,
        submissionNote: null,
        resubmissionOfSubmissionId: null,
        resubmissionReason: null,
        ackStatus: null,
        ackCode: null,
        ackNote: null,
        rejectionReasonCode: null,
        rejectionReasonDetail: null,
        evidenceNote: payload.note
      });
    }
  }

  const actionOrder: Record<PayrollYearEndFilingTimelineAction, number> = {
    submitted: 0,
    resubmitted: 1,
    canceled: 2,
    reopened: 3,
    acknowledged: 4,
    evidence_note_added: 5
  };

  return timeline.sort((left, right) => {
    const timeDelta = Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
    if (timeDelta !== 0) {
      return timeDelta;
    }
    const actionDelta = actionOrder[left.action] - actionOrder[right.action];
    if (actionDelta !== 0) {
      return actionDelta;
    }
    return (left.evidenceNote ?? "").localeCompare(right.evidenceNote ?? "");
  });
}

function getYearEndFilingSubmissionAckStatus(
  submission: PayrollYearEndFilingSubmissionSummary
): PayrollYearEndFilingAckStatus | "none" {
  return submission.ack?.ackStatus ?? "none";
}

function normalizeYearEndFilingSubmissionSearch(search: string | undefined) {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return normalized;
}

function matchesYearEndFilingSubmissionSearch(
  submission: PayrollYearEndFilingSubmissionSummary,
  normalizedSearch: string
) {
  const searchTokens = [
    submission.submissionId,
    submission.resubmissionOfSubmissionId,
    submission.resubmissionReason,
    submission.submissionNote,
    submission.transport,
    submission.validationMode,
    submission.validationStatus,
    submission.status,
    String(submission.attempt),
    submission.ack?.ackStatus ?? null,
    submission.ack?.ackCode ?? null,
    submission.ack?.ackNote ?? null,
    submission.ack?.rejectionReasonCode ?? null,
    submission.ack?.rejectionReasonDetail ?? null
  ];
  return searchTokens.some((token) => token?.toLowerCase().includes(normalizedSearch));
}

function matchesYearEndFilingSubmissionFilters(
  submission: PayrollYearEndFilingSubmissionSummary,
  filters: ListPayrollYearEndFilingSubmissionsInput
) {
  if (filters.status && filters.status !== "all" && submission.status !== filters.status) {
    return false;
  }
  if (filters.ackStatus && filters.ackStatus !== "all") {
    if (filters.ackStatus === "none") {
      if (submission.ack !== null) {
        return false;
      }
    } else if (submission.ack?.ackStatus !== filters.ackStatus) {
      return false;
    }
  }
  if (
    filters.validationStatus &&
    filters.validationStatus !== "all" &&
    submission.validationStatus !== filters.validationStatus
  ) {
    return false;
  }
  if (filters.transport && filters.transport !== "all" && submission.transport !== filters.transport) {
    return false;
  }
  const normalizedSearch = normalizeYearEndFilingSubmissionSearch(filters.search);
  if (normalizedSearch && !matchesYearEndFilingSubmissionSearch(submission, normalizedSearch)) {
    return false;
  }
  return true;
}

const payrollYearEndFilingSubmissionStatusSortOrder: Record<
  PayrollYearEndFilingSubmissionStatus,
  number
> = {
  submitted: 0,
  acknowledged: 1,
  canceled: 2
};

const payrollYearEndFilingSubmissionAckStatusSortOrder: Record<
  PayrollYearEndFilingAckStatus | "none",
  number
> = {
  none: 0,
  accepted: 1,
  rejected: 2
};

const payrollYearEndFilingSubmissionValidationStatusSortOrder: Record<
  "pass" | "fail",
  number
> = {
  pass: 0,
  fail: 1
};

const payrollYearEndFilingSubmissionTransportSortOrder: Record<
  PayrollYearEndFilingTransport,
  number
> = {
  manual_portal: 0,
  hometax_upload: 1,
  nts_api_mock: 2
};

function compareYearEndFilingSubmissionBySortKey(
  left: PayrollYearEndFilingSubmissionSummary,
  right: PayrollYearEndFilingSubmissionSummary,
  sortBy: PayrollYearEndFilingSubmissionSortBy
) {
  if (sortBy === "submittedAt") {
    return left.submittedAt.localeCompare(right.submittedAt);
  }
  if (sortBy === "attempt") {
    return left.attempt - right.attempt;
  }
  if (sortBy === "status") {
    return (
      payrollYearEndFilingSubmissionStatusSortOrder[left.status] -
      payrollYearEndFilingSubmissionStatusSortOrder[right.status]
    );
  }
  if (sortBy === "ackStatus") {
    return (
      payrollYearEndFilingSubmissionAckStatusSortOrder[getYearEndFilingSubmissionAckStatus(left)] -
      payrollYearEndFilingSubmissionAckStatusSortOrder[getYearEndFilingSubmissionAckStatus(right)]
    );
  }
  if (sortBy === "validationStatus") {
    return (
      payrollYearEndFilingSubmissionValidationStatusSortOrder[left.validationStatus] -
      payrollYearEndFilingSubmissionValidationStatusSortOrder[right.validationStatus]
    );
  }
  return (
    payrollYearEndFilingSubmissionTransportSortOrder[left.transport] -
    payrollYearEndFilingSubmissionTransportSortOrder[right.transport]
  );
}

function sortYearEndFilingSubmissions(
  submissions: PayrollYearEndFilingSubmissionSummary[],
  options: {
    sortBy?: PayrollYearEndFilingSubmissionSortBy;
    sortDirection?: PayrollYearEndFilingSubmissionSortDirection;
  }
) {
  const sortBy = options.sortBy ?? "submittedAt";
  const direction = options.sortDirection ?? "desc";
  const directionFactor = direction === "asc" ? 1 : -1;

  return [...submissions].sort((left, right) => {
    const primary =
      compareYearEndFilingSubmissionBySortKey(left, right, sortBy) * directionFactor;
    if (primary !== 0) {
      return primary;
    }
    const submittedAtFallback = right.submittedAt.localeCompare(left.submittedAt);
    if (submittedAtFallback !== 0) {
      return submittedAtFallback;
    }
    return right.submissionId.localeCompare(left.submissionId);
  });
}

function buildYearEndFilingSubmissionListSummary(input: {
  allSubmissions: PayrollYearEndFilingSubmissionSummary[];
  filteredSubmissions: PayrollYearEndFilingSubmissionSummary[];
}): PayrollYearEndFilingSubmissionListSummary {
  const statusCounts: PayrollYearEndFilingSubmissionListSummary["statusCounts"] = {
    submitted: 0,
    acknowledged: 0,
    canceled: 0
  };
  const ackStatusCounts: PayrollYearEndFilingSubmissionListSummary["ackStatusCounts"] = {
    accepted: 0,
    rejected: 0,
    none: 0
  };
  const validationStatusCounts: PayrollYearEndFilingSubmissionListSummary["validationStatusCounts"] =
    {
      pass: 0,
      fail: 0
    };
  const transportCounts: PayrollYearEndFilingSubmissionListSummary["transportCounts"] = {
    manual_portal: 0,
    hometax_upload: 0,
    nts_api_mock: 0
  };

  for (const submission of input.allSubmissions) {
    statusCounts[submission.status] += 1;
    validationStatusCounts[submission.validationStatus] += 1;
    transportCounts[submission.transport] += 1;
    if (!submission.ack) {
      ackStatusCounts.none += 1;
    } else {
      ackStatusCounts[submission.ack.ackStatus] += 1;
    }
  }

  return {
    totalCount: input.allSubmissions.length,
    filteredCount: input.filteredSubmissions.length,
    statusCounts,
    ackStatusCounts,
    validationStatusCounts,
    transportCounts
  };
}

function ensureNoPendingFilingSubmission(submissions: PayrollYearEndFilingSubmissionSummary[]) {
  if (submissions.some((submission) => submission.status === "submitted")) {
    throw new ServiceError(
      409,
      "existing filing submission must be acknowledged before submit/resubmit"
    );
  }
}

function buildYearEndFilingSubmissionId(input: {
  year: number;
  employeeId: string;
  checksumSha256: string;
  attempt: number;
}) {
  return `YFS-${input.year}-${input.employeeId}-${input.checksumSha256.slice(0, 10)}-A${input.attempt}-${Date.now()}`;
}

async function createYearEndFilingSubmission(
  context: ServiceContext,
  input: {
    year: number;
    employeeId: string;
    format: PayrollYearEndFilingExportFormat;
    validationMode: PayrollYearEndFilingValidationMode;
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
    validationMode: input.validationMode
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
  const ackPayload: YearEndFilingPackageAcknowledgedAuditPayload = {
    submissionId: input.submissionId,
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
  const payload: YearEndFilingPackageCanceledAuditPayload = {
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
  const payload: YearEndFilingPackageReopenedAuditPayload = {
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
  const timeline = buildYearEndFilingSubmissionTimeline(logs, input.submissionId);

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
  const undistributedRuns = confirmedRuns.filter((run) => run.payslipDistributedAt === null);
  const pendingReceiptRuns = confirmedRuns.filter(
    (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
  );
  const totalsKrw = aggregatePayrollTotalsKrw(confirmedRuns);

  const blockingReasons: string[] = [];
  if (confirmedRuns.length === 0) {
    blockingReasons.push("no confirmed payroll runs found for selected year");
  }
  if (previewedRuns.length > 0) {
    blockingReasons.push("all payroll runs must be confirmed before withholding receipt issue");
  }
  if (undistributedRuns.length > 0) {
    blockingReasons.push("all confirmed runs must be distributed before withholding receipt issue");
  }
  if (pendingReceiptRuns.length > 0) {
    blockingReasons.push(
      "all distributed runs must have payslip receipt confirmation before withholding receipt issue"
    );
  }

  const canIssue = blockingReasons.length === 0;
  if (input.issue && !canIssue) {
    throw new ServiceError(409, "withholding receipt cannot be issued", {
      blockingReasons,
      runStates: {
        totalRuns: runs.length,
        confirmedRuns: confirmedRuns.length,
        previewedRuns: previewedRuns.length,
        undistributedRuns: undistributedRuns.length,
        pendingReceiptRuns: pendingReceiptRuns.length
      }
    });
  }

  const receiptNumber = `WR-${input.year}-${input.employeeId}`;
  const issuerName = input.issuerName?.trim() ? input.issuerName.trim() : actor.role;
  const issuedAt = input.issue ? new Date().toISOString() : null;
  const payload = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    issue: input.issue,
    canIssue,
    issued: input.issue,
    receiptNumber,
    issuerName,
    issuedAt,
    runStates: {
      totalRuns: runs.length,
      confirmedRuns: confirmedRuns.length,
      previewedRuns: previewedRuns.length,
      undistributedRuns: undistributedRuns.length,
      pendingReceiptRuns: pendingReceiptRuns.length,
      previewedRunIds: previewedRuns.map((run) => run.id),
      undistributedRunIds: undistributedRuns.map((run) => run.id),
      pendingReceiptRunIds: pendingReceiptRuns.map((run) => run.id)
    },
    annualTotalsKrw: totalsKrw,
    blockingReasons
  };

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
