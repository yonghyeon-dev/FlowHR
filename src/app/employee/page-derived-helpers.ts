import {
  shiftDays,
  startOfLocalDay,
  toLocalDateKey,
  toTimestamp
} from "@/app/employee/page-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  IntegratedSummaryCard,
  LeaveBalanceDto,
  LeaveCalendarDayCell,
  LeaveRequestDto,
  ResubmitCandidate
} from "@/app/employee/page-types";

type LeaveBalanceCopyLike = {
  cardLabels: {
    remaining: string;
    granted: string;
    used: string;
    carryOver: string;
  };
  dayUnit: (value: string) => string;
  projectionPending: string;
  projectedRemaining: (value: string) => string;
  projectedShortage: (value: string) => string;
};

type LeaveUnitCopyLike = {
  hourUnit: (value: string) => string;
  halfDay: string;
  dayUnit: (value: string) => string;
};

type SummaryCardCopyLike = {
  pendingRequestsLabel: string;
  pendingRequestsDetail: (attendancePending: number, leavePending: number) => string;
  completionRateLabel: string;
  completionRateDetail: (approvedCount: number, needsActionCount: number) => string;
  resubmitNeededLabel: string;
  resubmitNeededDetail: (count: number) => string;
  noResubmitNeededDetail: string;
  apiFailuresLabel: string;
  apiFailuresDetail: (successCount: number, failCount: number) => string;
};

export type RequestStatusSummary = {
  pending: number;
  approved: number;
  rejected: number;
  canceled?: number;
};

export function summarizeEmployeeApiLogs(logs: ApiLog[]) {
  const total = logs.length;
  const success = logs.filter((log) => log.ok).length;
  const fail = total - success;
  const successRate = total === 0 ? 0 : Math.round((success / total) * 100);
  return { total, success, fail, successRate };
}

export function buildLeaveBalanceCards(
  leaveBalance: LeaveBalanceDto | null,
  leaveBalanceCopy: LeaveBalanceCopyLike,
  formatDays: (value: number) => string
) {
  if (!leaveBalance) {
    return [];
  }
  return [
    {
      key: "remaining",
      label: leaveBalanceCopy.cardLabels.remaining,
      value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.remainingDays)),
      tone: "remaining"
    },
    {
      key: "granted",
      label: leaveBalanceCopy.cardLabels.granted,
      value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.grantedDays)),
      tone: "granted"
    },
    {
      key: "used",
      label: leaveBalanceCopy.cardLabels.used,
      value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.usedDays)),
      tone: "used"
    },
    {
      key: "carry-over",
      label: leaveBalanceCopy.cardLabels.carryOver,
      value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.carryOverDays)),
      tone: "carry-over"
    }
  ];
}

export function buildLeaveUsageProjectionLabel(
  leaveBalance: LeaveBalanceDto | null,
  leaveBalanceCopy: LeaveBalanceCopyLike,
  formatDays: (value: number) => string
) {
  if (!leaveBalance || leaveBalance.grantedDays <= 0) {
    return leaveBalanceCopy.projectionPending;
  }

  const elapsedMonths = Math.max(1, new Date().getMonth() + 1);
  const averageUsedPerMonth = leaveBalance.usedDays / elapsedMonths;
  const projectedYearEndUsed = averageUsedPerMonth * 12;
  const projectedRemaining = leaveBalance.grantedDays - projectedYearEndUsed;
  if (projectedRemaining >= 0) {
    return leaveBalanceCopy.projectedRemaining(formatDays(projectedRemaining));
  }
  return leaveBalanceCopy.projectedShortage(formatDays(Math.abs(projectedRemaining)));
}

export function buildLeaveCalendarCells(
  leaveRequests: LeaveRequestDto[],
  periodStart: string
): LeaveCalendarDayCell[] {
  const parsedPeriodStart = new Date(periodStart);
  const anchor = Number.isNaN(parsedPeriodStart.getTime()) ? new Date() : parsedPeriodStart;
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 0, 0, 0);
  const gridStart = shiftDays(startOfLocalDay(monthStart), -monthStart.getDay());
  const gridEnd = shiftDays(startOfLocalDay(monthEnd), 6 - monthEnd.getDay());

  const requestByDate = new Map<string, LeaveRequestDto[]>();
  for (const request of leaveRequests) {
    const parsedStartDate = new Date(request.startDate);
    const parsedEndDate = new Date(request.endDate);
    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      continue;
    }

    let cursor = startOfLocalDay(parsedStartDate);
    const requestEnd = startOfLocalDay(parsedEndDate);
    while (cursor.getTime() <= requestEnd.getTime()) {
      const dateKey = toLocalDateKey(cursor);
      const bucket = requestByDate.get(dateKey);
      if (bucket) {
        bucket.push(request);
      } else {
        requestByDate.set(dateKey, [request]);
      }
      cursor = shiftDays(cursor, 1);
    }
  }

  const todayKey = toLocalDateKey(new Date());
  const cells: LeaveCalendarDayCell[] = [];
  for (let cursor = new Date(gridStart); cursor.getTime() <= gridEnd.getTime(); cursor = shiftDays(cursor, 1)) {
    const dateKey = toLocalDateKey(cursor);
    const requestBucket = requestByDate.get(dateKey) ?? [];
    const requestCount = requestBucket.length;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    for (const request of requestBucket) {
      if (request.state === "APPROVED") {
        approvedCount += 1;
      } else if (request.state === "PENDING") {
        pendingCount += 1;
      } else {
        rejectedCount += 1;
      }
    }

    let tone: LeaveCalendarDayCell["tone"] = "none";
    if (requestCount > 0) {
      if (approvedCount === requestCount) {
        tone = "approved";
      } else if (pendingCount === requestCount) {
        tone = "pending";
      } else if (rejectedCount === requestCount) {
        tone = "rejected";
      } else {
        tone = "mixed";
      }
    }

    const density: LeaveCalendarDayCell["density"] =
      requestCount >= 3 ? "high" : requestCount === 2 ? "mid" : requestCount === 1 ? "low" : "none";

    cells.push({
      dateKey,
      dayOfMonth: cursor.getDate(),
      inCurrentMonth: cursor.getMonth() === monthStart.getMonth(),
      isToday: dateKey === todayKey,
      requestCount,
      approvedCount,
      pendingCount,
      rejectedCount,
      density,
      tone
    });
  }

  return cells;
}

type BuildLeaveCalendarRowsArgs = {
  leaveRequests: LeaveRequestDto[];
  toLeaveTypeLabel: (leaveType: string) => string;
  leaveUnitCopy: LeaveUnitCopyLike;
  formatDays: (value: number) => string;
  formatDateTime: (value: string | null) => string;
};

export function buildLeaveCalendarRows({
  leaveRequests,
  toLeaveTypeLabel,
  leaveUnitCopy,
  formatDays,
  formatDateTime
}: BuildLeaveCalendarRowsArgs) {
  return [...leaveRequests]
    .sort((lhs, rhs) => new Date(lhs.startDate).getTime() - new Date(rhs.startDate).getTime())
    .map((request) => ({
      id: request.id,
      dateRange: `${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`,
      status: request.state,
      label:
        request.unit === "HOUR" && request.hours !== null
          ? `${toLeaveTypeLabel(request.leaveType)} / ${leaveUnitCopy.hourUnit(request.hours.toFixed(2))}`
          : request.unit === "HALF_DAY"
            ? `${toLeaveTypeLabel(request.leaveType)} / ${leaveUnitCopy.halfDay}`
            : `${toLeaveTypeLabel(request.leaveType)} / ${leaveUnitCopy.dayUnit(formatDays(request.days))}`
    }));
}

export function buildAttendanceStatusSummary(attendance: AttendanceRecordDto[]): RequestStatusSummary {
  return {
    pending: attendance.filter((record) => record.state === "PENDING").length,
    approved: attendance.filter((record) => record.state === "APPROVED").length,
    rejected: attendance.filter((record) => record.state === "REJECTED").length
  };
}

export function buildLeaveStatusSummary(leaveRequests: LeaveRequestDto[]): RequestStatusSummary {
  return {
    pending: leaveRequests.filter((request) => request.state === "PENDING").length,
    approved: leaveRequests.filter((request) => request.state === "APPROVED").length,
    rejected: leaveRequests.filter((request) => request.state === "REJECTED").length,
    canceled: leaveRequests.filter((request) => request.state === "CANCELED").length
  };
}

type BuildResubmitCandidatesArgs = {
  attendance: AttendanceRecordDto[];
  leaveRequests: LeaveRequestDto[];
  noReasonProvidedLabel: string;
  formatDateTime: (value: string | null) => string;
  toLeaveTypeLabel: (leaveType: string) => string;
};

export function buildResubmitCandidates({
  attendance,
  leaveRequests,
  noReasonProvidedLabel,
  formatDateTime,
  toLeaveTypeLabel
}: BuildResubmitCandidatesArgs): ResubmitCandidate[] {
  const attendanceCandidates = attendance
    .filter((record) => record.state === "REJECTED")
    .map((record) => ({
      key: `attendance:${record.id}`,
      channel: "attendance" as const,
      recordId: record.id,
      status: "REJECTED" as const,
      at: record.checkOutAt ?? record.checkInAt,
      reason: record.notes?.trim() || noReasonProvidedLabel,
      summary: `${formatDateTime(record.checkInAt)} ~ ${formatDateTime(record.checkOutAt)}`
    }));

  const leaveCandidates = leaveRequests
    .filter((request) => request.state === "REJECTED" || request.state === "CANCELED")
    .map((request) => ({
      key: `leave:${request.id}`,
      channel: "leave" as const,
      recordId: request.id,
      status: request.state as "REJECTED" | "CANCELED",
      at: request.endDate,
      reason:
        request.decisionReason?.trim() || request.reason?.trim() || noReasonProvidedLabel,
      summary: `${toLeaveTypeLabel(request.leaveType)} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`
    }));

  return [...attendanceCandidates, ...leaveCandidates]
    .sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))
    .slice(0, 12);
}

type BuildIntegratedSummaryCardsArgs = {
  attendanceStatusSummary: RequestStatusSummary;
  leaveStatusSummary: RequestStatusSummary;
  requestCompletionRatePercent: number;
  resubmitNeededCount: number;
  successCount: number;
  failCount: number;
  summaryCardCopy: SummaryCardCopyLike;
};

type BuildRequestFlowStatsInput = {
  attendanceStatusSummary: RequestStatusSummary;
  leaveStatusSummary: RequestStatusSummary;
};

export function buildRequestFlowStats({
  attendanceStatusSummary,
  leaveStatusSummary
}: BuildRequestFlowStatsInput) {
  const totalPendingRequestCount = attendanceStatusSummary.pending + leaveStatusSummary.pending;
  const totalApprovedRequestCount = attendanceStatusSummary.approved + leaveStatusSummary.approved;
  const totalRejectedOrCanceledRequestCount =
    attendanceStatusSummary.rejected +
    leaveStatusSummary.rejected +
    (leaveStatusSummary.canceled ?? 0);
  const totalHandled = totalApprovedRequestCount + totalRejectedOrCanceledRequestCount;
  const total = totalHandled + totalPendingRequestCount;
  const requestCompletionRatePercent =
    total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((totalHandled / total) * 100)));

  return {
    totalPendingRequestCount,
    totalApprovedRequestCount,
    totalRejectedOrCanceledRequestCount,
    requestCompletionRatePercent
  };
}

export function resolveSelectedResubmitCandidate(
  resubmitCandidates: ResubmitCandidate[],
  selectedResubmitCandidateKey: string
) {
  if (resubmitCandidates.length === 0) {
    return null;
  }
  const explicit = selectedResubmitCandidateKey.trim();
  if (explicit.length === 0) {
    return resubmitCandidates[0];
  }
  return resubmitCandidates.find((candidate) => candidate.key === explicit) ?? resubmitCandidates[0];
}

export function buildIntegratedSummaryCards({
  attendanceStatusSummary,
  leaveStatusSummary,
  requestCompletionRatePercent,
  resubmitNeededCount,
  successCount,
  failCount,
  summaryCardCopy
}: BuildIntegratedSummaryCardsArgs): IntegratedSummaryCard[] {
  const totalPendingRequestCount = attendanceStatusSummary.pending + leaveStatusSummary.pending;
  const totalApprovedRequestCount = attendanceStatusSummary.approved + leaveStatusSummary.approved;
  const totalRejectedOrCanceledRequestCount =
    attendanceStatusSummary.rejected +
    leaveStatusSummary.rejected +
    (leaveStatusSummary.canceled ?? 0);

  return [
    {
      key: "pending",
      label: summaryCardCopy.pendingRequestsLabel,
      value: `${totalPendingRequestCount}`,
      detail: summaryCardCopy.pendingRequestsDetail(
        attendanceStatusSummary.pending,
        leaveStatusSummary.pending
      ),
      tone: totalPendingRequestCount > 0 ? "pending" : "ok"
    },
    {
      key: "completion",
      label: summaryCardCopy.completionRateLabel,
      value: `${requestCompletionRatePercent}%`,
      detail: summaryCardCopy.completionRateDetail(
        totalApprovedRequestCount,
        totalRejectedOrCanceledRequestCount
      ),
      tone: requestCompletionRatePercent >= 70 ? "ok" : requestCompletionRatePercent >= 40 ? "pending" : "fail"
    },
    {
      key: "resubmit",
      label: summaryCardCopy.resubmitNeededLabel,
      value: `${resubmitNeededCount}`,
      detail:
        resubmitNeededCount > 0
          ? summaryCardCopy.resubmitNeededDetail(resubmitNeededCount)
          : summaryCardCopy.noResubmitNeededDetail,
      tone: resubmitNeededCount > 0 ? "fail" : "ok"
    },
    {
      key: "api-failures",
      label: summaryCardCopy.apiFailuresLabel,
      value: `${failCount}`,
      detail: summaryCardCopy.apiFailuresDetail(successCount, failCount),
      tone: failCount > 0 ? "fail" : "info"
    }
  ];
}
