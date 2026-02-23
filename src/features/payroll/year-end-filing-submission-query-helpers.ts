type PayrollYearEndFilingSubmissionStatus = "submitted" | "acknowledged" | "canceled";
type PayrollYearEndFilingAckStatus = "accepted" | "rejected";
type PayrollYearEndFilingTransport = "manual_portal" | "hometax_upload" | "nts_api_mock";
type PayrollYearEndFilingSubmissionSortBy =
  | "submittedAt"
  | "attempt"
  | "status"
  | "ackStatus"
  | "validationStatus"
  | "transport";
type PayrollYearEndFilingSubmissionSortDirection = "asc" | "desc";

type PayrollYearEndFilingSubmissionSummaryLike = {
  submissionId: string;
  attempt: number;
  submittedAt: string;
  status: PayrollYearEndFilingSubmissionStatus;
  transport: PayrollYearEndFilingTransport;
  validationMode: string;
  validationStatus: "pass" | "fail";
  resubmissionOfSubmissionId?: string | null;
  resubmissionReason?: string | null;
  submissionNote?: string | null;
  settlementHash?: string | null;
  ack?: {
    ackStatus: PayrollYearEndFilingAckStatus;
    ackCode?: string | null;
    ackNote?: string | null;
    rejectionReasonCode?: string | null;
    rejectionReasonDetail?: string | null;
  } | null;
};

type ListPayrollYearEndFilingSubmissionsInputLike = {
  status?: PayrollYearEndFilingSubmissionStatus | "all";
  ackStatus?: PayrollYearEndFilingAckStatus | "none" | "all";
  validationStatus?: "pass" | "fail" | "all";
  transport?: PayrollYearEndFilingTransport | "all";
  settlementHash?: string;
  search?: string;
  sortBy?: PayrollYearEndFilingSubmissionSortBy;
  sortDirection?: PayrollYearEndFilingSubmissionSortDirection;
};

type PayrollYearEndFilingSubmissionListSummaryLike = {
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

function getYearEndFilingSubmissionAckStatus(
  submission: PayrollYearEndFilingSubmissionSummaryLike
): PayrollYearEndFilingAckStatus | "none" {
  return submission.ack?.ackStatus ?? "none";
}

export function normalizeYearEndFilingSubmissionSearch(search: string | undefined) {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return normalized;
}

export function normalizeYearEndFilingSubmissionSettlementHashFilter(
  settlementHash: string | undefined
) {
  const normalized = settlementHash?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (!/^[a-f0-9]{8,64}$/.test(normalized)) {
    return null;
  }
  return normalized;
}

export function matchesYearEndFilingSubmissionSearch<T extends PayrollYearEndFilingSubmissionSummaryLike>(
  submission: T,
  normalizedSearch: string
) {
  const searchTokens = [
    submission.submissionId,
    submission.resubmissionOfSubmissionId,
    submission.resubmissionReason,
    submission.submissionNote,
    submission.settlementHash,
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

export function matchesYearEndFilingSubmissionFilters<T extends PayrollYearEndFilingSubmissionSummaryLike>(
  submission: T,
  filters: ListPayrollYearEndFilingSubmissionsInputLike
) {
  if (filters.status && filters.status !== "all" && submission.status !== filters.status) {
    return false;
  }
  if (filters.ackStatus && filters.ackStatus !== "all") {
    if (filters.ackStatus === "none") {
      if (submission.ack !== null && submission.ack !== undefined) {
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
  const normalizedSettlementHash = normalizeYearEndFilingSubmissionSettlementHashFilter(
    filters.settlementHash
  );
  if (
    normalizedSettlementHash &&
    !(submission.settlementHash ?? "").toLowerCase().startsWith(normalizedSettlementHash)
  ) {
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
  left: PayrollYearEndFilingSubmissionSummaryLike,
  right: PayrollYearEndFilingSubmissionSummaryLike,
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

export function sortYearEndFilingSubmissions<T extends PayrollYearEndFilingSubmissionSummaryLike>(
  submissions: T[],
  options: {
    sortBy?: PayrollYearEndFilingSubmissionSortBy;
    sortDirection?: PayrollYearEndFilingSubmissionSortDirection;
  }
) {
  const sortBy = options.sortBy ?? "submittedAt";
  const direction = options.sortDirection ?? "desc";
  const directionFactor = direction === "asc" ? 1 : -1;

  return [...submissions].sort((left, right) => {
    const primary = compareYearEndFilingSubmissionBySortKey(left, right, sortBy) * directionFactor;
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

export function buildYearEndFilingSubmissionListSummary<T extends PayrollYearEndFilingSubmissionSummaryLike>(input: {
  allSubmissions: T[];
  filteredSubmissions: T[];
}): PayrollYearEndFilingSubmissionListSummaryLike {
  const statusCounts: PayrollYearEndFilingSubmissionListSummaryLike["statusCounts"] = {
    submitted: 0,
    acknowledged: 0,
    canceled: 0
  };
  const ackStatusCounts: PayrollYearEndFilingSubmissionListSummaryLike["ackStatusCounts"] = {
    accepted: 0,
    rejected: 0,
    none: 0
  };
  const validationStatusCounts: PayrollYearEndFilingSubmissionListSummaryLike["validationStatusCounts"] =
    {
      pass: 0,
      fail: 0
    };
  const transportCounts: PayrollYearEndFilingSubmissionListSummaryLike["transportCounts"] = {
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
