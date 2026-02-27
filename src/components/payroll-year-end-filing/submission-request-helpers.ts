import type {
  PayrollYearEndFilingSubmissionAckStatusFilter,
  PayrollYearEndFilingSubmissionSortBy,
  PayrollYearEndFilingSubmissionSortDirection,
  PayrollYearEndFilingSubmissionStatusFilter,
  PayrollYearEndFilingSubmissionTransportFilter,
  PayrollYearEndFilingSubmissionValidationStatusFilter
} from "@/components/payroll-year-end-filing/types";

type BuildSubmissionListQueryInput = {
  year: number;
  employeeId: string;
  submissionStatusFilter: PayrollYearEndFilingSubmissionStatusFilter;
  submissionAckStatusFilter: PayrollYearEndFilingSubmissionAckStatusFilter;
  submissionValidationStatusFilter: PayrollYearEndFilingSubmissionValidationStatusFilter;
  submissionTransportFilter: PayrollYearEndFilingSubmissionTransportFilter;
  submissionSettlementHashFilter: string;
  submissionSearch: string;
  submissionSortBy: PayrollYearEndFilingSubmissionSortBy;
  submissionSortDirection: PayrollYearEndFilingSubmissionSortDirection;
};

type BuildAcknowledgeSubmissionPayloadInput = {
  year: number;
  employeeId: string;
  expectedSettlementHash: string;
  ackStatus: "accepted" | "rejected";
  ackCode: string | undefined;
  ackNote: string;
  rejectionReasonCode: string;
  rejectionReasonDetail: string;
};

type BuildResubmitSubmissionPayloadInput = {
  year: number;
  employeeId: string;
  format: "json" | "csv" | "jsonl" | "hometax_csv";
  validationMode: "basic" | "strict";
  expectedSettlementHash: string;
  transport: "manual_portal" | "hometax_upload" | "nts_api_mock";
  submissionNote: string;
  resubmissionReason: string;
};

type BuildSubmitFilingPackagePayloadInput = {
  year: number;
  employeeId: string;
  format: "json" | "csv" | "jsonl" | "hometax_csv";
  validationMode: "basic" | "strict";
  expectedSettlementHash: string;
  transport: "manual_portal" | "hometax_upload" | "nts_api_mock";
  submissionNote: string;
};

export function buildFilingSubmissionListQuery(input: BuildSubmissionListQueryInput) {
  const query = new URLSearchParams({
    year: String(input.year),
    employeeId: input.employeeId
  });
  if (input.submissionStatusFilter !== "all") {
    query.set("status", input.submissionStatusFilter);
  }
  if (input.submissionAckStatusFilter !== "all") {
    query.set("ackStatus", input.submissionAckStatusFilter);
  }
  if (input.submissionValidationStatusFilter !== "all") {
    query.set("validationStatus", input.submissionValidationStatusFilter);
  }
  if (input.submissionTransportFilter !== "all") {
    query.set("transport", input.submissionTransportFilter);
  }
  if (input.submissionSettlementHashFilter.trim().length > 0) {
    query.set("settlementHash", input.submissionSettlementHashFilter.trim());
  }
  if (input.submissionSearch.trim().length > 0) {
    query.set("search", input.submissionSearch.trim());
  }
  query.set("sortBy", input.submissionSortBy);
  query.set("sortDirection", input.submissionSortDirection);
  return query;
}

export function buildAcknowledgeSubmissionPayload(input: BuildAcknowledgeSubmissionPayloadInput) {
  return {
    year: input.year,
    employeeId: input.employeeId.trim(),
    expectedSettlementHash: input.expectedSettlementHash.trim() || undefined,
    ackStatus: input.ackStatus,
    ackCode: input.ackCode,
    ackNote: input.ackNote.trim() || undefined,
    rejectionReasonCode: input.ackStatus === "rejected" ? input.rejectionReasonCode.trim() || undefined : undefined,
    rejectionReasonDetail:
      input.ackStatus === "rejected" ? input.rejectionReasonDetail.trim() || undefined : undefined
  };
}

export function buildResubmitSubmissionPayload(input: BuildResubmitSubmissionPayloadInput) {
  return {
    year: input.year,
    employeeId: input.employeeId.trim(),
    format: input.format,
    validationMode: input.validationMode,
    expectedSettlementHash: input.expectedSettlementHash.trim() || undefined,
    transport: input.transport,
    submissionNote: input.submissionNote.trim() || undefined,
    resubmissionReason: input.resubmissionReason.trim() || undefined
  };
}

export function buildSubmitFilingPackagePayload(input: BuildSubmitFilingPackagePayloadInput) {
  return {
    year: input.year,
    employeeId: input.employeeId.trim(),
    format: input.format,
    validationMode: input.validationMode,
    expectedSettlementHash: input.expectedSettlementHash.trim() || undefined,
    transport: input.transport,
    submissionNote: input.submissionNote.trim() || undefined
  };
}
