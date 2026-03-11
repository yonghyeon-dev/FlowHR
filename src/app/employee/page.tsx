"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useEmployeeDashboardDerivedState } from "@/app/employee/page-dashboard-derived-state";
import {
  hasSettledSectionJumpAction,
  jumpToSectionAction,
  syncSectionHashAction
} from "@/app/employee/page-interaction-actions";
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
  resolveEmployeeFocusSectionId,
  resolveEmployeePromotedRouteForFocusSection
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
import { EmployeeAccountOverviewPanels } from "@/components/employee-dashboard/EmployeeAccountOverviewPanels";
import { EmployeeApiLogsPanel } from "@/components/employee-dashboard/EmployeeApiLogsPanel";
import { EmployeeDashboardChrome } from "@/components/employee-dashboard/EmployeeDashboardChrome";
import { EmployeeScheduleSummaryPanel } from "@/components/employee-dashboard/EmployeeScheduleSummaryPanel";
import { useI18n } from "@/lib/i18n/provider";

const FOCUS_SECTION_RETRY_INTERVAL_MS = 120;
const FOCUS_SECTION_OBSERVER_TIMEOUT_MS = 8000;

function EmployeeSelfServicePage() {
  const { locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKoLocale = locale === "ko";
  const localeLabelBundle = useMemo(
    () => resolveEmployeeLocaleLabelBundle(isKoLocale),
    [isKoLocale]
  );
  const {
    callApiLabels,
    correctionRequestNote,
    defaultCancelReason,
    leaveTypeLabels,
    listBadgeLabels,
    notConfiguredLabel,
    runtimeLocale,
    surfaceCopy,
    validationCopy,
    summaryCopy
  } = localeLabelBundle;
  const focusSectionId = useMemo(
    () => resolveEmployeeFocusSectionId(searchParams),
    [searchParams]
  );
  const promotedRouteForFocusSection = useMemo(
    () => resolveEmployeePromotedRouteForFocusSection(focusSectionId),
    [focusSectionId]
  );
  const appliedFocusSectionRef = useRef<string | null>(null);
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
  const [leaveStartDate, setLeaveStartDate] = useState(todayStartLocal());
  const [leaveEndDate, setLeaveEndDate] = useState(todayEndLocal());
  const [leaveReason, setLeaveReason] = useState("");
  const [lastLeaveRequestId, setLastLeaveRequestId] = useState("");
  const [cancelReason, setCancelReason] = useState<string>(defaultCancelReason);
  const [attendance, setAttendance] = useState<AttendanceRecordDto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [departmentLeaveCalendarEntries, setDepartmentLeaveCalendarEntries] =
    useState<EmployeeDepartmentLeaveCalendarEntryDto[]>([]);
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceDto | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [selectedResubmitCandidateKey, setSelectedResubmitCandidateKey] =
    useState("");

  const requestFeedbackStatusFilter: RequestStatusFilter = "all";
  const timelineChannelFilter: TimelineChannelFilter = "all";
  const timelineStatusFilter: RequestStatusFilter = "all";
  const requestSearchScope: RequestSearchScope = "all";
  const requestSearchQuery = "";
  const requestSortOption: RequestSortOption = "pending_first";
  const lastAppliedResubmitCandidateKey = "";
  const selectedResubmitCandidate = null;
  const normalizedRequestSearchQuery = requestSearchQuery.trim().toLowerCase();
  const requestNowMs = Date.now();

  const toLeaveTypeLabel = useCallback(
    (value: string) =>
      leaveTypeLabels[value as keyof typeof leaveTypeLabels] ?? value,
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

  const { sectionTitles, apiLogs: apiLogsCopy } = surfaceCopy;
  const { leaveBalance: leaveBalanceCopy, leaveUnits: leaveUnitCopy } =
    summaryCopy;
  const {
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
      isDefaultEmployeeCancelReason(previous)
        ? defaultCancelReason
        : previous
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
    latestPayload,
    stats,
    pendingLeaveCount,
    latestAttendance,
    attendanceSummary,
    integratedSummaryCards
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
    attendanceCopy: surfaceCopy.attendance,
    formatDays,
    formatDateTimeByLocale,
    toLeaveTypeLabel
  });

  const {
    requestSearchDefaultsCopy,
    mobileRequestDefaultsCopy,
    requestFailureDefaultsCopy
  } = buildEmployeeRequestChecklistDefaults({ defaultsCopy });

  const { integratedSubmitChecklistCards } =
    useEmployeeRequestChecklistDerivedState({
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

  const jumpToSection = useCallback((sectionId: string) => {
    jumpToSectionAction(sectionId);
  }, []);

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
    if (!promotedRouteForFocusSection) {
      return;
    }
    router.replace(promotedRouteForFocusSection);
  }, [promotedRouteForFocusSection, router]);

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
    observer.observe(document.body, { childList: true, subtree: true });
    ensureFocusSectionVisible();

    return () => {
      cancelled = true;
      stopTracking();
    };
  }, [focusSectionId, promotedRouteForFocusSection, snapshotLoaded]);

  if (supabaseSessionLoading) {
    return null;
  }

  const apiLogsPanelProps = {
    sectionTitles,
    apiLogsCopy,
    callApiLabels,
    listBadgeLabels,
    pendingLabel,
    logs,
    stats,
    latestPayload,
    onClearLogs: clearLogs
  } as const;

  return (
    <main className="saas-content employee-home-shell">
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
        variant="home"
      />
      <section className="panel-grid employee-home-panel-grid">
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
        <EmployeeScheduleSummaryPanel
          isKoLocale={isKoLocale}
          schedules={schedules}
          formatDateTime={formatDateTimeByLocale}
        />
        {showDevTools ? <EmployeeApiLogsPanel {...apiLogsPanelProps} /> : null}
      </section>
    </main>
  );
}

export default function EmployeeSelfServiceHomePage() {
  return <EmployeeSelfServicePage />;
}
