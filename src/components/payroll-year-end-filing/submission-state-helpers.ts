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
  const parts: string[] = [];

  if (submissionStatusFilter !== "all") {
    parts.push(
      `${copy.statusSummaryLabel} ${
        copy.submissionStatusOptionLabels[submissionStatusFilter] ?? submissionStatusFilter
      }`
    );
  }

  if (submissionAckStatusFilter !== "all") {
    parts.push(
      `${copy.ackStatusSummaryLabel} ${
        copy.ackStatusOptionLabels[submissionAckStatusFilter] ?? submissionAckStatusFilter
      }`
    );
  }

  if (submissionValidationStatusFilter !== "all") {
    parts.push(
      `${copy.validationSummaryLabel} ${
        copy.validationStatusOptionLabels[submissionValidationStatusFilter] ??
        submissionValidationStatusFilter
      }`
    );
  }

  if (submissionTransportFilter !== "all") {
    parts.push(
      `${copy.transportSummaryLabel} ${
        copy.submissionTransportOptionLabels[submissionTransportFilter] ?? submissionTransportFilter
      }`
    );
  }

  const settlementHash = submissionSettlementHashFilter.trim();
  if (settlementHash.length > 0) {
    parts.push(`${copy.compactMatchLabel} ${settlementHash}`);
  }

  const search = submissionSearch.trim();
  if (search.length > 0) {
    parts.push(`${copy.compactSearchLabel} ${search}`);
  }

  const usesDefaultSort = submissionSortBy === "submittedAt" && submissionSortDirection === "desc";
  if (!usesDefaultSort) {
    parts.push(
      `${copy.compactSortLabel} ${
        copy.submissionSortByOptionLabels[submissionSortBy] ?? submissionSortBy
      } ${copy.submissionSortDirectionOptionLabels[submissionSortDirection] ?? submissionSortDirection}`
    );
  }

  return parts.length > 0 ? parts.join(" · ") : copy.defaultSubmissionFiltersSummary;
}
