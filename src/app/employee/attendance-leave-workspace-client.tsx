"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildEmployeeInteractionHandlers } from "@/app/employee/page-interaction-actions";
import { useApplyAttendanceSchedulePrefillEffect } from "@/app/employee/page-attendance-prefill-effect";
import { useEmployeeDashboardDerivedState } from "@/app/employee/page-dashboard-derived-state";
import {
  buildEmployeeRequestChecklistDefaults,
  firstDayOfMonthLocal,
  formatDateTime,
  formatDays,
  lastDayOfMonthLocal,
  resolveEmployeeAutoSnapshotLoadKey,
  resolveEmployeeProductionSessionNotices,
  todayEndLocal,
  todayStartLocal
} from "@/app/employee/page-helpers";
import {
  extractEmployeeErrorMessage,
  isDefaultEmployeeCancelReason,
  resolveEmployeeLocaleLabelBundle
} from "@/app/employee/page-locale-helpers";
import { buildEmployeeMutationRuntime } from "@/app/employee/page-mutation-runtime";
import {
  resolveAttendanceCorrectionSchedulePrefill,
  resolveEmployeeResubmitDraftPrefill
} from "@/app/employee/page-query-prefill-helpers";
import { useEmployeeRequestChecklistDerivedState } from "@/app/employee/page-request-checklist-derived-state";
import { useEmployeeRuntimeSession } from "@/app/employee/page-session-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  EmployeeDepartmentLeaveCalendarEntryDto,
  LeaveBalanceDto,
  LeaveRequestDto,
  LeaveTypeDto,
  RequestSearchScope,
  RequestSortOption,
  RequestStatusFilter,
  TimelineChannelFilter,
  WorkScheduleDto
} from "@/app/employee/page-types";
import { EmployeeAttendanceFormPanel } from "@/components/employee-dashboard/EmployeeAttendanceFormPanel";
import { EmployeeDashboardChrome } from "@/components/employee-dashboard/EmployeeDashboardChrome";
import { EmployeeLeaveCalendarPanel } from "@/components/employee-dashboard/EmployeeLeaveCalendarPanel";
import { EmployeeLeaveRequestPanel } from "@/components/employee-dashboard/EmployeeLeaveRequestPanel";
import { EmployeeWorkspaceHero } from "@/components/employee-dashboard/EmployeeWorkspaceHero";
import { resolveEmployeeWorkspaceSourceEntry } from "@/components/scheduling/employee-source-context";
import { useI18n } from "@/lib/i18n/provider";
import { useSearchParams } from "next/navigation";

type EmployeeAttendanceLeaveWorkspaceMode = "attendance" | "leave";
export type EmployeeAttendanceLeaveWorkspaceSectionMode =
  | "all"
  | "correction"
  | "request"
  | "calendar";

type EmployeeAttendanceLeaveWorkspaceClientProps = {
  mode: EmployeeAttendanceLeaveWorkspaceMode;
  sectionMode?: EmployeeAttendanceLeaveWorkspaceSectionMode;
};

export default function EmployeeAttendanceLeaveWorkspaceClient({
  mode,
  sectionMode = "all"
}: EmployeeAttendanceLeaveWorkspaceClientProps) {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const isKoLocale = locale === "ko";
  const localeLabelBundle = useMemo(
    () => resolveEmployeeLocaleLabelBundle(isKoLocale),
    [isKoLocale]
  );
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
    summaryCopy,
    surfaceCopy,
    validationCopy
  } = localeLabelBundle;
  const { attendance: attendanceCopy, leave: leaveCopy, leaveCalendar: leaveCalendarCopy, schedule: scheduleCopy, apiLogs: apiLogsCopy, sectionTitles } =
    surfaceCopy;
  const { leaveBalance: leaveBalanceCopy, leaveUnits: leaveUnitCopy } = summaryCopy;
  const {
    defaults: defaultsCopy,
    feedback: feedbackCopy,
    summaryCards: summaryCardCopy,
    requestFeedback: requestFeedbackCopy,
    correctionValidation: correctionValidationCopy,
    attendanceChecks: attendanceCheckCopy,
    leaveChecks: leaveCheckCopy,
    resubmitFlowChecks: resubmitFlowCheckCopy,
    submitChecklistCards: submitChecklistCardCopy
  } = validationCopy;

  const workspaceSourceEntry = useMemo(
    () =>
      resolveEmployeeWorkspaceSourceEntry(searchParams.get("source"), isKoLocale),
    [isKoLocale, searchParams]
  );
  const attendanceSchedulePrefill = useMemo(
    () =>
      resolveAttendanceCorrectionSchedulePrefill({
        searchParams,
        correctionRequestNote,
        isKoLocale
      }),
    [correctionRequestNote, isKoLocale, searchParams]
  );
  const resubmitDraftPrefill = useMemo(
    () => resolveEmployeeResubmitDraftPrefill(searchParams),
    [searchParams]
  );

  const appliedAttendanceSchedulePrefillRef = useRef<{
    baseKey: string | null;
    selectedTargetKey: string | null;
  }>({ baseKey: null, selectedTargetKey: null });
  const appliedResubmitDraftPrefillRef = useRef<string | null>(null);
  const autoSnapshotLoadKeyRef = useRef<string | null>(null);
  const refreshEmployeeSnapshotRef = useRef<
    null | ((range?: { fromIso: string; toIso: string }) => Promise<void>)
  >(null);

  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());
  const [checkInAt, setCheckInAt] = useState(todayStartLocal());
  const [checkOutAt, setCheckOutAt] = useState(todayEndLocal());
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [isHoliday, setIsHoliday] = useState(false);
  const [attendanceNotes, setAttendanceNotes] = useState("");
  const [lastAttendanceId, setLastAttendanceId] = useState("");
  const [selectedCorrectionRecordId, setSelectedCorrectionRecordId] =
    useState("");
  const [leaveType, setLeaveType] = useState<LeaveTypeDto>("ANNUAL");
  const [leaveUnit, setLeaveUnit] = useState<"FULL_DAY" | "HALF_DAY" | "HOUR">(
    "FULL_DAY"
  );
  const [leaveHours, setLeaveHours] = useState("4");
  const [leaveStartDate, setLeaveStartDate] = useState(firstDayOfMonthLocal());
  const [leaveEndDate, setLeaveEndDate] = useState(lastDayOfMonthLocal());
  const [leaveReason, setLeaveReason] = useState("");
  const [lastLeaveRequestId, setLastLeaveRequestId] = useState("");
  const [cancelReason, setCancelReason] = useState<string>(defaultCancelReason);
  const [attendance, setAttendance] = useState<AttendanceRecordDto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [departmentLeaveCalendarEntries, setDepartmentLeaveCalendarEntries] =
    useState<EmployeeDepartmentLeaveCalendarEntryDto[]>([]);
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceDto | null>(
    null
  );
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [, setMobileFlowFeedback] = useState("");
  const [requestFeedbackStatusFilter, setRequestFeedbackStatusFilter] =
    useState<RequestStatusFilter>("all");
  const [timelineChannelFilter, setTimelineChannelFilter] =
    useState<TimelineChannelFilter>("all");
  const [timelineStatusFilter, setTimelineStatusFilter] =
    useState<RequestStatusFilter>("all");
  const [requestSearchScope, setRequestSearchScope] =
    useState<RequestSearchScope>("all");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestSortOption, setRequestSortOption] =
    useState<RequestSortOption>("pending_first");
  const [selectedResubmitCandidateKey, setSelectedResubmitCandidateKey] =
    useState("");
  const [lastAppliedResubmitCandidateKey, setLastAppliedResubmitCandidateKey] =
    useState("");

  const toRequestStatusLabel = useCallback(
    (status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") =>
      requestStatusLabels[status],
    [requestStatusLabels]
  );
  const toLeaveTypeLabel = useCallback(
    (nextLeaveType: string) =>
      leaveTypeLabels[nextLeaveType as keyof typeof leaveTypeLabels] ??
      nextLeaveType,
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
    supabaseSessionLoading,
    employeeId,
    hasBoundEmployeeId,
    usesBearerToken
  } = useEmployeeRuntimeSession({ notConfiguredLabel });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? notConfiguredLabel;
  const { loginSessionRequiredNotice, productionEmployeeIdRequiredNotice } =
    useMemo(
      () => resolveEmployeeProductionSessionNotices(isKoLocale),
      [isKoLocale]
    );
  const requiresLoginSession =
    !supabaseSessionLoading &&
    isProductionRuntime &&
    !usesBearerToken &&
    !showDevTools;
  const requiresEmployeeIdBinding = isProductionRuntime && !showDevTools;
  const missingEmployeeIdBinding =
    requiresEmployeeIdBinding && !hasBoundEmployeeId;
  const blocksEmployeeApiActions =
    requiresLoginSession || missingEmployeeIdBinding;
  const productionSessionRequiredNotice = missingEmployeeIdBinding
    ? productionEmployeeIdRequiredNotice
    : loginSessionRequiredNotice;

  useEffect(() => {
    setCancelReason((previous) =>
      isDefaultEmployeeCancelReason(previous) ? defaultCancelReason : previous
    );
  }, [defaultCancelReason]);

  const { mutationActions, clearLogs } = buildEmployeeMutationRuntime({
    callApiLabels,
    requiresLoginSession,
    requiresEmployeeIdBinding,
    productionSessionRequiredNotice: loginSessionRequiredNotice,
    productionEmployeeIdRequiredNotice,
    runtimeLocale,
    setLogs,
    setPendingLabel,
    periodStart,
    periodEnd,
    employeeId,
    selectedCorrectionRecordId,
    lastAttendanceId,
    setAttendance,
    setLastAttendanceId,
    setSelectedCorrectionRecordId,
    setLeaveRequests,
    setDepartmentLeaveCalendarEntries,
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

  const refreshEmployeeSnapshot = useCallback(
    async (range?: { fromIso: string; toIso: string }) => {
      setSnapshotLoaded(false);
      try {
        await mutationActions.refreshEmployeeSnapshot(range);
      } finally {
        setSnapshotLoaded(true);
      }
    },
    [mutationActions]
  );
  refreshEmployeeSnapshotRef.current = refreshEmployeeSnapshot;

  const {
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
    resubmitCandidates,
    selectedResubmitCandidate,
    correctionDeltaLabel
  } = useEmployeeDashboardDerivedState({
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
  });

  const {
    requestSearchDefaultsCopy,
    mobileRequestDefaultsCopy,
    requestFailureDefaultsCopy
  } = buildEmployeeRequestChecklistDefaults({
    defaultsCopy
  });

  const requestNowMs = Date.now();

  const {
    correctionValidation,
    attendancePreSubmitChecks,
    attendancePreSubmitValid,
    leavePreSubmitChecks,
    leavePreSubmitValid
  } = useEmployeeRequestChecklistDerivedState({
    latestAttendance,
    attendance,
    leaveRequests,
    logs,
    isKoLocale,
    requestNowMs,
    requestSearchScope,
    normalizedRequestSearchQuery: requestSearchQuery.trim().toLowerCase(),
    requestSortOption,
    requestFeedbackStatusFilter,
    timelineChannelFilter,
    timelineStatusFilter,
    selectedResubmitCandidate,
    lastAppliedResubmitCandidateKey,
    lastAttendanceId,
    checkInAt,
    checkOutAt,
    breakMinutes,
    leaveType,
    leaveUnit,
    leaveHours,
    leaveStartDate,
    leaveEndDate,
    leaveBalance,
    formatDays,
    formatDateTimeByLocale,
    toLeaveTypeLabel,
    extractEmployeeErrorMessage,
    requestFeedbackCopy,
    requestFeedbackNoReasonProvided: defaultsCopy.noReasonProvided,
    requestSearchDefaultsCopy,
    mobileRequestDefaultsCopy,
    leaveUnitCopy,
    requestFailureDefaultsCopy,
    correctionValidationCopy,
    attendanceCheckCopy,
    leaveCheckCopy,
    resubmitFlowCheckCopy,
    submitChecklistCardCopy
  });

  const {
    applyAttendanceRecordToCorrectionForm,
    applyLatestAttendanceToCorrectionForm,
    applyLeaveQuickPreset,
    applyResubmitCandidateToDraft,
    applySelectedCorrectionRecord,
    moveCalendarMonth,
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
      attendanceResubmitDraftApplied:
        feedbackCopy.attendanceResubmitDraftApplied,
      clipboardUnavailable: feedbackCopy.clipboardUnavailable,
      copiedLatestFailureCause: feedbackCopy.copiedLatestFailureCause,
      copyFailureCauseFailed: feedbackCopy.copyFailureCauseFailed,
      leaveResubmitDraftApplied: feedbackCopy.leaveResubmitDraftApplied,
      noFailureCauseToCopy: feedbackCopy.noFailureCauseToCopy,
      noResubmitTarget: feedbackCopy.noResubmitTarget,
      pendingRequestFilterApplied: feedbackCopy.pendingRequestFilterApplied,
      resetResubmitSelection: feedbackCopy.resetResubmitSelection,
      selectResubmitCandidateFirst: feedbackCopy.selectResubmitCandidateFirst,
      selectedAttendanceResubmitMissing:
        feedbackCopy.selectedAttendanceResubmitMissing,
      selectedLeaveResubmitMissing:
        feedbackCopy.selectedLeaveResubmitMissing
    },
    isKoLocale,
    latestAttendance,
    leaveRequests,
    periodStart,
    refreshEmployeeSnapshot: async ({ fromIso, toIso }) => {
      await refreshEmployeeSnapshot({ fromIso, toIso });
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

  useEffect(() => {
    if (supabaseSessionLoading) {
      return;
    }
    const autoLoadKey = resolveEmployeeAutoSnapshotLoadKey({
      employeeId,
      isProductionRuntime,
      usesBearerToken
    });
    if (!autoLoadKey) {
      setSnapshotLoaded(true);
      return;
    }
    if (autoSnapshotLoadKeyRef.current === autoLoadKey) {
      return;
    }
    autoSnapshotLoadKeyRef.current = autoLoadKey;
    void refreshEmployeeSnapshotRef.current?.();
  }, [
    employeeId,
    isProductionRuntime,
    supabaseSessionLoading,
    usesBearerToken
  ]);

  useEffect(() => {
    if (!resubmitDraftPrefill) {
      appliedResubmitDraftPrefillRef.current = null;
      return;
    }
    if (appliedResubmitDraftPrefillRef.current === resubmitDraftPrefill.key) {
      return;
    }
    const matchedCandidate = resubmitCandidates.find(
      (candidate) =>
        candidate.channel === resubmitDraftPrefill.channel &&
        candidate.recordId === resubmitDraftPrefill.recordId
    );
    if (!matchedCandidate) {
      return;
    }
    setSelectedResubmitCandidateKey(matchedCandidate.key);
    applyResubmitCandidateToDraft(matchedCandidate);
    appliedResubmitDraftPrefillRef.current = resubmitDraftPrefill.key;
  }, [
    applyResubmitCandidateToDraft,
    resubmitCandidates,
    resubmitDraftPrefill
  ]);

  useApplyAttendanceSchedulePrefillEffect({
    attendanceSchedulePrefill,
    attendance,
    appliedAttendanceSchedulePrefillRef,
    setCheckInAt,
    setCheckOutAt,
    setAttendanceNotes,
    applyAttendanceRecordToCorrectionForm
  });

  if (supabaseSessionLoading) {
    return null;
  }

  const sharedPanelProps = {
    sectionTitles,
    attendanceCopy,
    leaveCopy,
    leaveCalendarCopy,
    scheduleCopy,
    apiLogsCopy,
    callApiLabels,
    listBadgeLabels,
    preSubmitStatusLabels,
    showDevTools,
    requiresLoginSession: blocksEmployeeApiActions,
    attendance,
    leaveRequests,
    schedules,
    leaveBalance,
    checkInAt,
    checkOutAt,
    breakMinutes,
    isHoliday,
    attendanceNotes,
    lastAttendanceId,
    selectedCorrectionRecordId,
    hasSelectedCorrectionRecord: selectedCorrectionRecord !== null,
    correctionDeltaLabel,
    attendancePreSubmitChecks,
    attendancePreSubmitValid,
    correctionValidationMessage: correctionValidation.message,
    correctionValidationIsValid: correctionValidation.isValid,
    latestAttendance,
    attendanceNotePresets,
    leaveType,
    leaveUnit,
    leaveHours,
    leaveStartDate,
    leaveEndDate,
    leaveReason,
    cancelReason,
    lastLeaveRequestId,
    leaveBalanceSummary,
    leavePreSubmitChecks,
    leavePreSubmitValid,
    leaveUsageRatePercent,
    leaveUsageRingStyle,
    leaveBalanceCards,
    leaveUsageProjectionLabel,
    leaveCalendarMonthLabel,
    leaveCalendarWeekdays,
    leaveCalendarCells,
    leaveCalendarRows,
    pendingLabel,
    logs,
    stats,
    latestPayload: defaultsCopy.noApiCallHistory,
    formatDateTime: formatDateTimeByLocale,
    formatDays,
    toLeaveTypeLabel,
    toRequestStatusLabel,
    onCheckInAtChange: setCheckInAt,
    onCheckOutAtChange: setCheckOutAt,
    onBreakMinutesChange: setBreakMinutes,
    onIsHolidayChange: setIsHoliday,
    onAttendanceNotesChange: setAttendanceNotes,
    onLastAttendanceIdChange: setLastAttendanceId,
    onSelectCorrectionTarget: selectCorrectionTarget,
    onCreateAttendance: () => void mutationActions.createAttendance(),
    onCheckOutNow: () => void mutationActions.checkOutNow(),
    onRequestAttendanceCorrection: () =>
      void mutationActions.requestAttendanceCorrection(),
    onApplySelectedCorrectionRecord: applySelectedCorrectionRecord,
    onApplyLatestAttendanceToCorrectionForm:
      applyLatestAttendanceToCorrectionForm,
    onApplyAttendanceRecordToCorrectionForm: applyAttendanceRecordToCorrectionForm,
    onLeaveTypeChange: setLeaveType,
    onLeaveUnitChange: setLeaveUnit,
    onLeaveHoursChange: setLeaveHours,
    onLeaveStartDateChange: setLeaveStartDate,
    onLeaveEndDateChange: setLeaveEndDate,
    onCancelReasonChange: (value: string) => setCancelReason(value),
    onLeaveReasonChange: setLeaveReason,
    onLastLeaveRequestIdChange: setLastLeaveRequestId,
    onApplyLeaveQuickPreset: applyLeaveQuickPreset,
    onCreateLeave: () => void mutationActions.createLeave(),
    onCancelLeave: () => void mutationActions.cancelLeave(),
    onPrefillLeaveFromCalendarDate: prefillLeaveFormFromCalendarDate,
    onMoveCalendarMonth: (delta: number) => void moveCalendarMonth(delta),
    onResetCalendarToCurrentMonth: () => void resetCalendarToCurrentMonth(),
    onClearLogs: clearLogs
  } as const;

  const isAttendanceWorkspace = mode === "attendance";
  const isAttendanceCorrectionWorkspace =
    isAttendanceWorkspace && sectionMode === "correction";
  const isLeaveRequestWorkspace =
    !isAttendanceWorkspace && sectionMode === "request";
  const isLeaveCalendarWorkspace =
    !isAttendanceWorkspace && sectionMode === "calendar";
  const workspaceTitle = isAttendanceWorkspace
    ? isAttendanceCorrectionWorkspace
      ? isKoLocale
        ? "근태 정정 작업면"
        : "Attendance correction workspace"
      : isKoLocale
        ? "근태 작업 워크스페이스"
        : "Attendance workspace"
    : isLeaveCalendarWorkspace
      ? isKoLocale
        ? "휴가 캘린더 작업면"
        : "Leave calendar workspace"
      : isLeaveRequestWorkspace
        ? isKoLocale
          ? "휴가 요청 작업면"
          : "Leave request workspace"
        : isKoLocale
          ? "휴가 작업 워크스페이스"
          : "Leave workspace";
  const workspaceDescription = isAttendanceWorkspace
    ? isAttendanceCorrectionWorkspace
      ? isKoLocale
        ? "해시 목적지 대신 안정적인 경로에서 근태 정정 초안과 대상 기록을 바로 이어받습니다."
        : "Continue attendance correction drafts and target-record review from a stable route instead of a hash destination."
      : isKoLocale
        ? "Today 홈과 분리된 전용 근태 작업면에서 출퇴근 기록과 정정 요청을 처리합니다."
        : "Handle attendance records and correction requests from the dedicated route instead of the Today home."
    : isLeaveCalendarWorkspace
      ? isKoLocale
        ? "휴가 캘린더를 독립 경로에서 열고 날짜 기반 휴가 초안을 바로 이어받습니다."
        : "Open the leave calendar on its own route and continue date-based leave drafts from the same workspace."
      : isLeaveRequestWorkspace
        ? isKoLocale
          ? "휴가 요청 본작업을 안정적인 경로로 열고 필요할 때 같은 화면에서 캘린더를 참고합니다."
          : "Open the primary leave request flow on a stable route and keep calendar support in the same workspace."
        : isKoLocale
          ? "Today 홈과 분리된 전용 휴가 작업면에서 요청, 잔여 연차, 캘린더 확인을 이어갑니다."
          : "Continue leave requests, balances, and calendar review from the dedicated route instead of the Today home.";
  const workspaceMetaLabel = isAttendanceWorkspace
    ? isAttendanceCorrectionWorkspace
      ? isKoLocale
        ? "대상 기록 선택과 일정 기반 정정 초안 이어받기"
        : "Target-record selection and schedule-based correction handoff"
      : isKoLocale
        ? "출퇴근 기록과 일정 기반 정정 초안 이어받기"
        : "Check-in records and schedule-based correction handoff"
    : isLeaveCalendarWorkspace
      ? isKoLocale
        ? "캘린더 확인과 날짜 기반 휴가 초안 이어받기"
        : "Calendar review and date-based leave draft handoff"
      : isLeaveRequestWorkspace
        ? isKoLocale
          ? "휴가 요청 입력과 캘린더 기반 초안 이어받기"
          : "Leave request input and calendar-based draft handoff"
        : isKoLocale
          ? "휴가 요청, 잔여 연차, 캘린더 기반 초안 이어받기"
          : "Leave requests, balances, and calendar-based draft handoff";

  return (
    <main className="saas-content workspace-shell employee-workspace-shell">
      <EmployeeWorkspaceHero
        eyebrow={isKoLocale ? "직원 작업 워크스페이스" : "Employee workspace"}
        title={workspaceTitle}
        description={workspaceDescription}
        sourceHint={workspaceSourceEntry?.hint ?? null}
        returnHref={workspaceSourceEntry?.returnHref ?? "/employee"}
        returnLabel={
          workspaceSourceEntry?.returnLabel ??
          (isKoLocale ? "Today로 돌아가기" : "Return to Today")
        }
        metaLabel={workspaceMetaLabel}
        actions={[
          {
            href: "/employee/requests?source=employee-dashboard",
            label: isKoLocale ? "요청 워크스페이스 열기" : "Open requests workspace",
            tone: "secondary"
          }
        ]}
      />

      <EmployeeDashboardChrome
        showDevTools={showDevTools}
        isKoLocale={isKoLocale}
        requiresLoginSession={blocksEmployeeApiActions}
        productionSessionRequiredNotice={productionSessionRequiredNotice}
        attendanceSummary={attendanceSummary}
        leaveBalanceLabel={
          leaveBalance
            ? leaveBalanceCopy.dayUnit(formatDays(leaveBalance.remainingDays))
            : "-"
        }
        pendingLeaveCount={pendingLeaveCount}
        stats={stats}
        pendingLabel={pendingLabel}
      />

      <section className="panel-grid workspace-panel-grid">
        {isAttendanceWorkspace ? (
          <EmployeeAttendanceFormPanel {...sharedPanelProps} />
        ) : null}
        {!isAttendanceWorkspace && !isLeaveCalendarWorkspace ? (
          <EmployeeLeaveRequestPanel {...sharedPanelProps} />
        ) : null}
        {!isAttendanceWorkspace ? (
          <EmployeeLeaveCalendarPanel {...sharedPanelProps} />
        ) : null}
        {isLeaveCalendarWorkspace ? (
          <EmployeeLeaveRequestPanel {...sharedPanelProps} />
        ) : null}
      </section>
    </main>
  );
}
