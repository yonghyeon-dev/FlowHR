import { type Dispatch, type SetStateAction, useEffect, useMemo } from "react";

import {
  buildAttendanceStatusSummary,
  buildIntegratedSummaryCards,
  buildLeaveBalanceCards,
  buildLeaveCalendarCells,
  buildLeaveCalendarRows,
  buildLeaveStatusSummary,
  buildLeaveUsageProjectionLabel,
  buildRequestFlowStats,
  buildResubmitCandidates,
  resolveSelectedResubmitCandidate,
  summarizeEmployeeApiLogs
} from "@/app/employee/page-derived-helpers";
import { calculateNetMinutes, coerceNumber, toIso } from "@/app/employee/page-helpers";
import {
  formatEmployeeDeltaMinutes,
  type resolveEmployeeLocaleLabelBundle
} from "@/app/employee/page-locale-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  EmployeeDepartmentLeaveCalendarEntryDto,
  LeaveBalanceDto,
  LeaveRequestDto
} from "@/app/employee/page-types";

type EmployeeLocaleBundle = ReturnType<typeof resolveEmployeeLocaleLabelBundle>;
type EmployeeDefaultsCopy = EmployeeLocaleBundle["validationCopy"]["defaults"];
type EmployeeSummaryCardCopy = EmployeeLocaleBundle["validationCopy"]["summaryCards"];
type EmployeeLeaveBalanceCopy = EmployeeLocaleBundle["summaryCopy"]["leaveBalance"];
type EmployeeLeaveUnitCopy = EmployeeLocaleBundle["summaryCopy"]["leaveUnits"];
type EmployeeAttendanceCopy = EmployeeLocaleBundle["surfaceCopy"]["attendance"];

type UseEmployeeDashboardDerivedStateInput = {
  logs: ApiLog[];
  attendance: AttendanceRecordDto[];
  leaveRequests: LeaveRequestDto[];
  departmentLeaveCalendarEntries: EmployeeDepartmentLeaveCalendarEntryDto[];
  leaveBalance: LeaveBalanceDto | null;
  selectedCorrectionRecordId: string;
  lastAttendanceId: string;
  selectedResubmitCandidateKey: string;
  setSelectedResubmitCandidateKey: Dispatch<SetStateAction<string>>;
  periodStart: string;
  runtimeLocale: string;
  checkInAt: string;
  checkOutAt: string;
  breakMinutes: string;
  isKoLocale: boolean;
  defaultsCopy: EmployeeDefaultsCopy;
  summaryCardCopy: EmployeeSummaryCardCopy;
  leaveBalanceCopy: EmployeeLeaveBalanceCopy;
  leaveUnitCopy: EmployeeLeaveUnitCopy;
  attendanceCopy: EmployeeAttendanceCopy;
  formatDays: (value: number) => string;
  formatDateTimeByLocale: (value: string | null) => string;
  toLeaveTypeLabel: (leaveType: string) => string;
};

export function useEmployeeDashboardDerivedState(input: UseEmployeeDashboardDerivedStateInput) {
  const {
    logs,
    attendance,
    leaveRequests,
    departmentLeaveCalendarEntries,
    leaveBalance,
    selectedCorrectionRecordId,
    lastAttendanceId,
    selectedResubmitCandidateKey,
    setSelectedResubmitCandidateKey,
    periodStart,
    runtimeLocale,
    checkInAt,
    checkOutAt,
    breakMinutes,
    isKoLocale,
    defaultsCopy,
    summaryCardCopy,
    leaveBalanceCopy,
    leaveUnitCopy,
    attendanceCopy,
    formatDays,
    formatDateTimeByLocale,
    toLeaveTypeLabel
  } = input;

  const newestLog = logs[0];
  const latestPayload = useMemo(() => {
    if (!newestLog) {
      return defaultsCopy.noApiCallHistory;
    }
    try {
      return JSON.stringify(newestLog.body, null, 2);
    } catch {
      return String(newestLog.body);
    }
  }, [defaultsCopy.noApiCallHistory, newestLog]);

  const stats = useMemo(() => summarizeEmployeeApiLogs(logs), [logs]);

  const leaveBalanceSummary = useMemo(() => {
    if (!leaveBalance) {
      return leaveBalanceCopy.notLoaded;
    }
    return leaveBalanceCopy.summary(
      formatDays(leaveBalance.remainingDays),
      formatDays(leaveBalance.grantedDays),
      formatDays(leaveBalance.usedDays)
    );
  }, [leaveBalance, leaveBalanceCopy, formatDays]);

  const pendingLeaveCount = useMemo(
    () => leaveRequests.filter((request) => request.state === "PENDING").length,
    [leaveRequests]
  );

  const latestAttendance = useMemo(() => {
    if (attendance.length === 0) {
      return null;
    }
    return attendance[attendance.length - 1] ?? null;
  }, [attendance]);

  const selectedCorrectionRecord = useMemo(() => {
    const targetId = selectedCorrectionRecordId.trim() || lastAttendanceId.trim();
    if (!targetId) {
      return null;
    }
    return attendance.find((record) => record.id === targetId) ?? null;
  }, [attendance, lastAttendanceId, selectedCorrectionRecordId]);

  const attendanceSummary = useMemo(() => {
    if (!latestAttendance) {
      return defaultsCopy.noRecord;
    }
    if (!latestAttendance.checkOutAt) {
      return defaultsCopy.working;
    }
    return defaultsCopy.checkedOut;
  }, [defaultsCopy.checkedOut, defaultsCopy.noRecord, defaultsCopy.working, latestAttendance]);

  const leaveUsageRatePercent = useMemo(() => {
    if (!leaveBalance || leaveBalance.grantedDays <= 0) {
      return 0;
    }
    const ratio = (leaveBalance.usedDays / leaveBalance.grantedDays) * 100;
    return Math.max(0, Math.min(100, Math.round(ratio)));
  }, [leaveBalance]);

  const leaveUsageRingStyle = useMemo(
    () => ({
      background: `conic-gradient(#1f5fd1 0 ${leaveUsageRatePercent}%, #dbe8ff ${leaveUsageRatePercent}% 100%)`
    }),
    [leaveUsageRatePercent]
  );

  const leaveBalanceCards = useMemo(() => {
    return buildLeaveBalanceCards(leaveBalance, leaveBalanceCopy, formatDays);
  }, [leaveBalance, leaveBalanceCopy, formatDays]);

  const leaveUsageProjectionLabel = useMemo(() => {
    return buildLeaveUsageProjectionLabel(leaveBalance, leaveBalanceCopy, formatDays);
  }, [leaveBalance, leaveBalanceCopy, formatDays]);

  const leaveCalendarMonthLabel = useMemo(() => {
    const parsedPeriodStart = new Date(periodStart);
    const anchor = Number.isNaN(parsedPeriodStart.getTime()) ? new Date() : parsedPeriodStart;
    return new Intl.DateTimeFormat(runtimeLocale, { year: "numeric", month: "long" }).format(anchor);
  }, [periodStart, runtimeLocale]);

  const leaveCalendarCells = useMemo(
    () => buildLeaveCalendarCells(departmentLeaveCalendarEntries, periodStart),
    [departmentLeaveCalendarEntries, periodStart]
  );

  const leaveCalendarRows = useMemo(
    () =>
      buildLeaveCalendarRows({
        entries: departmentLeaveCalendarEntries,
        toLeaveTypeLabel,
        leaveUnitCopy,
        formatDays,
        formatDateTime: formatDateTimeByLocale
      }),
    [departmentLeaveCalendarEntries, formatDateTimeByLocale, formatDays, leaveUnitCopy, toLeaveTypeLabel]
  );

  const attendanceStatusSummary = useMemo(
    () => buildAttendanceStatusSummary(attendance),
    [attendance]
  );

  const leaveStatusSummary = useMemo(
    () => buildLeaveStatusSummary(leaveRequests),
    [leaveRequests]
  );

  const requestFlowStats = useMemo(
    () =>
      buildRequestFlowStats({
        attendanceStatusSummary,
        leaveStatusSummary
      }),
    [attendanceStatusSummary, leaveStatusSummary]
  );

  const resubmitCandidates = useMemo(
    () =>
      buildResubmitCandidates({
        attendance,
        leaveRequests,
        noReasonProvidedLabel: defaultsCopy.noReasonProvided,
        formatDateTime: formatDateTimeByLocale,
        toLeaveTypeLabel
      }),
    [attendance, defaultsCopy.noReasonProvided, formatDateTimeByLocale, leaveRequests, toLeaveTypeLabel]
  );

  const selectedResubmitCandidate = useMemo(
    () => resolveSelectedResubmitCandidate(resubmitCandidates, selectedResubmitCandidateKey),
    [resubmitCandidates, selectedResubmitCandidateKey]
  );

  useEffect(() => {
    if (resubmitCandidates.length === 0) {
      if (selectedResubmitCandidateKey) {
        setSelectedResubmitCandidateKey("");
      }
      return;
    }
    if (!selectedResubmitCandidateKey) {
      setSelectedResubmitCandidateKey(resubmitCandidates[0].key);
      return;
    }
    if (!resubmitCandidates.some((candidate) => candidate.key === selectedResubmitCandidateKey)) {
      setSelectedResubmitCandidateKey(resubmitCandidates[0].key);
    }
  }, [resubmitCandidates, selectedResubmitCandidateKey, setSelectedResubmitCandidateKey]);

  const integratedSummaryCards = useMemo(() => {
    return buildIntegratedSummaryCards({
      attendanceStatusSummary,
      leaveStatusSummary,
      requestCompletionRatePercent: requestFlowStats.requestCompletionRatePercent,
      resubmitNeededCount: resubmitCandidates.length,
      successCount: stats.success,
      failCount: stats.fail,
      summaryCardCopy
    });
  }, [
    attendanceStatusSummary,
    leaveStatusSummary,
    requestFlowStats.requestCompletionRatePercent,
    resubmitCandidates.length,
    stats.success,
    stats.fail,
    summaryCardCopy
  ]);

  const correctionDeltaLabel = useMemo(() => {
    if (!selectedCorrectionRecord) {
      return attendanceCopy.noComparisonTarget;
    }
    const originalNetMinutes = calculateNetMinutes({
      checkInAt: selectedCorrectionRecord.checkInAt,
      checkOutAt: selectedCorrectionRecord.checkOutAt,
      breakMinutes: selectedCorrectionRecord.breakMinutes
    });
    const draftNetMinutes = calculateNetMinutes({
      checkInAt: toIso(checkInAt),
      checkOutAt: checkOutAt.trim() ? toIso(checkOutAt) : null,
      breakMinutes: Math.max(0, Math.trunc(coerceNumber(breakMinutes)))
    });

    if (originalNetMinutes === null || draftNetMinutes === null) {
      return defaultsCopy.notComparable;
    }
    return formatEmployeeDeltaMinutes(draftNetMinutes - originalNetMinutes, isKoLocale);
  }, [
    attendanceCopy.noComparisonTarget,
    breakMinutes,
    checkInAt,
    checkOutAt,
    defaultsCopy.notComparable,
    isKoLocale,
    selectedCorrectionRecord
  ]);

  return {
    latestPayload,
    stats,
    leaveBalanceSummary,
    pendingLeaveCount,
    latestAttendance,
    selectedCorrectionRecord,
    attendanceSummary,
    leaveUsageRatePercent,
    leaveUsageRingStyle,
    leaveBalanceCards,
    leaveUsageProjectionLabel,
    leaveCalendarMonthLabel,
    leaveCalendarCells,
    leaveCalendarRows,
    attendanceStatusSummary,
    leaveStatusSummary,
    requestFlowStats,
    resubmitCandidates,
    selectedResubmitCandidate,
    integratedSummaryCards,
    correctionDeltaLabel
  };
}
