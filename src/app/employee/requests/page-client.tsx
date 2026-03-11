"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { refreshEmployeeSnapshotFromHelper } from "@/app/employee/page-action-helpers";
import { performEmployeeApiCall } from "@/app/employee/page-api-helpers";
import { useEmployeeDashboardDerivedState } from "@/app/employee/page-dashboard-derived-state";
import {
  buildEmployeeRequestChecklistDefaults,
  buildQuery,
  firstDayOfMonthLocal,
  formatDays,
  formatDateTime,
  lastDayOfMonthLocal,
  resetEmployeeRequestSearchFilters,
  resolveEmployeeAutoSnapshotLoadKey,
  statusToTone
} from "@/app/employee/page-helpers";
import {
  extractEmployeeErrorMessage,
  resolveEmployeeLocaleLabelBundle
} from "@/app/employee/page-locale-helpers";
import { useEmployeeRequestChecklistDerivedState } from "@/app/employee/page-request-checklist-derived-state";
import { useEmployeeRuntimeSession } from "@/app/employee/page-session-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  EmployeeDepartmentLeaveCalendarEntryDto,
  LeaveBalanceDto,
  LeaveRequestDto,
  RequestSearchScope,
  RequestSortOption,
  RequestStatusFilter,
  TimelineChannelFilter
} from "@/app/employee/page-types";
import { jumpToSectionAction } from "@/app/employee/page-interaction-actions";
import { EmployeeRequestFeedbackPanels } from "@/components/employee-dashboard/EmployeeRequestFeedbackPanels";
import { EmployeeRequestsResubmitWorkspacePanel } from "@/components/employee-dashboard/EmployeeRequestsResubmitWorkspacePanel";

type EmployeeRequestsPageClientProps = {
  locale: "ko" | "en";
  sectionMode?: "all" | "monitoring" | "resubmit";
};

export type EmployeeRequestsSectionMode = "all" | "monitoring" | "resubmit";

export default function EmployeeRequestsPageClient({
  locale,
  sectionMode = "all"
}: EmployeeRequestsPageClientProps) {
  const isKoLocale = locale === "ko";
  const localeLabelBundle = useMemo(
    () => resolveEmployeeLocaleLabelBundle(isKoLocale),
    [isKoLocale]
  );
  const {
    callApiLabels,
    defaultCancelReason,
    leaveTypeLabels,
    listBadgeLabels,
    notConfiguredLabel,
    requestStatusLabels,
    runtimeLocale,
    validationCopy,
    summaryCopy,
    surfaceCopy
  } = localeLabelBundle;
  const { feedback: feedbackCopy, defaults: defaultsCopy, summaryCards: summaryCardCopy, requestFeedback: requestFeedbackCopy, correctionValidation: correctionValidationCopy, attendanceChecks: attendanceCheckCopy, leaveChecks: leaveCheckCopy, resubmitFlowChecks: resubmitFlowCheckCopy, submitChecklistCards: submitChecklistCardCopy } =
    validationCopy;
  const { leaveBalance: leaveBalanceCopy, leaveUnits: leaveUnitCopy } = summaryCopy;
  const { attendance: attendanceCopy } = surfaceCopy;
  const [periodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd] = useState(lastDayOfMonthLocal());
  const [attendance, setAttendance] = useState<AttendanceRecordDto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [departmentLeaveCalendarEntries, setDepartmentLeaveCalendarEntries] =
    useState<EmployeeDepartmentLeaveCalendarEntryDto[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceDto | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [lastAttendanceId, setLastAttendanceId] = useState("");
  const [selectedCorrectionRecordId, setSelectedCorrectionRecordId] = useState("");
  const [selectedResubmitCandidateKey, setSelectedResubmitCandidateKey] = useState("");
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
  const autoSnapshotLoadKeyRef = useRef<string | null>(null);
  const toRequestStatusLabel = useCallback(
    (status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") =>
      requestStatusLabels[status],
    [requestStatusLabels]
  );
  const toLeaveTypeLabel = useCallback(
    (leaveType: string) =>
      leaveTypeLabels[leaveType as keyof typeof leaveTypeLabels] ?? leaveType,
    [leaveTypeLabels]
  );
  const formatDateTimeByLocale = useCallback(
    (value: string | null) => formatDateTime(value, runtimeLocale),
    [runtimeLocale]
  );
  const {
    showDevTools,
    isProductionRuntime,
    supabaseSessionLoading,
    employeeId,
    hasBoundEmployeeId,
    usesBearerToken
  } = useEmployeeRuntimeSession({ notConfiguredLabel });
  const requiresLoginSession =
    !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;
  const requiresEmployeeIdBinding = isProductionRuntime && !showDevTools;
  const missingEmployeeIdBinding =
    requiresEmployeeIdBinding && !hasBoundEmployeeId;
  const normalizedRequestSearchQuery = requestSearchQuery.trim().toLowerCase();
  const requestNowMs = Date.now();
  const { requestSearchDefaultsCopy, mobileRequestDefaultsCopy, requestFailureDefaultsCopy } =
    buildEmployeeRequestChecklistDefaults({ defaultsCopy });

  const callApi = useCallback(
    async (
      label: string,
      method: "GET" | "POST" | "PUT" | "PATCH",
      path: string,
      payload?: Record<string, unknown>
    ) => {
      if (requiresLoginSession) {
        const body = {
          error: isKoLocale
            ? "로그인 세션이 필요합니다."
            : "A login session is required.",
          reason: "requires_login_session"
        };
        const log: ApiLog = {
          id: Date.now(),
          label,
          status: 401,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString(runtimeLocale),
          body
        };
        setLogs((previous) => [log, ...previous]);
        return {
          response: new Response(JSON.stringify(body), {
            status: 401,
            headers: { "content-type": "application/json" }
          }),
          body
        };
      }

      if (missingEmployeeIdBinding) {
        const body = {
          error: isKoLocale
            ? "직원 계정 연결이 필요합니다."
            : "Employee account binding is required.",
          reason: "requires_employee_id_binding"
        };
        const log: ApiLog = {
          id: Date.now(),
          label,
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString(runtimeLocale),
          body
        };
        setLogs((previous) => [log, ...previous]);
        return {
          response: new Response(JSON.stringify(body), {
            status: 400,
            headers: { "content-type": "application/json" }
          }),
          body
        };
      }

      setPendingLabel(label);
      try {
        const { response, body, log } = await performEmployeeApiCall({
          label,
          method,
          path,
          payload,
          runtimeLocale
        });
        setLogs((previous) => [log, ...previous]);
        return { response, body };
      } finally {
        setPendingLabel(null);
      }
    },
    [isKoLocale, missingEmployeeIdBinding, requiresLoginSession, runtimeLocale]
  );

  const refreshRequestsSnapshot = useCallback(async () => {
    setSnapshotLoaded(false);
    try {
      const snapshot = await refreshEmployeeSnapshotFromHelper({
        callApi,
        callApiLabels,
        fromIso: new Date(periodStart).toISOString(),
        toIso: new Date(periodEnd).toISOString(),
        employeeId,
        selectedCorrectionRecordId,
        lastAttendanceId,
        buildQuery
      });
      if (snapshot.attendance) {
        setAttendance(snapshot.attendance);
      }
      if (snapshot.nextLastAttendanceId) {
        setLastAttendanceId(snapshot.nextLastAttendanceId);
      }
      if (snapshot.nextSelectedCorrectionRecordId) {
        setSelectedCorrectionRecordId(snapshot.nextSelectedCorrectionRecordId);
      }
      if (snapshot.leaveRequests) {
        setLeaveRequests(snapshot.leaveRequests);
      }
      if (snapshot.departmentLeaveCalendarEntries) {
        setDepartmentLeaveCalendarEntries(snapshot.departmentLeaveCalendarEntries);
      }
      if (snapshot.leaveBalance !== undefined) {
        setLeaveBalance(snapshot.leaveBalance);
      }
    } finally {
      setSnapshotLoaded(true);
    }
  }, [
    callApi,
    callApiLabels,
    employeeId,
    lastAttendanceId,
    periodEnd,
    periodStart,
    selectedCorrectionRecordId
  ]);

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
    void refreshRequestsSnapshot();
  }, [
    employeeId,
    isProductionRuntime,
    refreshRequestsSnapshot,
    supabaseSessionLoading,
    usesBearerToken
  ]);

  const {
    resubmitCandidates,
    selectedResubmitCandidate,
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
    checkInAt: periodStart,
    checkOutAt: periodEnd,
    breakMinutes: "0",
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
    latestFailureCauseMessage
  } = useEmployeeRequestChecklistDerivedState({
    latestAttendance: attendance[attendance.length - 1] ?? null,
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
    lastAppliedResubmitCandidateKey: "",
    lastAttendanceId,
    checkInAt: periodStart,
    checkOutAt: periodEnd,
    breakMinutes: "0",
    leaveType: "ANNUAL",
    leaveUnit: "FULL_DAY",
    leaveHours: "8",
    leaveStartDate: periodStart,
    leaveEndDate: periodEnd,
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

  const copyFailureCause = useCallback(async (message: string) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard?.writeText ||
      message.trim().length === 0
    ) {
      return;
    }
    await navigator.clipboard.writeText(message);
  }, []);

  const openPendingRequestSearch = useCallback(() => {
    setRequestSearchScope("status");
    setRequestSearchQuery("pending");
    setRequestSortOption("pending_first");
    jumpToSectionAction("request-search-sort");
  }, []);

  const resolveDraftHref = useCallback((candidate: { channel: "attendance" | "leave"; recordId: string }) => {
    const basePath =
      candidate.channel === "attendance"
        ? "/employee/attendance/correction"
        : "/employee/leave/request";
    return `${basePath}?source=employee-requests&resubmitChannel=${candidate.channel}&resubmitRecordId=${encodeURIComponent(candidate.recordId)}`;
  }, []);

  if (supabaseSessionLoading) {
    return null;
  }

  return (
    <>
      <section className="kpi-strip">
        {integratedSummaryCards.map((card) => (
          <article key={card.key} className="kpi-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
        <article className="kpi-card">
          <p>{isKoLocale ? "최근 처리 작업" : "Latest activity"}</p>
          <strong>{pendingLabel ?? (snapshotLoaded ? "-" : "…")}</strong>
        </article>
      </section>

      <section className="panel-grid">
        {sectionMode !== "resubmit" ? (
          <div
            id="request-monitoring"
            className="panel-grid"
            style={{ gap: "var(--space-4)" }}
          >
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
            onResetRequestSearchFilters={() =>
              resetEmployeeRequestSearchFilters({
                setRequestSearchScope,
                setRequestSearchQuery,
                setRequestSortOption
              })
            }
            onOpenPendingRequestSearch={openPendingRequestSearch}
            onTimelineChannelFilterChange={setTimelineChannelFilter}
            onTimelineStatusFilterChange={setTimelineStatusFilter}
          />
          </div>
        ) : null}

        {sectionMode !== "monitoring" ? (
          <EmployeeRequestsResubmitWorkspacePanel
            isKoLocale={isKoLocale}
            selectedResubmitCandidateKey={selectedResubmitCandidateKey}
            resubmitCandidates={resubmitCandidates}
            selectedResubmitCandidate={selectedResubmitCandidate}
            listBadgeLabels={listBadgeLabels}
            toRequestStatusLabel={toRequestStatusLabel}
            onSelectedResubmitCandidateKeyChange={setSelectedResubmitCandidateKey}
            resolveDraftHref={resolveDraftHref}
          />
        ) : null}
      </section>
    </>
  );
}
