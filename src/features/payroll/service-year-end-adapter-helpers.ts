import { ServiceError } from "@/features/shared/service-error";
import type { PayrollRunEntity } from "@/features/shared/data-access";
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
import { buildYearEndFilingSubmissionSummaries as buildYearEndFilingSubmissionSummariesCore } from "@/features/payroll/year-end-filing-lifecycle-helpers";
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
  toKrwInteger,
  toRateNumber,
  toSeoulDateTimeParts
} from "@/features/payroll/service-runtime-helpers";
import type {
  ListPayrollYearEndFilingSubmissionsInput,
  PayrollYearEndFilingAckStatus,
  PayrollYearEndFilingExportFormat,
  PayrollYearEndFilingSubmissionSortBy,
  PayrollYearEndFilingSubmissionSortDirection,
  PayrollYearEndWithholdingReceiptDocumentFormat,
  PreviewPayrollYearEndSettlementInput,
  YearEndDeductionEligibilityInput,
  YearEndDeductionItemsInput,
  YearEndTaxCreditItemsInput
} from "@/features/payroll/service-input-types";
import type {
  FinalizePayrollYearEndSettlementResult,
  ListPayrollYearEndFilingAckCatalogResult,
  PayrollTotalsKrw,
  PayrollYearEndFilingSubmissionListSummary,
  PayrollYearEndFilingSubmissionSummary,
  PayrollYearEndWithholdingReceiptSummary,
  YearEndDeductionSummaryKrw,
  YearEndFilingGuardRunStates,
  YearEndFilingRecord,
  YearEndSettlementKrw
} from "@/features/payroll/service-output-types";
import type { YearEndRunSnapshot } from "@/features/payroll/service-year-end-run-snapshot-helpers";
import type { ServiceContext } from "@/features/payroll/service-context-helpers";

export type YearEndFilingGuard = {
  undistributedRuns: PayrollRunEntity[];
  pendingReceiptRuns: PayrollRunEntity[];
  runStates: YearEndFilingGuardRunStates;
  blockingReasons: string[];
  canFinalize: boolean;
};

export type YearEndFinalizationAuditPayload = FinalizePayrollYearEndSettlementResult["settlement"];

export function buildPayrollYearEndFilingAckCatalog(): ListPayrollYearEndFilingAckCatalogResult {
  return buildPayrollYearEndFilingAckCatalogCore() as ListPayrollYearEndFilingAckCatalogResult;
}

export function resolvePayrollYearEndFilingAckPayload(input: {
  ackStatus: PayrollYearEndFilingAckStatus;
  ackCode?: string;
  ackNote?: string;
  rejectionReasonCode?: string;
  rejectionReasonDetail?: string;
}) {
  return resolvePayrollYearEndFilingAckPayloadCore(input);
}

export function normalizeYearEndDeductionItems(
  deductionItems: YearEndDeductionItemsInput
): YearEndDeductionItemsInput {
  return normalizeYearEndDeductionItemsCore(deductionItems, toKrwInteger);
}

export function normalizeYearEndDeductionEligibility(
  deductionEligibility?: Partial<YearEndDeductionEligibilityInput>
): YearEndDeductionEligibilityInput {
  return normalizeYearEndDeductionEligibilityCore(deductionEligibility);
}

export function collectYearEndDeductionEligibilityBlockingReasons(
  deductionItems: YearEndDeductionItemsInput,
  deductionEligibility: YearEndDeductionEligibilityInput
) {
  return collectYearEndDeductionEligibilityBlockingReasonsCore(deductionItems, deductionEligibility);
}

export function normalizeYearEndTaxCreditItems(
  input: PreviewPayrollYearEndSettlementInput
): YearEndTaxCreditItemsInput {
  return normalizeYearEndTaxCreditItemsCore(input, toKrwInteger);
}

export function buildYearEndInputVectorHash(input: {
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

export function applyYearEndDeductionCaps(deductionItems: YearEndDeductionItemsInput) {
  return applyYearEndDeductionCapsCore(deductionItems, toKrwInteger);
}

export function calculateYearEndSettlementKrw(
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

export function buildYearEndFilingGuard(snapshot: YearEndRunSnapshot): YearEndFilingGuard {
  return buildYearEndFilingGuardCore(snapshot) as YearEndFilingGuard;
}

export function buildYearEndInsuranceReconciliationMonthlyBreakdown(runs: PayrollRunEntity[]) {
  return buildYearEndInsuranceReconciliationMonthlyBreakdownCore(runs, (periodStart) => {
    const monthParts = toSeoulDateTimeParts(periodStart);
    return `${monthParts.year}-${String(monthParts.month).padStart(2, "0")}`;
  });
}

export function buildYearEndSettlementHash(payload: {
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

export function normalizeYearEndSettlementHash(value: unknown): string | null {
  return normalizeYearEndSettlementHashCore(value);
}

export function resolveYearEndSettlementHashFromFinalizationPayload(
  payload: YearEndFinalizationAuditPayload
): string {
  return resolveYearEndSettlementHashFromFinalizationPayloadCore(payload);
}

export function asYearEndFinalizationAuditPayload(
  payload: unknown
): YearEndFinalizationAuditPayload | null {
  return asYearEndFinalizationAuditPayloadCore(payload) as YearEndFinalizationAuditPayload | null;
}

export function asYearEndWithholdingReceiptSummaryPayload(
  payload: unknown
): PayrollYearEndWithholdingReceiptSummary | null {
  return asYearEndWithholdingReceiptSummaryPayloadCore(payload) as PayrollYearEndWithholdingReceiptSummary | null;
}

export function buildYearEndWithholdingReceiptDocumentArtifact(
  receipt: PayrollYearEndWithholdingReceiptSummary,
  format: PayrollYearEndWithholdingReceiptDocumentFormat
) {
  return buildYearEndWithholdingReceiptDocumentArtifactCore(receipt, format);
}

export function buildYearEndFilingRecords(runs: PayrollRunEntity[]): YearEndFilingRecord[] {
  return buildYearEndFilingRecordsCore(runs);
}

export function buildYearEndFilingArtifact(
  format: PayrollYearEndFilingExportFormat,
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayload
) {
  return buildYearEndFilingArtifactCore(format, rows, payload);
}

export function validateYearEndFilingRecords(
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayload
) {
  return validateYearEndFilingRecordsCore(rows, payload);
}

export function matchesYearEndFilingSubmissionFilters(
  submission: PayrollYearEndFilingSubmissionSummary,
  filters: ListPayrollYearEndFilingSubmissionsInput
) {
  return matchesYearEndFilingSubmissionFiltersCore(submission, filters);
}

export function sortYearEndFilingSubmissions(
  submissions: PayrollYearEndFilingSubmissionSummary[],
  options: {
    sortBy?: PayrollYearEndFilingSubmissionSortBy;
    sortDirection?: PayrollYearEndFilingSubmissionSortDirection;
  }
) {
  return sortYearEndFilingSubmissionsCore(submissions, options);
}

export function buildYearEndFilingSubmissionListSummary(input: {
  allSubmissions: PayrollYearEndFilingSubmissionSummary[];
  filteredSubmissions: PayrollYearEndFilingSubmissionSummary[];
}): PayrollYearEndFilingSubmissionListSummary {
  return buildYearEndFilingSubmissionListSummaryCore(input);
}

export async function listYearEndFilingLifecycleLogs(
  context: ServiceContext,
  input: {
    year: number;
    employeeId: string;
  }
) {
  return listYearEndFilingLifecycleLogsCore(context.dataAccess.audit, input);
}

export async function listYearEndFilingSubmissionSummaries(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionsInput
) {
  const logs = await listYearEndFilingLifecycleLogs(context, input);
  return buildYearEndFilingSubmissionSummariesCore(logs) as PayrollYearEndFilingSubmissionSummary[];
}

export function ensureNoPendingFilingSubmission(submissions: PayrollYearEndFilingSubmissionSummary[]) {
  ensureNoPendingFilingSubmissionCore(submissions);
}

export function buildYearEndFilingSubmissionId(input: {
  year: number;
  employeeId: string;
  checksumSha256: string;
  attempt: number;
}) {
  return buildYearEndFilingSubmissionIdCore(input);
}
