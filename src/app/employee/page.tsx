"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEmployeeDashboardDerivedState } from "@/app/employee/page-dashboard-derived-state";
import { buildEmployeeMutationRuntime } from "@/app/employee/page-mutation-runtime";
import {
  buildEmployeeInteractionHandlers,
  hasSettledSectionJumpAction,
  jumpToSectionAction,
  syncSectionHashAction
} from "@/app/employee/page-interaction-actions";
import { useEmployeeInteractionOrchestratorInput } from "@/app/employee/page-interaction-orchestrator";
import {
  resolveEmployeePromotedRouteForFocusSection,
  resolveEmployeeResubmitDraftPrefill,
  resolveAttendanceCorrectionSchedulePrefill,
  resolveEmployeeFocusSectionId
} from "@/app/employee/page-query-prefill-helpers";
import { useEmployeeRequestChecklistDerivedState } from "@/app/employee/page-request-checklist-derived-state";
import { buildEmployeeInteractionSetterBundles } from "@/app/employee/page-interaction-setter-bundles";
import {
  buildEmployeeRequestChecklistDefaults,
  firstDayOfMonthLocal,
  formatDateTime,
  formatDays,
  lastDayOfMonthLocal,
  resetEmployeeRequestSearchFilters,
  resolveEmployeeAutoSnapshotLoadKey,
  resolveEmployeeProductionSessionNotices,
  statusToTone,
  todayEndLocal,
  todayStartLocal
} from "@/app/employee/page-helpers";
import {
  extractEmployeeErrorMessage,
  isDefaultEmployeeCancelReason,
  resolveEmployeeLocaleLabelBundle
} from "@/app/employee/page-locale-helpers";
import { useEmployeeRuntimeSession } from "@/app/employee/page-session-helpers";
import { useApplyAttendanceSchedulePrefillEffect } from "@/app/employee/page-attendance-prefill-effect";
import type {
  ApiLog,
  AttendanceRecordDto,
  EmployeeDepartmentLeaveCalendarEntryDto,
  LeaveBalanceDto,
  LeaveTypeDto,
  LeaveRequestDto,
  RequestSearchScope,
  RequestSortOption,
  RequestStatusFilter,
  TimelineChannelFilter,
  WorkScheduleDto
} from "@/app/employee/page-types";
import { EmployeeAccountOverviewPanels } from "@/components/employee-dashboard/EmployeeAccountOverviewPanels";
import { EmployeeApiLogsPanel } from "@/components/employee-dashboard/EmployeeApiLogsPanel";
import { EmployeeAttendanceFormPanel } from "@/components/employee-dashboard/EmployeeAttendanceFormPanel";
import { EmployeeDashboardChrome } from "@/components/employee-dashboard/EmployeeDashboardChrome";
import { EmployeeLeaveCalendarPanel } from "@/components/employee-dashboard/EmployeeLeaveCalendarPanel";
import { EmployeeLeaveRequestPanel } from "@/components/employee-dashboard/EmployeeLeaveRequestPanel";
import { EmployeeScheduleSummaryPanel } from "@/components/employee-dashboard/EmployeeScheduleSummaryPanel";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter, useSearchParams } from "next/navigation";

const FOCUS_SECTION_RETRY_TIMEOUT_MS = 3500;
const FOCUS_SECTION_RETRY_INTERVAL_MS = 120;
const FOCUS_SECTION_OBSERVER_TIMEOUT_MS = 8000;

export type EmployeeSelfServicePageMode = "home" | "attendance" | "leave";

type EmployeeSelfServicePageProps = {
  mode?: EmployeeSelfServicePageMode;
};

export function EmployeeSelfServicePage({
  mode = "home"
}: EmployeeSelfServicePageProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const isKoLocale = locale === "ko";
  const localeLabelBundle = useMemo(() => resolveEmployeeLocaleLabelBundle(isKoLocale), [isKoLocale]);
  const { attendanceNotePresets, callApiLabels, correctionRequestNote, defaultCancelReason, leaveCalendarWeekdays, leaveTypeLabels, listBadgeLabels, notConfiguredLabel, preSubmitStatusLabels, requestStatusLabels, runtimeLocale, surfaceCopy, validationCopy, summaryCopy } = localeLabelBundle;
  const searchParams = useSearchParams();
  const attendanceSchedulePrefill = useMemo(() => resolveAttendanceCorrectionSchedulePrefill({ searchParams, correctionRequestNote, isKoLocale }), [searchParams, correctionRequestNote, isKoLocale]);
  const focusSectionId = useMemo(() => resolveEmployeeFocusSectionId(searchParams), [searchParams]);
  const promotedRouteForFocusSection = useMemo(
    () => resolveEmployeePromotedRouteForFocusSection(focusSectionId),
    [focusSectionId]
  );
  const resubmitDraftPrefill = useMemo(
    () => resolveEmployeeResubmitDraftPrefill(searchParams),
    [searchParams]
  );
  const appliedAttendanceSchedulePrefillRef = useRef<{ baseKey: string | null; selectedTargetKey: string | null }>({ baseKey: null, selectedTargetKey: null });
  const appliedFocusSectionRef = useRef<string | null>(null);
  const appliedResubmitDraftPrefillRef = useRef<string | null>(null);
  const autoSnapshotLoadKeyRef = useRef<string | null>(null);
  const refreshEmployeeSnapshotRef = useRef<null | ((range?: { fromIso: string; toIso: string }) => Promise<void>)>(null);
  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());
  const [checkInAt, setCheckInAt] = useState(todayStartLocal());
  const [checkOutAt, setCheckOutAt] = useState(todayEndLocal());
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [isHoliday, setIsHoliday] = useState(false);
  const [attendanceNotes, setAttendanceNotes] = useState("");
  const [lastAttendanceId, setLastAttendanceId] = useState("");
  const [selectedCorrectionRecordId, setSelectedCorrectionRecordId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveTypeDto>("ANNUAL");
  const [leaveUnit, setLeaveUnit] = useState<"FULL_DAY" | "HALF_DAY" | "HOUR">("FULL_DAY");
  const [leaveHours, setLeaveHours] = useState("4");
  const [leaveStartDate, setLeaveStartDate] = useState(todayStartLocal());
  const [leaveEndDate, setLeaveEndDate] = useState(todayEndLocal());
  const [leaveReason, setLeaveReason] = useState("");
  const [lastLeaveRequestId, setLastLeaveRequestId] = useState("");
  const [cancelReason, setCancelReason] = useState<string>(defaultCancelReason);
  const [attendance, setAttendance] = useState<AttendanceRecordDto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [departmentLeaveCalendarEntries, setDepartmentLeaveCalendarEntries] = useState<EmployeeDepartmentLeaveCalendarEntryDto[]>([]);
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceDto | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [, setMobileFlowFeedback] = useState("");
  const [requestFeedbackStatusFilter, setRequestFeedbackStatusFilter] = useState<RequestStatusFilter>("all");
  const [timelineChannelFilter, setTimelineChannelFilter] = useState<TimelineChannelFilter>("all");
  const [timelineStatusFilter, setTimelineStatusFilter] = useState<RequestStatusFilter>("all");
  const [requestSearchScope, setRequestSearchScope] = useState<RequestSearchScope>("all");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestSortOption, setRequestSortOption] = useState<RequestSortOption>("pending_first");
  const [selectedResubmitCandidateKey, setSelectedResubmitCandidateKey] = useState("");
  const [lastAppliedResubmitCandidateKey, setLastAppliedResubmitCandidateKey] = useState("");
  const toRequestStatusLabel = useCallback((status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") => requestStatusLabels[status], [requestStatusLabels]);
  const toLeaveTypeLabel = useCallback((leaveType: string) => leaveTypeLabels[leaveType as keyof typeof leaveTypeLabels] ?? leaveType, [leaveTypeLabels]);
  const formatDateTimeByLocale = useCallback((value: string | null) => formatDateTime(value, runtimeLocale), [runtimeLocale]);
  const { showDevTools, isProductionRuntime, supabaseSession, supabaseSessionError, supabaseSessionLoading, employeeId, hasBoundEmployeeId, usesBearerToken } = useEmployeeRuntimeSession({ notConfiguredLabel });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? notConfiguredLabel;
  const { loginSessionRequiredNotice, productionEmployeeIdRequiredNotice } = useMemo(() => resolveEmployeeProductionSessionNotices(isKoLocale), [isKoLocale]);
  const requiresLoginSession = !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;
  const requiresEmployeeIdBinding = isProductionRuntime && !showDevTools;
  const missingEmployeeIdBinding = requiresEmployeeIdBinding && !hasBoundEmployeeId;
  const blocksEmployeeApiActions = requiresLoginSession || missingEmployeeIdBinding;
  const productionSessionRequiredNotice = missingEmployeeIdBinding
    ? productionEmployeeIdRequiredNotice
    : loginSessionRequiredNotice;
  const requestNowMs = Date.now();
  const normalizedRequestSearchQuery = requestSearchQuery.trim().toLowerCase();
  const { sectionTitles, attendance: attendanceCopy, leave: leaveCopy, leaveCalendar: leaveCalendarCopy, schedule: scheduleCopy, apiLogs: apiLogsCopy } = surfaceCopy;
  const { leaveBalance: leaveBalanceCopy, leaveUnits: leaveUnitCopy } = summaryCopy;
  const { feedback: feedbackCopy, defaults: defaultsCopy, summaryCards: summaryCardCopy, requestFeedback: requestFeedbackCopy, correctionValidation: correctionValidationCopy, attendanceChecks: attendanceCheckCopy, leaveChecks: leaveCheckCopy, resubmitFlowChecks: resubmitFlowCheckCopy, submitChecklistCards: submitChecklistCardCopy } = validationCopy;
  useEffect(() => {
    setCancelReason((previous) => (isDefaultEmployeeCancelReason(previous) ? defaultCancelReason : previous));
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
    resubmitCandidates,
    selectedResubmitCandidate,
    integratedSummaryCards,
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
  const { requestSearchDefaultsCopy, mobileRequestDefaultsCopy, requestFailureDefaultsCopy } = buildEmployeeRequestChecklistDefaults({ defaultsCopy });
  const {
    filteredRequestFeedbackRows,
    filteredRequestSearchRows,
    filteredMobileRequestTimeline,
    requestFailureCauses,
    latestFailureCauseMessage,
    correctionValidation,
    attendancePreSubmitChecks,
    attendancePreSubmitValid,
    leavePreSubmitChecks,
    leavePreSubmitValid,
    resubmitFlowChecks,
    integratedSubmitChecklistCards
  } = useEmployeeRequestChecklistDerivedState({
    latestAttendance,
    attendance,
    leaveRequests,
    logs,
    isKoLocale,
    requestNowMs,
    requestSearchScope,
    normalizedRequestSearchQuery,
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
    attendanceInteractionSetters,
    leaveInteractionSetters,
    requestInteractionSetters,
    periodInteractionSetters
  } = buildEmployeeInteractionSetterBundles({
    setAttendanceNotes,
    setBreakMinutes,
    setCheckInAt,
    setCheckOutAt,
    setIsHoliday,
    setLastAttendanceId,
    setSelectedCorrectionRecordId,
    setLastLeaveRequestId,
    setLeaveEndDate,
    setLeaveHours,
    setLeaveReason,
    setLeaveStartDate,
    setLeaveType,
    setLeaveUnit,
    setLastAppliedResubmitCandidateKey,
    setMobileFlowFeedback,
    setRequestSearchQuery,
    setRequestSearchScope,
    setRequestSortOption,
    setSelectedResubmitCandidateKey,
    setPeriodEnd,
    setPeriodStart
  });
  const interactionOrchestratorInput = useEmployeeInteractionOrchestratorInput({
    attendance,
    correctionRequestNote,
    defaultsCopy,
    feedbackCopy,
    isKoLocale,
    latestAttendance,
    leaveRequests,
    periodStart,
    refreshEmployeeSnapshot,
    resubmitCandidates,
    selectedCorrectionRecord,
    selectedResubmitCandidate,
    attendanceInteractionSetters,
    leaveInteractionSetters,
    requestInteractionSetters,
    periodInteractionSetters
  });
  const { applyAttendanceRecordToCorrectionForm, applyLatestAttendanceToCorrectionForm, applyLatestResubmitCandidate, applyLeaveQuickPreset, applyResubmitCandidateToDraft, applySelectedCorrectionRecord, applySelectedResubmitCandidate, clearResubmitSelection, copyFailureCause, jumpToSection, moveCalendarMonth, openPendingRequestSearch, prefillLeaveFormFromCalendarDate, resetCalendarToCurrentMonth, selectCorrectionTarget } = buildEmployeeInteractionHandlers({
    ...interactionOrchestratorInput
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
  }, [employeeId, isProductionRuntime, supabaseSessionLoading, usesBearerToken]);

  useEffect(() => {
    if (mode !== "home" || !promotedRouteForFocusSection) {
      return;
    }
    router.replace(promotedRouteForFocusSection);
  }, [mode, promotedRouteForFocusSection, router]);

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

  useEffect(() => {
    if (!focusSectionId || promotedRouteForFocusSection) {
      appliedFocusSectionRef.current = null;
      return;
    }
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }
    if (
      appliedFocusSectionRef.current === focusSectionId &&
      hasSettledSectionJumpAction(focusSectionId)
    ) {
      return;
    }

    let cancelled = false;
    let retryTimeoutId: number | null = null;
    let observer: MutationObserver | null = null;
    const startedAt = window.performance.now();

    const clearRetryTimeout = () => {
      if (retryTimeoutId !== null) {
        window.clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
    };

    const stopTracking = () => {
      clearRetryTimeout();
      observer?.disconnect();
      observer = null;
    };

    const hasTimedOut = () =>
      window.performance.now() - startedAt >= FOCUS_SECTION_OBSERVER_TIMEOUT_MS;

    const ensureFocusSectionVisible = () => {
      if (cancelled) {
        return;
      }
      if (hasSettledSectionJumpAction(focusSectionId)) {
        appliedFocusSectionRef.current = focusSectionId;
        stopTracking();
        return;
      }
      if (hasTimedOut()) {
        stopTracking();
        return;
      }
      syncSectionHashAction(focusSectionId);
      jumpToSectionAction(focusSectionId, 0, "instant");
      clearRetryTimeout();
      retryTimeoutId = window.setTimeout(
        ensureFocusSectionVisible,
        FOCUS_SECTION_RETRY_INTERVAL_MS
      );
    };

    appliedFocusSectionRef.current = null;
    observer = new MutationObserver(() => {
      if (
        cancelled ||
        appliedFocusSectionRef.current === focusSectionId ||
        hasTimedOut()
      ) {
        return;
      }
      ensureFocusSectionVisible();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    ensureFocusSectionVisible();

    return () => {
      cancelled = true;
      stopTracking();
    };
  }, [focusSectionId, promotedRouteForFocusSection, snapshotLoaded]);
  useApplyAttendanceSchedulePrefillEffect({ attendanceSchedulePrefill, attendance, appliedAttendanceSchedulePrefillRef, setCheckInAt, setCheckOutAt, setAttendanceNotes, applyAttendanceRecordToCorrectionForm });

  if (supabaseSessionLoading) return null;

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
    latestPayload,
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
    onRequestAttendanceCorrection: () => void mutationActions.requestAttendanceCorrection(),
    onApplySelectedCorrectionRecord: applySelectedCorrectionRecord,
    onApplyLatestAttendanceToCorrectionForm: applyLatestAttendanceToCorrectionForm,
    onApplyAttendanceRecordToCorrectionForm: applyAttendanceRecordToCorrectionForm,
    onLeaveTypeChange: setLeaveType,
    onLeaveUnitChange: setLeaveUnit,
    onLeaveHoursChange: setLeaveHours,
    onLeaveStartDateChange: setLeaveStartDate,
    onLeaveEndDateChange: setLeaveEndDate,
    onCancelReasonChange: setCancelReason,
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

  const showsHomeHub = mode === "home";
  const showsAttendanceWorkspace = mode === "attendance";
  const showsLeaveWorkspace = mode === "leave";

  return (
    <main className="saas-content">
      {!showsHomeHub ? (
        <section className="hero-panel">
          <p className="eyebrow">{isKoLocale ? "직원 작업 워크스페이스" : "Employee workspace"}</p>
          <h1>{showsAttendanceWorkspace ? (isKoLocale ? "근태 작업 워크스페이스" : "Attendance workspace") : isKoLocale ? "휴가 작업 워크스페이스" : "Leave workspace"}</h1>
          <p className="hero-copy">
            {showsAttendanceWorkspace
              ? isKoLocale
                ? "Today 홈에서 분리한 출퇴근 기록과 정정 요청을 이 전용 경로에서 처리합니다."
                : "Handle check-in, check-out, and correction work from this dedicated route instead of the Today home."
              : isKoLocale
                ? "Today 홈에서 분리한 휴가 요청과 캘린더 확인을 이 전용 경로에서 처리합니다."
                : "Handle leave requests and calendar review from this dedicated route instead of the Today home."}
          </p>
          <div className="hero-meta">
            <span>
              {showsAttendanceWorkspace
                ? isKoLocale
                  ? "출퇴근 기록과 일정 기반 정정 초안 이어받기"
                  : "Check-in records and schedule-based correction handoff"
                : isKoLocale
                  ? "휴가 요청, 잔여 연차, 캘린더 기반 초안 이어받기"
                  : "Leave requests, balances, and calendar-based draft handoff"}
            </span>
            <button className="btn btn-primary" type="button" onClick={() => router.push("/employee")}>
              {isKoLocale ? "Today로 돌아가기" : "Return to Today"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => router.push("/employee/requests")}>
              {isKoLocale ? "요청 워크스페이스 열기" : "Open requests workspace"}
            </button>
          </div>
        </section>
      ) : null}
      <EmployeeDashboardChrome
        showDevTools={showDevTools}
        isKoLocale={isKoLocale}
        requiresLoginSession={blocksEmployeeApiActions}
        productionSessionRequiredNotice={productionSessionRequiredNotice}
        attendanceSummary={attendanceSummary}
        leaveBalanceLabel={leaveBalance ? leaveBalanceCopy.dayUnit(formatDays(leaveBalance.remainingDays)) : "-"}
        pendingLeaveCount={pendingLeaveCount}
        stats={stats}
        pendingLabel={pendingLabel}
      />
      <section className="panel-grid">
        {showsHomeHub ? (
          <EmployeeAccountOverviewPanels
            isKoLocale={isKoLocale}
            showDevTools={showDevTools}
            isProductionRuntime={isProductionRuntime}
            usesBearerToken={usesBearerToken}
            requiresLoginSession={blocksEmployeeApiActions}
            supabaseSession={supabaseSession}
            supabaseSessionError={supabaseSessionError}
            periodStart={periodStart}
            periodEnd={periodEnd}
            supabaseUrl={supabaseUrl}
            integratedSummaryCards={integratedSummaryCards}
            integratedSubmitChecklistCards={integratedSubmitChecklistCards}
            onPeriodStartChange={setPeriodStart}
            onPeriodEndChange={setPeriodEnd}
            onRefreshEmployeeSnapshot={() => void refreshEmployeeSnapshot()}
            onJumpToSection={jumpToSection}
          />
        ) : null}
        {showsAttendanceWorkspace ? <EmployeeAttendanceFormPanel {...sharedPanelProps} /> : null}
        {showsLeaveWorkspace ? <EmployeeLeaveRequestPanel {...sharedPanelProps} /> : null}
        {showsLeaveWorkspace ? <EmployeeLeaveCalendarPanel {...sharedPanelProps} /> : null}
        {showsHomeHub ? (
          <EmployeeScheduleSummaryPanel
            isKoLocale={isKoLocale}
            schedules={schedules}
            formatDateTime={formatDateTimeByLocale}
          />
        ) : null}
        {showsHomeHub && showDevTools ? <EmployeeApiLogsPanel {...sharedPanelProps} /> : null}
      </section>
    </main>
  );
}

export default function EmployeeSelfServiceHomePage() {
  return <EmployeeSelfServicePage mode="home" />;
}
