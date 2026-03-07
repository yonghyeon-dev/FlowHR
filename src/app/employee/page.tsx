"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEmployeeDashboardDerivedState } from "@/app/employee/page-dashboard-derived-state";
import { buildEmployeeMutationRuntime } from "@/app/employee/page-mutation-runtime";
import { buildEmployeeInteractionHandlers, jumpToSectionAction } from "@/app/employee/page-interaction-actions";
import { useEmployeeInteractionOrchestratorInput } from "@/app/employee/page-interaction-orchestrator";
import {
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
import { EmployeeAttendanceLeavePanels } from "@/components/employee-dashboard/EmployeeAttendanceLeavePanels";
import { EmployeeDashboardChrome } from "@/components/employee-dashboard/EmployeeDashboardChrome";
import { EmployeeRequestFeedbackPanels } from "@/components/employee-dashboard/EmployeeRequestFeedbackPanels";
import { EmployeeResubmitPanel } from "@/components/employee-dashboard/EmployeeResubmitPanel";
import { useI18n } from "@/lib/i18n/provider";
import { useSearchParams } from "next/navigation";
export default function EmployeeSelfServicePage() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const localeLabelBundle = useMemo(() => resolveEmployeeLocaleLabelBundle(isKoLocale), [isKoLocale]);
  const { attendanceNotePresets, callApiLabels, correctionRequestNote, defaultCancelReason, leaveCalendarWeekdays, leaveTypeLabels, listBadgeLabels, notConfiguredLabel, preSubmitStatusLabels, requestStatusLabels, runtimeLocale, surfaceCopy, validationCopy, summaryCopy } = localeLabelBundle;
  const searchParams = useSearchParams();
  const attendanceSchedulePrefill = useMemo(() => resolveAttendanceCorrectionSchedulePrefill({ searchParams, correctionRequestNote, isKoLocale }), [searchParams, correctionRequestNote, isKoLocale]);
  const focusSectionId = useMemo(() => resolveEmployeeFocusSectionId(searchParams), [searchParams]);
  const appliedAttendanceSchedulePrefillRef = useRef<{ baseKey: string | null; selectedTargetKey: string | null }>({ baseKey: null, selectedTargetKey: null });
  const appliedFocusSectionRef = useRef<string | null>(null);
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
  const { showDevTools, isProductionRuntime, supabaseSession, supabaseSessionError, supabaseSessionLoading, organizationId, employeeId, hasBoundEmployeeId, usesBearerToken } = useEmployeeRuntimeSession({ notConfiguredLabel });
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
    if (!focusSectionId) {
      appliedFocusSectionRef.current = null;
      return;
    }
    if (!snapshotLoaded || appliedFocusSectionRef.current === focusSectionId) {
      return;
    }
    appliedFocusSectionRef.current = focusSectionId;
    jumpToSectionAction(focusSectionId, 0, "instant");
  }, [focusSectionId, snapshotLoaded]);
  useApplyAttendanceSchedulePrefillEffect({ attendanceSchedulePrefill, attendance, appliedAttendanceSchedulePrefillRef, setCheckInAt, setCheckOutAt, setAttendanceNotes, applyAttendanceRecordToCorrectionForm });

  if (supabaseSessionLoading) return null;

  return (
    <main className="saas-content">
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
        <EmployeeAccountOverviewPanels
          isKoLocale={isKoLocale}
          showDevTools={showDevTools}
          isProductionRuntime={isProductionRuntime}
          usesBearerToken={usesBearerToken}
          requiresLoginSession={blocksEmployeeApiActions}
          supabaseSession={supabaseSession}
          supabaseSessionError={supabaseSessionError}
          organizationId={organizationId}
          employeeId={employeeId}
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
          onResetRequestSearchFilters={() => resetEmployeeRequestSearchFilters({ setRequestSearchScope, setRequestSearchQuery, setRequestSortOption })}
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
          requiresLoginSession={blocksEmployeeApiActions}
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
