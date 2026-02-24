import { toTimestamp } from "@/app/employee/page-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  LeaveRequestDto,
  MobileRequestTimelineItem,
  RequestFailureCause,
  RequestFeedbackRow,
  RequestStatusFilter,
  RequestSearchRow,
  TimelineChannelFilter
} from "@/app/employee/page-types";

type RequestFeedbackCopyLike = {
  rejectionReasonPrefix: string;
  cancelReasonPrefix: string;
  pendingMessage: string;
  successMessage: string;
};

type RequestDefaultsCopyLike = {
  noReasonProvided: string;
  noNote: string;
  noReason: string;
  attendanceRequestTitle: string;
  leaveRequestTitle: string;
  attendanceRejectedSource: string;
  leaveRejectedSource: string;
  leaveCanceledSource: string;
  rejectionReasonMissing: string;
  reasonMissing: string;
};

type LeaveUnitCopyLike = {
  halfDay: string;
  dayUnit: (value: string) => string;
  hourUnit: (value: string) => string;
};

type BuildRequestFeedbackRowsInput = {
  latestAttendance: AttendanceRecordDto | null;
  latestLeaveRequest: LeaveRequestDto | null;
  defaultsCopy: Pick<RequestDefaultsCopyLike, "noReasonProvided">;
  requestFeedbackCopy: RequestFeedbackCopyLike;
};

export function buildRequestFeedbackRows({
  latestAttendance,
  latestLeaveRequest,
  defaultsCopy,
  requestFeedbackCopy
}: BuildRequestFeedbackRowsInput): RequestFeedbackRow[] {
  const rows: RequestFeedbackRow[] = [];

  if (latestAttendance) {
    rows.push({
      id: `attendance-${latestAttendance.id}`,
      channel: "attendance",
      status: latestAttendance.state,
      at: latestAttendance.checkOutAt ?? latestAttendance.checkInAt,
      message:
        latestAttendance.state === "REJECTED"
          ? `${requestFeedbackCopy.rejectionReasonPrefix}: ${latestAttendance.notes?.trim() || defaultsCopy.noReasonProvided}`
          : latestAttendance.state === "PENDING"
            ? requestFeedbackCopy.pendingMessage
            : requestFeedbackCopy.successMessage,
      tone:
        latestAttendance.state === "APPROVED"
          ? "ok"
          : latestAttendance.state === "PENDING"
            ? "pending"
            : "fail"
    });
  }

  if (latestLeaveRequest) {
    const rejectReason =
      latestLeaveRequest.decisionReason?.trim() ||
      latestLeaveRequest.reason?.trim() ||
      defaultsCopy.noReasonProvided;
    rows.push({
      id: `leave-${latestLeaveRequest.id}`,
      channel: "leave",
      status: latestLeaveRequest.state,
      at: latestLeaveRequest.endDate,
      message:
        latestLeaveRequest.state === "REJECTED"
          ? `${requestFeedbackCopy.rejectionReasonPrefix}: ${rejectReason}`
          : latestLeaveRequest.state === "CANCELED"
            ? `${requestFeedbackCopy.cancelReasonPrefix}: ${rejectReason}`
            : latestLeaveRequest.state === "PENDING"
              ? requestFeedbackCopy.pendingMessage
              : requestFeedbackCopy.successMessage,
      tone:
        latestLeaveRequest.state === "APPROVED"
          ? "ok"
          : latestLeaveRequest.state === "PENDING"
            ? "pending"
            : "fail"
    });
  }

  return rows.sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at));
}

type BuildRequestSearchRowsInput = {
  attendance: AttendanceRecordDto[];
  leaveRequests: LeaveRequestDto[];
  requestNowMs: number;
  defaultsCopy: Pick<RequestDefaultsCopyLike, "noNote" | "noReason">;
  leaveUnitCopy: LeaveUnitCopyLike;
  formatDays: (value: number) => string;
  toLeaveTypeLabel: (leaveType: LeaveRequestDto["leaveType"]) => string;
  formatDateTime: (value: string | null) => string;
};

export function buildRequestSearchRows({
  attendance,
  leaveRequests,
  requestNowMs,
  defaultsCopy,
  leaveUnitCopy,
  formatDays,
  toLeaveTypeLabel,
  formatDateTime
}: BuildRequestSearchRowsInput): RequestSearchRow[] {
  const attendanceRows = attendance.map((record) => {
    const at = record.checkOutAt ?? record.checkInAt;
    const pendingHours =
      record.state === "PENDING" ? Math.max(0, (requestNowMs - toTimestamp(at)) / 3_600_000) : 0;
    return {
      key: `attendance:${record.id}`,
      channel: "attendance" as const,
      requestId: record.id,
      status: record.state,
      at,
      summary: `${formatDateTime(record.checkInAt)} ~ ${formatDateTime(record.checkOutAt)}`,
      detail: record.notes?.trim() || defaultsCopy.noNote,
      pendingHours
    };
  });

  const leaveRows = leaveRequests.map((request) => {
    const at = request.startDate;
    const pendingHours =
      request.state === "PENDING" ? Math.max(0, (requestNowMs - toTimestamp(at)) / 3_600_000) : 0;
    const leaveUnitLabel =
      request.unit === "HOUR" && request.hours !== null
        ? leaveUnitCopy.hourUnit(request.hours.toFixed(2))
        : request.unit === "HALF_DAY"
          ? leaveUnitCopy.halfDay
          : leaveUnitCopy.dayUnit(formatDays(request.days));
    return {
      key: `leave:${request.id}`,
      channel: "leave" as const,
      requestId: request.id,
      status: request.state,
      at,
      summary: `${toLeaveTypeLabel(request.leaveType)} / ${leaveUnitLabel} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`,
      detail: request.reason?.trim() || request.decisionReason?.trim() || defaultsCopy.noReason,
      pendingHours
    };
  });

  return [...attendanceRows, ...leaveRows].sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at));
}

export function filterRequestFeedbackRows(
  rows: RequestFeedbackRow[],
  statusFilter: RequestStatusFilter
): RequestFeedbackRow[] {
  if (statusFilter === "all") {
    return rows;
  }
  return rows.filter((row) => row.status === statusFilter);
}

type BuildMobileRequestTimelineInput = {
  attendance: AttendanceRecordDto[];
  leaveRequests: LeaveRequestDto[];
  defaultsCopy: Pick<RequestDefaultsCopyLike, "attendanceRequestTitle" | "leaveRequestTitle">;
  toLeaveTypeLabel: (leaveType: LeaveRequestDto["leaveType"]) => string;
  formatDateTime: (value: string | null) => string;
};

export function buildMobileRequestTimeline({
  attendance,
  leaveRequests,
  defaultsCopy,
  toLeaveTypeLabel,
  formatDateTime
}: BuildMobileRequestTimelineInput): MobileRequestTimelineItem[] {
  const attendanceItems = attendance.map((record) => ({
    id: `attendance-${record.id}`,
    channel: "attendance" as const,
    status: record.state,
    at: record.checkOutAt ?? record.checkInAt,
    title: defaultsCopy.attendanceRequestTitle,
    detail: `${formatDateTime(record.checkInAt)} ~ ${formatDateTime(record.checkOutAt)}`
  }));

  const leaveItems = leaveRequests.map((request) => ({
    id: `leave-${request.id}`,
    channel: "leave" as const,
    status: request.state,
    at: request.endDate,
    title: defaultsCopy.leaveRequestTitle,
    detail: `${toLeaveTypeLabel(request.leaveType)} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`
  }));

  return [...attendanceItems, ...leaveItems]
    .sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))
    .slice(0, 12);
}

export function filterMobileRequestTimeline(
  items: MobileRequestTimelineItem[],
  channelFilter: TimelineChannelFilter,
  statusFilter: RequestStatusFilter
) {
  return items.filter((item) => {
    if (channelFilter !== "all" && item.channel !== channelFilter) {
      return false;
    }
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    return true;
  });
}

type BuildRequestFailureCausesInput = {
  logs: ApiLog[];
  attendance: AttendanceRecordDto[];
  leaveRequests: LeaveRequestDto[];
  defaultsCopy: Pick<
    RequestDefaultsCopyLike,
    | "attendanceRejectedSource"
    | "leaveRejectedSource"
    | "leaveCanceledSource"
    | "rejectionReasonMissing"
    | "reasonMissing"
  >;
  isKoLocale: boolean;
  formatDateTime: (value: string | null) => string;
  extractEmployeeErrorMessage: (body: unknown, isKoLocale: boolean) => string;
};

export function buildRequestFailureCauses({
  logs,
  attendance,
  leaveRequests,
  defaultsCopy,
  isKoLocale,
  formatDateTime,
  extractEmployeeErrorMessage
}: BuildRequestFailureCausesInput): RequestFailureCause[] {
  const byId = new Map<string, RequestFailureCause>();

  logs
    .filter((log) => !log.ok)
    .slice(0, 4)
    .forEach((log) => {
      const message = extractEmployeeErrorMessage(log.body, isKoLocale);
      byId.set(`log-${log.id}`, {
        id: `log-${log.id}`,
        source: `${log.label} (${log.status})`,
        message,
        at: log.at
      });
    });

  const latestRejectedAttendance = [...attendance].reverse().find((record) => record.state === "REJECTED");
  if (latestRejectedAttendance) {
    byId.set(`attendance-${latestRejectedAttendance.id}`, {
      id: `attendance-${latestRejectedAttendance.id}`,
      source: defaultsCopy.attendanceRejectedSource,
      message: latestRejectedAttendance.notes?.trim() || defaultsCopy.rejectionReasonMissing,
      at: formatDateTime(latestRejectedAttendance.checkOutAt ?? latestRejectedAttendance.checkInAt)
    });
  }

  const latestRejectedLeave = [...leaveRequests]
    .reverse()
    .find((request) => request.state === "REJECTED" || request.state === "CANCELED");
  if (latestRejectedLeave) {
    byId.set(`leave-${latestRejectedLeave.id}`, {
      id: `leave-${latestRejectedLeave.id}`,
      source:
        latestRejectedLeave.state === "REJECTED"
          ? defaultsCopy.leaveRejectedSource
          : defaultsCopy.leaveCanceledSource,
      message:
        latestRejectedLeave.decisionReason?.trim() ||
        latestRejectedLeave.reason?.trim() ||
        defaultsCopy.reasonMissing,
      at: formatDateTime(latestRejectedLeave.endDate)
    });
  }

  return [...byId.values()].slice(0, 6);
}
