"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildAttendanceStatusSummary,
  buildIntegratedSummaryCards,
  buildLeaveCalendarCells,
  buildLeaveCalendarRows,
  buildLeaveBalanceCards,
  buildRequestFlowStats,
  buildLeaveStatusSummary,
  buildLeaveUsageProjectionLabel,
  buildResubmitCandidates,
  resolveSelectedResubmitCandidate,
  summarizeEmployeeApiLogs
} from "@/app/employee/page-derived-helpers";
import { performEmployeeApiCall } from "@/app/employee/page-api-helpers";
import { buildEmployeeMutationActions } from "@/app/employee/page-mutation-actions";
import {
  buildEmployeeInteractionHandlers
} from "@/app/employee/page-interaction-actions";
import {
  buildMobileRequestTimeline,
  buildRequestFailureCauses,
  buildRequestFeedbackRows,
  buildRequestSearchRows,
  filterMobileRequestTimeline,
  filterRequestFeedbackRows
} from "@/app/employee/page-request-helpers";
import {
  buildAttendancePreSubmitChecks,
  buildCorrectionValidation,
  buildIntegratedSubmitChecklistCards,
  buildLeavePreSubmitChecks,
  buildResubmitFlowChecks
} from "@/app/employee/page-validation-helpers";
import {
  buildQuery,
  calculateNetMinutes,
  coerceNumber,
  estimateLeaveRequestedDays,
  firstDayOfMonthLocal,
  formatDateTime,
  formatDays,
  lastDayOfMonthLocal,
  matchesRequestSearch,
  sortRequestRowsByOption,
  statusToTone,
  todayEndLocal,
  todayStartLocal,
  toIso
} from "@/app/employee/page-helpers";
import {
  extractEmployeeErrorMessage,
  formatEmployeeDeltaMinutes,
  isDefaultEmployeeCancelReason,
  resolveEmployeeLocaleLabelBundle
} from "@/app/employee/page-locale-helpers";
import { useEmployeeRuntimeSession } from "@/app/employee/page-session-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  IntegratedSubmitChecklistCard,
  IntegratedSummaryCard,
  LeaveBalanceDto,
  LeaveCalendarDayCell,
  LeaveRequestDto,
  MobileRequestTimelineItem,
  PreSubmitCheckItem,
  RequestFailureCause,
  RequestFeedbackRow,
  RequestSearchRow,
  RequestSearchScope,
  RequestSortOption,
  RequestStatusFilter,
  ResubmitCandidate,
  TimelineChannelFilter,
  WorkScheduleDto
} from "@/app/employee/page-types";
import { EmployeeAccountOverviewPanels } from "@/components/employee-dashboard/EmployeeAccountOverviewPanels";
import { EmployeeAttendanceLeavePanels } from "@/components/employee-dashboard/EmployeeAttendanceLeavePanels";
import { EmployeeDashboardChrome } from "@/components/employee-dashboard/EmployeeDashboardChrome";
import { EmployeeRequestFeedbackPanels } from "@/components/employee-dashboard/EmployeeRequestFeedbackPanels";
import { EmployeeResubmitPanel } from "@/components/employee-dashboard/EmployeeResubmitPanel";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

export default function EmployeeSelfServicePage() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const localeLabelBundle = useMemo(() => resolveEmployeeLocaleLabelBundle(isKoLocale), [isKoLocale]);
  const {
    attendanceNotePresets,
    callApiLabels,
    correctionRequestNote,
    defaultCancelReason,
    leaveCalendarWeekdays,
    leaveTypeLabels,
    listBadgeLabels,
    notConfiguredLabel,
    preSubmitStatusLabels,
    requestStatusLabels,
    runtimeLocale,
    surfaceCopy,
    validationCopy,
    summaryCopy
  } = localeLabelBundle;

  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");

  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());

  const [checkInAt, setCheckInAt] = useState(todayStartLocal());
  const [checkOutAt, setCheckOutAt] = useState(todayEndLocal());
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [isHoliday, setIsHoliday] = useState(false);
  const [attendanceNotes, setAttendanceNotes] = useState("");
  const [lastAttendanceId, setLastAttendanceId] = useState("");
  const [selectedCorrectionRecordId, setSelectedCorrectionRecordId] = useState("");

  const [leaveType, setLeaveType] = useState<"ANNUAL" | "SICK" | "UNPAID">("ANNUAL");
  const [leaveUnit, setLeaveUnit] = useState<"FULL_DAY" | "HALF_DAY" | "HOUR">("FULL_DAY");
  const [leaveHours, setLeaveHours] = useState("4");
  const [leaveStartDate, setLeaveStartDate] = useState(todayStartLocal());
  const [leaveEndDate, setLeaveEndDate] = useState(todayEndLocal());
  const [leaveReason, setLeaveReason] = useState("");
  const [lastLeaveRequestId, setLastLeaveRequestId] = useState("");
  const [cancelReason, setCancelReason] = useState<string>(defaultCancelReason);

  const [attendance, setAttendance] = useState<AttendanceRecordDto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceDto | null>(null);

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [, setMobileFlowFeedback] = useState("");
  const [requestFeedbackStatusFilter, setRequestFeedbackStatusFilter] = useState<RequestStatusFilter>("all");
  const [timelineChannelFilter, setTimelineChannelFilter] = useState<TimelineChannelFilter>("all");
  const [timelineStatusFilter, setTimelineStatusFilter] = useState<RequestStatusFilter>("all");
  const [requestSearchScope, setRequestSearchScope] = useState<RequestSearchScope>("all");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestSortOption, setRequestSortOption] = useState<RequestSortOption>("pending_first");
  const [selectedResubmitCandidateKey, setSelectedResubmitCandidateKey] = useState("");
  const [lastAppliedResubmitCandidateKey, setLastAppliedResubmitCandidateKey] = useState("");

  const toRequestStatusLabel = useCallback(
    (status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") => requestStatusLabels[status],
    [requestStatusLabels]
  );
  const toLeaveTypeLabel = useCallback(
    (leaveType: string) => leaveTypeLabels[leaveType as keyof typeof leaveTypeLabels] ?? leaveType,
    [leaveTypeLabels]
  );
  const formatDateTimeByLocale = useCallback(
    (value: string | null) => formatDateTime(value, runtimeLocale),
    [runtimeLocale]
  );

  const {
    showDevTools,
    isProductionRuntime,
    supabaseSession,
    supabaseSessionError,
    bearerToken,
    usesBearerToken
  } = useEmployeeRuntimeSession({
    accessToken,
    organizationId,
    setOrganizationId,
    employeeId,
    setEmployeeId,
    notConfiguredLabel
  });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? notConfiguredLabel;
  const newestLog = logs[0];
  const requestNowMs = Date.now();
  const normalizedRequestSearchQuery = requestSearchQuery.trim().toLowerCase();
  const {
    sectionTitles,
    attendance: attendanceCopy,
    leave: leaveCopy,
    leaveCalendar: leaveCalendarCopy,
    schedule: scheduleCopy,
    apiLogs: apiLogsCopy
  } = surfaceCopy;
  const { leaveBalance: leaveBalanceCopy, leaveUnits: leaveUnitCopy } = summaryCopy;
  const {
    feedback: feedbackCopy,
    defaults: defaultsCopy,
    summaryCards: summaryCardCopy,
    requestFeedback: requestFeedbackCopy,
    correctionValidation: correctionValidationCopy,
    attendanceChecks: attendanceCheckCopy,
    leaveChecks: leaveCheckCopy,
    resubmitFlowChecks: resubmitFlowCheckCopy,
    submitChecklistCards: submitChecklistCardCopy
  } = validationCopy;

  useEffect(() => {
    setCancelReason((previous) =>
      isDefaultEmployeeCancelReason(previous) ? defaultCancelReason : previous
    );
  }, [defaultCancelReason]);

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PUT" | "PATCH",
    path: string,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      const { response, body, log } = await performEmployeeApiCall({
        label,
        method,
        path,
        payload,
        usesBearerToken,
        bearerToken,
        employeeId,
        organizationId,
        runtimeLocale
      });
      setLogs((prev) => [log, ...prev]);

      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  const mutationActions = buildEmployeeMutationActions({
    callApi,
    callApiLabels,
    buildQuery,
    toIso,
    coerceNumber,
    periodStart,
    periodEnd,
    employeeId,
    selectedCorrectionRecordId,
    lastAttendanceId,
    setAttendance,
    setLastAttendanceId,
    setSelectedCorrectionRecordId,
    setLeaveRequests,
    setLastLeaveRequestId,
    setSchedules,
    setLeaveBalance,
    checkInAt,
    checkOutAt,
    breakMinutes,
    isHoliday,
    attendanceNotes,
    correctionRequestNote,
    leaveType,
    leaveUnit,
    leaveStartDate,
    leaveEndDate,
    leaveHours,
    leaveReason,
    cancelReason,
    lastLeaveRequestId
  });

  function clearLogs() {
    setLogs([]);
  }

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

  const stats = useMemo(() => {
    return summarizeEmployeeApiLogs(logs);
  }, [logs]);

  const leaveBalanceSummary = useMemo(() => {
    if (!leaveBalance) {
      return leaveBalanceCopy.notLoaded;
    }
    return leaveBalanceCopy.summary(
      formatDays(leaveBalance.remainingDays),
      formatDays(leaveBalance.grantedDays),
      formatDays(leaveBalance.usedDays)
    );
  }, [leaveBalance, leaveBalanceCopy]);

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
  }, [leaveBalance, leaveBalanceCopy]);

  const leaveUsageProjectionLabel = useMemo(() => {
    return buildLeaveUsageProjectionLabel(leaveBalance, leaveBalanceCopy, formatDays);
  }, [leaveBalance, leaveBalanceCopy]);

  const leaveCalendarMonthLabel = useMemo(() => {
    const parsedPeriodStart = new Date(periodStart);
    const anchor = Number.isNaN(parsedPeriodStart.getTime()) ? new Date() : parsedPeriodStart;
    return new Intl.DateTimeFormat(runtimeLocale, { year: "numeric", month: "long" }).format(anchor);
  }, [periodStart, runtimeLocale]);

  const leaveCalendarCells = useMemo<LeaveCalendarDayCell[]>(
    () => buildLeaveCalendarCells(leaveRequests, periodStart),
    [leaveRequests, periodStart]
  );

  const leaveCalendarRows = useMemo(
    () =>
      buildLeaveCalendarRows({
        leaveRequests,
        toLeaveTypeLabel,
        leaveUnitCopy,
        formatDays,
        formatDateTime: formatDateTimeByLocale
      }),
    [formatDateTimeByLocale, leaveRequests, leaveUnitCopy, toLeaveTypeLabel]
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

  const resubmitCandidates = useMemo<ResubmitCandidate[]>(
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
  }, [resubmitCandidates, selectedResubmitCandidateKey]);

  const integratedSummaryCards = useMemo<IntegratedSummaryCard[]>(
    () =>
      buildIntegratedSummaryCards({
        attendanceStatusSummary,
        leaveStatusSummary,
        requestCompletionRatePercent: requestFlowStats.requestCompletionRatePercent,
        resubmitNeededCount: resubmitCandidates.length,
        successCount: stats.success,
        failCount: stats.fail,
        summaryCardCopy
      }),
    [
      attendanceStatusSummary,
      leaveStatusSummary,
      requestFlowStats.requestCompletionRatePercent,
      resubmitCandidates.length,
      stats.fail,
      stats.success,
      summaryCardCopy
    ]
  );

  const latestLeaveRequest = useMemo(() => {
    if (leaveRequests.length === 0) {
      return null;
    }
    return leaveRequests[leaveRequests.length - 1] ?? null;
  }, [leaveRequests]);

  const requestFeedbackRows = useMemo<RequestFeedbackRow[]>(() => {
    return buildRequestFeedbackRows({
      latestAttendance,
      latestLeaveRequest,
      defaultsCopy: {
        noReasonProvided: defaultsCopy.noReasonProvided
      },
      requestFeedbackCopy
    });
  }, [defaultsCopy.noReasonProvided, latestAttendance, latestLeaveRequest, requestFeedbackCopy]);

  const requestSearchRows = useMemo<RequestSearchRow[]>(() => {
    return buildRequestSearchRows({
      attendance,
      leaveRequests,
      requestNowMs,
      defaultsCopy: {
        noNote: defaultsCopy.noNote,
        noReason: defaultsCopy.noReason
      },
      leaveUnitCopy,
      formatDays,
      toLeaveTypeLabel,
      formatDateTime: formatDateTimeByLocale
    });
  }, [attendance, defaultsCopy.noNote, defaultsCopy.noReason, formatDateTimeByLocale, leaveRequests, leaveUnitCopy, requestNowMs, toLeaveTypeLabel]);

  const filteredRequestSearchRows = useMemo(() => {
    const filtered = requestSearchRows.filter((row) =>
      matchesRequestSearch(requestSearchScope, normalizedRequestSearchQuery, row)
    );

    return sortRequestRowsByOption(filtered, requestSortOption);
  }, [normalizedRequestSearchQuery, requestSearchRows, requestSearchScope, requestSortOption]);

  const filteredRequestFeedbackRows = useMemo(() => {
    return filterRequestFeedbackRows(requestFeedbackRows, requestFeedbackStatusFilter);
  }, [requestFeedbackStatusFilter, requestFeedbackRows]);

  const mobileRequestTimeline = useMemo<MobileRequestTimelineItem[]>(() => {
    return buildMobileRequestTimeline({
      attendance,
      leaveRequests,
      defaultsCopy: {
        attendanceRequestTitle: defaultsCopy.attendanceRequestTitle,
        leaveRequestTitle: defaultsCopy.leaveRequestTitle
      },
      toLeaveTypeLabel,
      formatDateTime: formatDateTimeByLocale
    });
  }, [attendance, defaultsCopy.attendanceRequestTitle, defaultsCopy.leaveRequestTitle, formatDateTimeByLocale, leaveRequests, toLeaveTypeLabel]);

  const filteredMobileRequestTimeline = useMemo(() => {
    return filterMobileRequestTimeline(
      mobileRequestTimeline,
      timelineChannelFilter,
      timelineStatusFilter
    );
  }, [mobileRequestTimeline, timelineChannelFilter, timelineStatusFilter]);

  const requestFailureCauses = useMemo<RequestFailureCause[]>(() => {
    return buildRequestFailureCauses({
      logs,
      attendance,
      leaveRequests,
      defaultsCopy: {
        attendanceRejectedSource: defaultsCopy.attendanceRejectedSource,
        leaveRejectedSource: defaultsCopy.leaveRejectedSource,
        leaveCanceledSource: defaultsCopy.leaveCanceledSource,
        rejectionReasonMissing: defaultsCopy.rejectionReasonMissing,
        reasonMissing: defaultsCopy.reasonMissing
      },
      isKoLocale,
      formatDateTime: formatDateTimeByLocale,
      extractEmployeeErrorMessage
    });
  }, [attendance, defaultsCopy.attendanceRejectedSource, defaultsCopy.leaveCanceledSource, defaultsCopy.leaveRejectedSource, defaultsCopy.reasonMissing, defaultsCopy.rejectionReasonMissing, formatDateTimeByLocale, isKoLocale, leaveRequests, logs]);

  const latestFailureCauseMessage = requestFailureCauses[0]?.message ?? null;

  const correctionValidation = useMemo(
    () =>
      buildCorrectionValidation({
        lastAttendanceId,
        checkInAt,
        checkOutAt,
        breakMinutes,
        correctionValidationCopy
      }),
    [breakMinutes, checkInAt, checkOutAt, correctionValidationCopy, lastAttendanceId]
  );

  const attendancePreSubmitChecks = useMemo<PreSubmitCheckItem[]>(
    () =>
      buildAttendancePreSubmitChecks({
        lastAttendanceId,
        checkInAt,
        checkOutAt,
        breakMinutes,
        attendanceCheckCopy
      }),
    [attendanceCheckCopy, breakMinutes, checkInAt, checkOutAt, lastAttendanceId]
  );

  const attendancePreSubmitValid = useMemo(
    () => attendancePreSubmitChecks.every((check) => check.pass),
    [attendancePreSubmitChecks]
  );

  const attendanceFirstFailCheck = useMemo(
    () => attendancePreSubmitChecks.find((check) => !check.pass) ?? null,
    [attendancePreSubmitChecks]
  );

  const estimatedLeaveRequestedDays = useMemo(
    () =>
      estimateLeaveRequestedDays({
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        unit: leaveUnit,
        hoursInput: leaveHours
      }),
    [leaveEndDate, leaveHours, leaveStartDate, leaveUnit]
  );

  const leavePreSubmitChecks = useMemo<PreSubmitCheckItem[]>(
    () =>
      buildLeavePreSubmitChecks({
        leaveStartDate,
        leaveEndDate,
        leaveUnit,
        leaveHours,
        leaveType,
        leaveBalance,
        estimatedLeaveRequestedDays,
        leaveCheckCopy,
        formatDays
      }),
    [
      estimatedLeaveRequestedDays,
      leaveBalance,
      leaveCheckCopy,
      leaveEndDate,
      leaveHours,
      leaveStartDate,
      leaveType,
      leaveUnit
    ]
  );

  const leavePreSubmitValid = useMemo(() => leavePreSubmitChecks.every((check) => check.pass), [leavePreSubmitChecks]);

  const leaveFirstFailCheck = useMemo(
    () => leavePreSubmitChecks.find((check) => !check.pass) ?? null,
    [leavePreSubmitChecks]
  );

  const resubmitFlowChecks = useMemo<PreSubmitCheckItem[]>(
    () =>
      buildResubmitFlowChecks({
        selectedResubmitCandidate,
        lastAppliedResubmitCandidateKey,
        correctionValidationIsValid: correctionValidation.isValid,
        attendancePreSubmitValid,
        leavePreSubmitValid,
        resubmitFlowCheckCopy
      }),
    [
      attendancePreSubmitValid,
      correctionValidation.isValid,
      lastAppliedResubmitCandidateKey,
      leavePreSubmitValid,
      resubmitFlowCheckCopy,
      selectedResubmitCandidate
    ]
  );

  const resubmitFlowReady = useMemo(
    () => resubmitFlowChecks.every((check) => check.pass),
    [resubmitFlowChecks]
  );

  const resubmitFirstFailCheck = useMemo(
    () => resubmitFlowChecks.find((check) => !check.pass) ?? null,
    [resubmitFlowChecks]
  );

  const integratedSubmitChecklistCards = useMemo<IntegratedSubmitChecklistCard[]>(
    () =>
      buildIntegratedSubmitChecklistCards({
        attendancePreSubmitChecks,
        leavePreSubmitChecks,
        resubmitFlowChecks,
        attendancePreSubmitValid,
        correctionValidation,
        lastAttendanceId,
        attendanceFirstFailCheck,
        leavePreSubmitValid,
        estimatedLeaveRequestedDays,
        leaveFirstFailCheck,
        resubmitFlowReady,
        resubmitFirstFailCheck,
        submitChecklistCardCopy,
        formatDays
      }),
    [
      attendanceFirstFailCheck,
      attendancePreSubmitChecks,
      attendancePreSubmitValid,
      correctionValidation,
      estimatedLeaveRequestedDays,
      lastAttendanceId,
      leaveFirstFailCheck,
      leavePreSubmitChecks,
      leavePreSubmitValid,
      resubmitFirstFailCheck,
      resubmitFlowChecks,
      resubmitFlowReady,
      submitChecklistCardCopy
    ]
  );

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
  }, [attendanceCopy.noComparisonTarget, breakMinutes, checkInAt, checkOutAt, defaultsCopy.notComparable, isKoLocale, selectedCorrectionRecord]);

  const {
    applyAttendanceRecordToCorrectionForm,
    applyLatestAttendanceToCorrectionForm,
    applyLatestResubmitCandidate,
    applyLeaveQuickPreset,
    applyResubmitCandidateToDraft,
    applySelectedCorrectionRecord,
    applySelectedResubmitCandidate,
    clearResubmitSelection,
    copyFailureCause,
    jumpToSection,
    moveCalendarMonth,
    openPendingRequestSearch,
    prefillLeaveFormFromCalendarDate,
    resetCalendarToCurrentMonth,
    selectCorrectionTarget
  } = buildEmployeeInteractionHandlers({
    attendance,
    correctionRequestNote,
    defaultsCopy: {
      resubmitCorrectionNote: defaultsCopy.resubmitCorrectionNote
    },
    feedbackCopy: {
      attendanceResubmitDraftApplied: feedbackCopy.attendanceResubmitDraftApplied,
      clipboardUnavailable: feedbackCopy.clipboardUnavailable,
      copiedLatestFailureCause: feedbackCopy.copiedLatestFailureCause,
      copyFailureCauseFailed: feedbackCopy.copyFailureCauseFailed,
      leaveResubmitDraftApplied: feedbackCopy.leaveResubmitDraftApplied,
      noFailureCauseToCopy: feedbackCopy.noFailureCauseToCopy,
      noResubmitTarget: feedbackCopy.noResubmitTarget,
      pendingRequestFilterApplied: feedbackCopy.pendingRequestFilterApplied,
      resetResubmitSelection: feedbackCopy.resetResubmitSelection,
      selectResubmitCandidateFirst: feedbackCopy.selectResubmitCandidateFirst,
      selectedAttendanceResubmitMissing: feedbackCopy.selectedAttendanceResubmitMissing,
      selectedLeaveResubmitMissing: feedbackCopy.selectedLeaveResubmitMissing
    },
    isKoLocale,
    latestAttendance,
    leaveRequests,
    periodStart,
    refreshEmployeeSnapshot: async ({ fromIso, toIso }) => {
      await mutationActions.refreshEmployeeSnapshot({ fromIso, toIso });
    },
    resubmitCandidates,
    selectedCorrectionRecord,
    selectedResubmitCandidate,
    setAttendanceNotes,
    setBreakMinutes,
    setCheckInAt,
    setCheckOutAt,
    setIsHoliday,
    setLastAppliedResubmitCandidateKey,
    setLastAttendanceId,
    setLastLeaveRequestId,
    setLeaveEndDate,
    setLeaveHours,
    setLeaveReason,
    setLeaveStartDate,
    setLeaveType,
    setLeaveUnit,
    setMobileFlowFeedback,
    setPeriodEnd,
    setPeriodStart,
    setRequestSearchQuery,
    setRequestSearchScope,
    setRequestSortOption,
    setSelectedCorrectionRecordId,
    setSelectedResubmitCandidateKey
  });

  return (
    <main className="saas-content">
      <EmployeeDashboardChrome
        showDevTools={showDevTools}
        isKoLocale={isKoLocale}
        isProductionRuntime={isProductionRuntime}
        usesBearerToken={usesBearerToken}
        attendanceSummary={attendanceSummary}
        leaveBalanceLabel={leaveBalance ? leaveBalanceCopy.dayUnit(formatDays(leaveBalance.remainingDays)) : "-"}
        pendingLeaveCount={pendingLeaveCount}
        stats={stats}
        pendingLabel={pendingLabel}
      />

      <section className="panel-grid">
        <EmployeeAccountOverviewPanels
          isKoLocale={isKoLocale}
          showDevTools={showDevTools}
          isProductionRuntime={isProductionRuntime}
          usesBearerToken={usesBearerToken}
          supabaseSession={supabaseSession}
          supabaseSessionError={supabaseSessionError}
          organizationId={organizationId}
          employeeId={employeeId}
          accessToken={accessToken}
          periodStart={periodStart}
          periodEnd={periodEnd}
          supabaseUrl={supabaseUrl}
          integratedSummaryCards={integratedSummaryCards}
          integratedSubmitChecklistCards={integratedSubmitChecklistCards}
          onOrganizationIdChange={setOrganizationId}
          onEmployeeIdChange={setEmployeeId}
          onAccessTokenChange={setAccessToken}
          onPeriodStartChange={setPeriodStart}
          onPeriodEndChange={setPeriodEnd}
          onRefreshEmployeeSnapshot={() => void mutationActions.refreshEmployeeSnapshot()}
          onJumpToSection={jumpToSection}
        />

        <EmployeeRequestFeedbackPanels
          isKoLocale={isKoLocale}
          requestFeedbackStatusFilter={requestFeedbackStatusFilter}
          filteredRequestFeedbackRows={filteredRequestFeedbackRows}
          requestFailureCauses={requestFailureCauses}
          latestFailureCauseMessage={latestFailureCauseMessage}
          requestSearchScope={requestSearchScope}
          requestSearchQuery={requestSearchQuery}
          requestSortOption={requestSortOption}
          filteredRequestSearchRows={filteredRequestSearchRows}
          timelineChannelFilter={timelineChannelFilter}
          timelineStatusFilter={timelineStatusFilter}
          filteredMobileRequestTimeline={filteredMobileRequestTimeline}
          toRequestStatusLabel={toRequestStatusLabel}
          formatDateTime={formatDateTimeByLocale}
          statusToTone={statusToTone}
          onRequestFeedbackStatusFilterChange={setRequestFeedbackStatusFilter}
          onCopyFailureCause={(message) => void copyFailureCause(message)}
          onRequestSearchScopeChange={setRequestSearchScope}
          onRequestSearchQueryChange={setRequestSearchQuery}
          onRequestSortOptionChange={setRequestSortOption}
          onResetRequestSearchFilters={() => {
            setRequestSearchScope("all");
            setRequestSearchQuery("");
            setRequestSortOption("pending_first");
          }}
          onOpenPendingRequestSearch={openPendingRequestSearch}
          onTimelineChannelFilterChange={setTimelineChannelFilter}
          onTimelineStatusFilterChange={setTimelineStatusFilter}
        />

        <EmployeeResubmitPanel
          isKoLocale={isKoLocale}
          selectedResubmitCandidateKey={selectedResubmitCandidateKey}
          resubmitCandidates={resubmitCandidates}
          selectedResubmitCandidate={selectedResubmitCandidate}
          lastAppliedResubmitCandidateKey={lastAppliedResubmitCandidateKey}
          resubmitFlowChecks={resubmitFlowChecks}
          listBadgeLabels={listBadgeLabels}
          preSubmitStatusLabels={preSubmitStatusLabels}
          toRequestStatusLabel={toRequestStatusLabel}
          onSelectedResubmitCandidateKeyChange={setSelectedResubmitCandidateKey}
          onApplySelectedResubmitCandidate={applySelectedResubmitCandidate}
          onApplyLatestResubmitCandidate={applyLatestResubmitCandidate}
          onClearResubmitSelection={clearResubmitSelection}
          onApplyResubmitCandidateToDraft={applyResubmitCandidateToDraft}
        />

        <EmployeeAttendanceLeavePanels
          sectionTitles={sectionTitles}
          attendanceCopy={attendanceCopy}
          leaveCopy={leaveCopy}
          leaveCalendarCopy={leaveCalendarCopy}
          scheduleCopy={scheduleCopy}
          apiLogsCopy={apiLogsCopy}
          callApiLabels={callApiLabels}
          listBadgeLabels={listBadgeLabels}
          preSubmitStatusLabels={preSubmitStatusLabels}
          showDevTools={showDevTools}
          attendance={attendance}
          leaveRequests={leaveRequests}
          schedules={schedules}
          leaveBalance={leaveBalance}
          checkInAt={checkInAt}
          checkOutAt={checkOutAt}
          breakMinutes={breakMinutes}
          isHoliday={isHoliday}
          attendanceNotes={attendanceNotes}
          lastAttendanceId={lastAttendanceId}
          selectedCorrectionRecordId={selectedCorrectionRecordId}
          hasSelectedCorrectionRecord={selectedCorrectionRecord !== null}
          correctionDeltaLabel={correctionDeltaLabel}
          attendancePreSubmitChecks={attendancePreSubmitChecks}
          attendancePreSubmitValid={attendancePreSubmitValid}
          correctionValidationMessage={correctionValidation.message}
          correctionValidationIsValid={correctionValidation.isValid}
          latestAttendance={latestAttendance}
          attendanceNotePresets={attendanceNotePresets}
          leaveType={leaveType}
          leaveUnit={leaveUnit}
          leaveHours={leaveHours}
          leaveStartDate={leaveStartDate}
          leaveEndDate={leaveEndDate}
          leaveReason={leaveReason}
          cancelReason={cancelReason}
          lastLeaveRequestId={lastLeaveRequestId}
          leaveBalanceSummary={leaveBalanceSummary}
          leavePreSubmitChecks={leavePreSubmitChecks}
          leavePreSubmitValid={leavePreSubmitValid}
          leaveUsageRatePercent={leaveUsageRatePercent}
          leaveUsageRingStyle={leaveUsageRingStyle}
          leaveBalanceCards={leaveBalanceCards}
          leaveUsageProjectionLabel={leaveUsageProjectionLabel}
          leaveCalendarMonthLabel={leaveCalendarMonthLabel}
          leaveCalendarWeekdays={leaveCalendarWeekdays}
          leaveCalendarCells={leaveCalendarCells}
          leaveCalendarRows={leaveCalendarRows}
          pendingLabel={pendingLabel}
          logs={logs}
          stats={stats}
          latestPayload={latestPayload}
          formatDateTime={formatDateTimeByLocale}
          formatDays={formatDays}
          toLeaveTypeLabel={toLeaveTypeLabel}
          toRequestStatusLabel={toRequestStatusLabel}
          onCheckInAtChange={setCheckInAt}
          onCheckOutAtChange={setCheckOutAt}
          onBreakMinutesChange={setBreakMinutes}
          onIsHolidayChange={setIsHoliday}
          onAttendanceNotesChange={setAttendanceNotes}
          onLastAttendanceIdChange={setLastAttendanceId}
          onSelectCorrectionTarget={selectCorrectionTarget}
          onCreateAttendance={() => void mutationActions.createAttendance()}
          onCheckOutNow={() => void mutationActions.checkOutNow()}
          onRequestAttendanceCorrection={() => void mutationActions.requestAttendanceCorrection()}
          onApplySelectedCorrectionRecord={applySelectedCorrectionRecord}
          onApplyLatestAttendanceToCorrectionForm={applyLatestAttendanceToCorrectionForm}
          onApplyAttendanceRecordToCorrectionForm={applyAttendanceRecordToCorrectionForm}
          onLeaveTypeChange={setLeaveType}
          onLeaveUnitChange={setLeaveUnit}
          onLeaveHoursChange={setLeaveHours}
          onLeaveStartDateChange={setLeaveStartDate}
          onLeaveEndDateChange={setLeaveEndDate}
          onCancelReasonChange={setCancelReason}
          onLeaveReasonChange={setLeaveReason}
          onLastLeaveRequestIdChange={setLastLeaveRequestId}
          onApplyLeaveQuickPreset={applyLeaveQuickPreset}
          onCreateLeave={() => void mutationActions.createLeave()}
          onCancelLeave={() => void mutationActions.cancelLeave()}
          onPrefillLeaveFromCalendarDate={prefillLeaveFormFromCalendarDate}
          onMoveCalendarMonth={(delta) => void moveCalendarMonth(delta)}
          onResetCalendarToCurrentMonth={() => void resetCalendarToCurrentMonth()}
          onClearLogs={clearLogs}
        />
      </section>
    </main>
  );
}


