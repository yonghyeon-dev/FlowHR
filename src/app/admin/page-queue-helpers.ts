import { toTimestamp, toWaitHours } from "@/app/admin/page-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  LeaveRequestDto,
  PayrollRunDto
} from "@/app/admin/page-types";
import {
  queueAlertLevelRank,
  matchesQueueSearch,
  summarizeQueueAlertByRule,
  matchesQueueSearchSort,
  sortQueueSearchSortRows
} from "@/components/admin-approval/approval-queue-helpers";
import type {
  AttendanceQueueSort,
  LeaveQueueSort,
  PayrollQueueSort,
  QueueAlertLevel,
  QueueBadgeSummary,
  QueueSearchScope,
  QueueSearchSortOption,
  QueueSearchSortRow,
  QueueSearchSortScope
} from "@/components/admin-approval/approval-queue-types";

type ResolveQueueAlertLevel = (waitHours: number) => QueueAlertLevel;

export function toWaitHoursById<T>(
  items: T[],
  getId: (item: T) => string,
  getStartAt: (item: T) => string,
  referenceMs: number
) {
  return new Map(items.map((item) => [getId(item), toWaitHours(getStartAt(item), referenceMs)] as const));
}

export function summarizeAdminApiLogs(logs: ApiLog[]) {
  const total = logs.length;
  const success = logs.filter((log) => log.ok).length;
  const fail = total - success;
  return { total, success, fail };
}

export function resolveQueueSlaWatchHours(value: string, fallback = 24) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, parsed);
}

export function resolveQueueSlaCriticalHours(value: string, watchHours: number, fallback = 48) {
  const parsed = Math.floor(Number(value));
  const resolvedFallback = Math.max(watchHours + 1, fallback);
  if (!Number.isFinite(parsed)) {
    return resolvedFallback;
  }
  return Math.max(watchHours + 1, parsed);
}

type FilterPendingAttendanceArgs = {
  pendingAttendance: AttendanceRecordDto[];
  attendanceWaitHoursById: Map<string, number>;
  approvalQueueOnlyUrgent: boolean;
  approvalQueueSelectedOnly: boolean;
  selectedAttendanceIds: string[];
  approvalQueueSearchScope: QueueSearchScope;
  normalizedQueueSearch: string;
  attendanceQueueSort: AttendanceQueueSort;
  resolveQueueAlertLevel: ResolveQueueAlertLevel;
};

export function filterPendingAttendanceQueue({
  pendingAttendance,
  attendanceWaitHoursById,
  approvalQueueOnlyUrgent,
  approvalQueueSelectedOnly,
  selectedAttendanceIds,
  approvalQueueSearchScope,
  normalizedQueueSearch,
  attendanceQueueSort,
  resolveQueueAlertLevel
}: FilterPendingAttendanceArgs) {
  const filtered = pendingAttendance.filter((record) => {
    const waitHours = attendanceWaitHoursById.get(record.id) ?? 0;
    const alertLevel = resolveQueueAlertLevel(waitHours);
    if (approvalQueueOnlyUrgent && alertLevel === "normal") {
      return false;
    }
    if (approvalQueueSelectedOnly && !selectedAttendanceIds.includes(record.id)) {
      return false;
    }

    return matchesQueueSearch(approvalQueueSearchScope, normalizedQueueSearch, {
      employee: record.employeeId,
      requestId: record.id,
      content: `${record.state} ${record.notes ?? ""} ${record.checkInAt} ${record.checkOutAt ?? ""}`
    });
  });

  return [...filtered].sort((left, right) => {
    if (attendanceQueueSort === "employee_asc") {
      return left.employeeId.localeCompare(right.employeeId, "ko");
    }
    if (attendanceQueueSort === "stale_desc") {
      const leftWait = attendanceWaitHoursById.get(left.id) ?? 0;
      const rightWait = attendanceWaitHoursById.get(right.id) ?? 0;
      return rightWait - leftWait;
    }
    const leftTime = toTimestamp(left.checkInAt);
    const rightTime = toTimestamp(right.checkInAt);
    if (attendanceQueueSort === "checkin_asc") {
      return leftTime - rightTime;
    }
    return rightTime - leftTime;
  });
}

type FilterPendingLeaveArgs = {
  pendingLeave: LeaveRequestDto[];
  leaveWaitHoursById: Map<string, number>;
  approvalQueueOnlyUrgent: boolean;
  approvalQueueSelectedOnly: boolean;
  selectedLeaveIds: string[];
  approvalQueueSearchScope: QueueSearchScope;
  normalizedQueueSearch: string;
  leaveQueueSort: LeaveQueueSort;
  resolveQueueAlertLevel: ResolveQueueAlertLevel;
};

export function filterPendingLeaveQueue({
  pendingLeave,
  leaveWaitHoursById,
  approvalQueueOnlyUrgent,
  approvalQueueSelectedOnly,
  selectedLeaveIds,
  approvalQueueSearchScope,
  normalizedQueueSearch,
  leaveQueueSort,
  resolveQueueAlertLevel
}: FilterPendingLeaveArgs) {
  const filtered = pendingLeave.filter((request) => {
    const waitHours = leaveWaitHoursById.get(request.id) ?? 0;
    const alertLevel = resolveQueueAlertLevel(waitHours);
    if (approvalQueueOnlyUrgent && alertLevel === "normal") {
      return false;
    }
    if (approvalQueueSelectedOnly && !selectedLeaveIds.includes(request.id)) {
      return false;
    }

    return matchesQueueSearch(approvalQueueSearchScope, normalizedQueueSearch, {
      employee: request.employeeId,
      requestId: request.id,
      content: `${request.leaveType} ${request.state} ${request.startDate} ${request.endDate} ${request.reason ?? ""}`
    });
  });

  return [...filtered].sort((left, right) => {
    if (leaveQueueSort === "employee_asc") {
      return left.employeeId.localeCompare(right.employeeId, "ko");
    }
    if (leaveQueueSort === "stale_desc") {
      const leftWait = leaveWaitHoursById.get(left.id) ?? 0;
      const rightWait = leaveWaitHoursById.get(right.id) ?? 0;
      return rightWait - leftWait;
    }
    const leftTime = toTimestamp(left.startDate);
    const rightTime = toTimestamp(right.startDate);
    if (leaveQueueSort === "start_asc") {
      return leftTime - rightTime;
    }
    return rightTime - leftTime;
  });
}

type FilterPreviewedPayrollArgs = {
  previewedPayroll: PayrollRunDto[];
  payrollWaitHoursById: Map<string, number>;
  approvalQueueOnlyUrgent: boolean;
  approvalQueueSelectedOnly: boolean;
  approvalQueueSearchScope: QueueSearchScope;
  normalizedQueueSearch: string;
  payrollQueueSort: PayrollQueueSort;
  resolveQueueAlertLevel: ResolveQueueAlertLevel;
};

export function filterPreviewedPayrollQueue({
  previewedPayroll,
  payrollWaitHoursById,
  approvalQueueOnlyUrgent,
  approvalQueueSelectedOnly,
  approvalQueueSearchScope,
  normalizedQueueSearch,
  payrollQueueSort,
  resolveQueueAlertLevel
}: FilterPreviewedPayrollArgs) {
  const filtered = previewedPayroll.filter((run) => {
    if (
      approvalQueueOnlyUrgent &&
      resolveQueueAlertLevel(payrollWaitHoursById.get(run.id) ?? 0) === "normal"
    ) {
      return false;
    }
    if (approvalQueueSelectedOnly) {
      return false;
    }

    return matchesQueueSearch(approvalQueueSearchScope, normalizedQueueSearch, {
      employee: run.employeeId ?? "",
      requestId: run.id,
      content: `${run.state} ${run.periodStart} ${run.periodEnd} ${run.grossPayKrw}`
    });
  });

  return [...filtered].sort((left, right) => {
    if (payrollQueueSort === "employee_asc") {
      return (left.employeeId ?? "").localeCompare(right.employeeId ?? "", "ko");
    }
    if (payrollQueueSort === "stale_desc") {
      const leftWait = payrollWaitHoursById.get(left.id) ?? 0;
      const rightWait = payrollWaitHoursById.get(right.id) ?? 0;
      return rightWait - leftWait;
    }
    if (payrollQueueSort === "gross_desc") {
      return right.grossPayKrw - left.grossPayKrw;
    }
    const leftPeriod = toTimestamp(left.periodStart);
    const rightPeriod = toTimestamp(right.periodStart);
    return rightPeriod - leftPeriod;
  });
}

type BuildQueueSearchSortRowsArgs = {
  filteredPendingAttendance: AttendanceRecordDto[];
  filteredPendingLeave: LeaveRequestDto[];
  filteredPreviewedPayroll: PayrollRunDto[];
  attendanceWaitHoursById: Map<string, number>;
  leaveWaitHoursById: Map<string, number>;
  payrollWaitHoursById: Map<string, number>;
  resolveQueueAlertLevel: ResolveQueueAlertLevel;
  queueLabels: {
    attendance: string;
    leave: string;
    payroll: string;
  };
};

export function buildQueueSearchSortRows({
  filteredPendingAttendance,
  filteredPendingLeave,
  filteredPreviewedPayroll,
  attendanceWaitHoursById,
  leaveWaitHoursById,
  payrollWaitHoursById,
  resolveQueueAlertLevel,
  queueLabels
}: BuildQueueSearchSortRowsArgs): QueueSearchSortRow[] {
  const attendanceRows = filteredPendingAttendance.map((record) => ({
    key: `attendance:${record.id}`,
    queue: "attendance" as const,
    queueLabel: queueLabels.attendance,
    itemId: record.id,
    employeeId: record.employeeId,
    waitHours: attendanceWaitHoursById.get(record.id) ?? 0,
    waitedAtMs: toTimestamp(record.checkInAt),
    severity: resolveQueueAlertLevel(attendanceWaitHoursById.get(record.id) ?? 0),
    selected: false,
    detail: `${record.state} ${record.notes ?? ""} ${record.checkInAt} ${record.checkOutAt ?? ""}`
  }));

  const leaveRows = filteredPendingLeave.map((request) => ({
    key: `leave:${request.id}`,
    queue: "leave" as const,
    queueLabel: queueLabels.leave,
    itemId: request.id,
    employeeId: request.employeeId,
    waitHours: leaveWaitHoursById.get(request.id) ?? 0,
    waitedAtMs: toTimestamp(request.startDate),
    severity: resolveQueueAlertLevel(leaveWaitHoursById.get(request.id) ?? 0),
    selected: false,
    detail: `${request.leaveType} ${request.state} ${request.startDate} ${request.endDate} ${request.reason ?? ""}`
  }));

  const payrollRows = filteredPreviewedPayroll.map((run) => ({
    key: `payroll:${run.id}`,
    queue: "payroll" as const,
    queueLabel: queueLabels.payroll,
    itemId: run.id,
    employeeId: run.employeeId ?? "-",
    waitHours: payrollWaitHoursById.get(run.id) ?? 0,
    waitedAtMs: toTimestamp(run.periodStart),
    severity: resolveQueueAlertLevel(payrollWaitHoursById.get(run.id) ?? 0),
    selected: false,
    detail: `${run.state} ${run.periodStart} ${run.periodEnd} ${run.grossPayKrw}`
  }));

  return [...attendanceRows, ...leaveRows, ...payrollRows];
}

type BuildQueueBadgeSummariesArgs = {
  queueLabels: {
    all: string;
    attendance: string;
    leave: string;
    payroll: string;
  };
  queueSlaWatchHours: number;
  queueSlaCriticalHours: number;
  pendingAttendanceCount: number;
  pendingLeaveCount: number;
  previewedPayrollCount: number;
  filteredPendingAttendanceCount: number;
  filteredPendingLeaveCount: number;
  filteredPreviewedPayrollCount: number;
  attendanceWaitHoursValues: number[];
  leaveWaitHoursValues: number[];
  payrollWaitHoursValues: number[];
};

export function buildQueueBadgeSummaries({
  queueLabels,
  queueSlaWatchHours,
  queueSlaCriticalHours,
  pendingAttendanceCount,
  pendingLeaveCount,
  previewedPayrollCount,
  filteredPendingAttendanceCount,
  filteredPendingLeaveCount,
  filteredPreviewedPayrollCount,
  attendanceWaitHoursValues,
  leaveWaitHoursValues,
  payrollWaitHoursValues
}: BuildQueueBadgeSummariesArgs): QueueBadgeSummary[] {
  return [
    {
      focus: "all",
      label: queueLabels.all,
      pending: pendingAttendanceCount + pendingLeaveCount + previewedPayrollCount,
      visible: filteredPendingAttendanceCount + filteredPendingLeaveCount + filteredPreviewedPayrollCount,
      selected: 0,
      ...summarizeQueueAlertByRule(
        [...attendanceWaitHoursValues, ...leaveWaitHoursValues, ...payrollWaitHoursValues],
        queueSlaWatchHours,
        queueSlaCriticalHours
      )
    },
    {
      focus: "attendance",
      label: queueLabels.attendance,
      pending: pendingAttendanceCount,
      visible: filteredPendingAttendanceCount,
      selected: 0,
      ...summarizeQueueAlertByRule(attendanceWaitHoursValues, queueSlaWatchHours, queueSlaCriticalHours)
    },
    {
      focus: "leave",
      label: queueLabels.leave,
      pending: pendingLeaveCount,
      visible: filteredPendingLeaveCount,
      selected: 0,
      ...summarizeQueueAlertByRule(leaveWaitHoursValues, queueSlaWatchHours, queueSlaCriticalHours)
    },
    {
      focus: "payroll",
      label: queueLabels.payroll,
      pending: previewedPayrollCount,
      visible: filteredPreviewedPayrollCount,
      selected: 0,
      ...summarizeQueueAlertByRule(payrollWaitHoursValues, queueSlaWatchHours, queueSlaCriticalHours)
    }
  ];
}

export function summarizeQueueAlertOverview(
  queueBadgeSummaries: QueueBadgeSummary[]
): {
  totalCritical: number;
  totalWatch: number;
  hottestQueue: QueueBadgeSummary | null;
} {
  const queueBadges = queueBadgeSummaries.filter((badge) => badge.focus !== "all");
  const totalCritical = queueBadges.reduce((sum, badge) => sum + badge.critical, 0);
  const totalWatch = queueBadges.reduce((sum, badge) => sum + badge.watch, 0);
  const hottestQueue =
    queueBadges.length === 0
      ? null
      : [...queueBadges].sort((left, right) => {
          const levelDiff = queueAlertLevelRank(right.alertLevel) - queueAlertLevelRank(left.alertLevel);
          if (levelDiff !== 0) {
            return levelDiff;
          }
          return right.oldestHours - left.oldestHours;
        })[0];
  return { totalCritical, totalWatch, hottestQueue };
}

type FilterQueueSearchSortRowsArgs = {
  queueSearchSortRows: QueueSearchSortRow[];
  queueSearchSortScope: QueueSearchSortScope;
  queueSearchSortQuery: string;
  queueSearchSortOption: QueueSearchSortOption;
};

export function filterQueueSearchSortRows({
  queueSearchSortRows,
  queueSearchSortScope,
  queueSearchSortQuery,
  queueSearchSortOption
}: FilterQueueSearchSortRowsArgs) {
  const normalizedQuery = queueSearchSortQuery.trim().toLowerCase();
  const filteredRows = queueSearchSortRows.filter((row) =>
    matchesQueueSearchSort(queueSearchSortScope, normalizedQuery, row)
  );

  return sortQueueSearchSortRows(filteredRows, queueSearchSortOption).slice(0, 18);
}
