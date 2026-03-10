import type { payrollYearEndFilingCopyByLocale } from "@/components/payroll-year-end-filing/copy";
import type {
  PayrollYearEndFilingSubmission,
  PayrollYearEndFilingSubmissionAckStatusFilter,
  PayrollYearEndFilingSubmissionSortBy,
  PayrollYearEndFilingSubmissionSortDirection,
  PayrollYearEndFilingSubmissionStatusFilter,
  PayrollYearEndFilingSubmissionTransportFilter,
  PayrollYearEndFilingSubmissionValidationStatusFilter
} from "@/components/payroll-year-end-filing/types";

type FilingCopy = (typeof payrollYearEndFilingCopyByLocale)["en"];

type BuildActiveSubmissionFiltersSummaryInput = {
  copy: FilingCopy;
  submissionStatusFilter: PayrollYearEndFilingSubmissionStatusFilter;
  submissionAckStatusFilter: PayrollYearEndFilingSubmissionAckStatusFilter;
  submissionValidationStatusFilter: PayrollYearEndFilingSubmissionValidationStatusFilter;
  submissionTransportFilter: PayrollYearEndFilingSubmissionTransportFilter;
  submissionSettlementHashFilter: string;
  submissionSearch: string;
  submissionSortBy: PayrollYearEndFilingSubmissionSortBy;
  submissionSortDirection: PayrollYearEndFilingSubmissionSortDirection;
};

export function upsertSubmissionAtTop(
  previous: PayrollYearEndFilingSubmission[],
  submission: PayrollYearEndFilingSubmission
) {
  return [submission, ...previous.filter((item) => item.submissionId !== submission.submissionId)];
}

export function replaceSubmissionById(
  previous: PayrollYearEndFilingSubmission[],
  submission: PayrollYearEndFilingSubmission
) {
  return previous.map((item) => (item.submissionId === submission.submissionId ? submission : item));
}

export function buildActiveSubmissionFiltersSummary(input: BuildActiveSubmissionFiltersSummaryInput) {
  const {
    copy,
    submissionStatusFilter,
    submissionAckStatusFilter,
    submissionValidationStatusFilter,
    submissionTransportFilter,
    submissionSettlementHashFilter,
    submissionSearch,
    submissionSortBy,
    submissionSortDirection
  } = input;
  return [
    `${copy.submissionStatusFilterLabel}: ${copy.submissionStatusOptionLabels[submissionStatusFilter] ?? submissionStatusFilter}`,
    `${copy.ackStatusFilterLabel}: ${copy.ackStatusOptionLabels[submissionAckStatusFilter] ?? submissionAckStatusFilter}`,
    `${copy.validationStatusFilterLabel}: ${copy.validationStatusOptionLabels[submissionValidationStatusFilter] ?? submissionValidationStatusFilter}`,
    `${copy.transportFilterLabel}: ${copy.submissionTransportOptionLabels[submissionTransportFilter] ?? submissionTransportFilter}`,
    `${copy.settlementHashFilterLabel}: ${submissionSettlementHashFilter.trim() || copy.dashLabel}`,
    `${copy.submissionSearchLabel}: ${submissionSearch.trim() || copy.dashLabel}`,
    `${copy.submissionSortByLabel}: ${copy.submissionSortByOptionLabels[submissionSortBy] ?? submissionSortBy} / ${copy.submissionSortDirectionOptionLabels[submissionSortDirection] ?? submissionSortDirection}`
  ].join(", ");
}
