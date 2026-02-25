"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { performEmployeeApiCall } from "@/app/employee/page-api-helpers";
import { useEmployeeDashboardDerivedState } from "@/app/employee/page-dashboard-derived-state";
import { buildEmployeeMutationActions } from "@/app/employee/page-mutation-actions";
import {
  buildEmployeeInteractionHandlers
} from "@/app/employee/page-interaction-actions";
import { useEmployeeRequestChecklistDerivedState } from "@/app/employee/page-request-checklist-derived-state";
import {
  buildQuery,
  coerceNumber,
  firstDayOfMonthLocal,
  formatDateTime,
  formatDays,
  lastDayOfMonthLocal,
  statusToTone,
  todayEndLocal,
  todayStartLocal,
  toIso
} from "@/app/employee/page-helpers";
import {
  extractEmployeeErrorMessage,
  isDefaultEmployeeCancelReason,
  resolveEmployeeLocaleLabelBundle
} from "@/app/employee/page-locale-helpers";
import { useEmployeeRuntimeSession } from "@/app/employee/page-session-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  LeaveBalanceDto,
  LeaveRequestDto,
  RequestSearchScope,
  RequestSortOption,
  RequestStatusFilter,
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
    requestSearchDefaultsCopy: {
      noNote: defaultsCopy.noNote,
      noReason: defaultsCopy.noReason
    },
    mobileRequestDefaultsCopy: {
      attendanceRequestTitle: defaultsCopy.attendanceRequestTitle,
      leaveRequestTitle: defaultsCopy.leaveRequestTitle
    },
    leaveUnitCopy,
    requestFailureDefaultsCopy: {
      attendanceRejectedSource: defaultsCopy.attendanceRejectedSource,
      leaveRejectedSource: defaultsCopy.leaveRejectedSource,
      leaveCanceledSource: defaultsCopy.leaveCanceledSource,
      rejectionReasonMissing: defaultsCopy.rejectionReasonMissing,
      reasonMissing: defaultsCopy.reasonMissing
    },
    correctionValidationCopy,
    attendanceCheckCopy,
    leaveCheckCopy,
    resubmitFlowCheckCopy,
    submitChecklistCardCopy
  });

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


