"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildLeaveBalanceCards,
  buildLeaveUsageProjectionLabel,
  summarizeEmployeeApiLogs
} from "@/app/employee/page-derived-helpers";
import { performEmployeeApiCall } from "@/app/employee/page-api-helpers";
import {
  cancelLeaveFromHelper,
  checkOutNowFromHelper,
  createAttendanceFromHelper,
  createLeaveFromHelper,
  refreshEmployeeSnapshotFromHelper,
  requestAttendanceCorrectionFromHelper
} from "@/app/employee/page-action-helpers";
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
  isDevToolsEnabled,
  lastDayOfMonthLocal,
  matchesRequestSearch,
  shiftDays,
  sortRequestRowsByOption,
  startOfLocalDay,
  statusToTone,
  todayEndLocal,
  todayStartLocal,
  toIso,
  toLocalDateKey,
  toLocalInputValue,
  toTimestamp
} from "@/app/employee/page-helpers";
import {
  extractEmployeeErrorMessage,
  formatEmployeeDeltaMinutes,
  isDefaultEmployeeCancelReason,
  resolveEmployeeLocaleLabelBundle
} from "@/app/employee/page-locale-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  IntegratedSubmitChecklistCard,
  IntegratedSummaryCard,
  LeaveBalanceDto,
  LeaveCalendarDensity,
  LeaveCalendarDayCell,
  LeaveCalendarStatusTone,
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
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? notConfiguredLabel;
  const showDevTools = isDevToolsEnabled();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";

  const usesBearerToken = bearerToken.trim().length > 0;
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
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const actorId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim();
    if (actorId.length > 0 && employeeId.trim() !== actorId) {
      setEmployeeId(actorId);
    }
  }, [employeeId, isProductionRuntime, setEmployeeId, supabaseSession?.actorId, supabaseSession?.userId]);

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

  async function refreshEmployeeSnapshot(range?: { fromIso: string; toIso: string }) {
    const fromIso = range?.fromIso ?? toIso(periodStart);
    const toIsoValue = range?.toIso ?? toIso(periodEnd);
    const snapshot = await refreshEmployeeSnapshotFromHelper({
      callApi,
      callApiLabels,
      fromIso,
      toIso: toIsoValue,
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
    if (snapshot.nextLastLeaveRequestId) {
      setLastLeaveRequestId(snapshot.nextLastLeaveRequestId);
    }
    if (snapshot.schedules) {
      setSchedules(snapshot.schedules);
    }
    if (snapshot.leaveBalance !== undefined) {
      setLeaveBalance(snapshot.leaveBalance);
    }
  }

  async function createAttendance() {
    const result = await createAttendanceFromHelper({
      callApi,
      callApiLabels,
      employeeId,
      checkInAt,
      checkOutAt,
      breakMinutes,
      isHoliday,
      attendanceNotes,
      toIso,
      coerceNumber
    });
    if (result.ok) {
      if (result.createdRecordId) {
        setLastAttendanceId(result.createdRecordId);
        setSelectedCorrectionRecordId(result.createdRecordId);
      }
      await refreshEmployeeSnapshot();
    }
  }

  async function checkOutNow() {
    const checkedOut = await checkOutNowFromHelper({
      callApi,
      callApiLabels,
      lastAttendanceId
    });
    if (checkedOut) {
      await refreshEmployeeSnapshot();
    }
  }

  async function requestAttendanceCorrection() {
    const corrected = await requestAttendanceCorrectionFromHelper({
      callApi,
      callApiLabels,
      lastAttendanceId,
      checkInAt,
      checkOutAt,
      breakMinutes,
      isHoliday,
      attendanceNotes,
      correctionRequestNote,
      toIso,
      coerceNumber
    });
    if (corrected) {
      await refreshEmployeeSnapshot();
    }
  }

  async function createLeave() {
    const result = await createLeaveFromHelper({
      callApi,
      callApiLabels,
      employeeId,
      leaveType,
      leaveUnit,
      leaveStartDate,
      leaveEndDate,
      leaveHours,
      leaveReason,
      toIso,
      coerceNumber
    });
    if (result.ok) {
      if (result.requestId) {
        setLastLeaveRequestId(result.requestId);
      }
      await refreshEmployeeSnapshot();
    }
  }

  async function cancelLeave() {
    const canceled = await cancelLeaveFromHelper({
      callApi,
      callApiLabels,
      lastLeaveRequestId,
      cancelReason
    });
    if (canceled) {
      await refreshEmployeeSnapshot();
    }
  }

  function applyLeaveQuickPreset(preset: "today-half" | "tomorrow-full" | "next-week-full") {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
    let nextUnit: "FULL_DAY" | "HALF_DAY" | "HOUR" = "FULL_DAY";

    if (preset === "today-half") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
      nextUnit = "HALF_DAY";
    } else if (preset === "tomorrow-full") {
      const tomorrow = shiftDays(startOfLocalDay(now), 1);
      start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0, 0);
      end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0, 0);
      nextUnit = "FULL_DAY";
    } else {
      const todayStart = startOfLocalDay(now);
      const daysUntilNextMonday = ((8 - todayStart.getDay()) % 7) || 7;
      const nextMonday = shiftDays(todayStart, daysUntilNextMonday);
      start = new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0, 0);
      end = new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 18, 0, 0);
      nextUnit = "FULL_DAY";
    }

    setLeaveType("ANNUAL");
    setLeaveUnit(nextUnit);
    setLeaveStartDate(toLocalInputValue(start));
    setLeaveEndDate(toLocalInputValue(end));
  }

  function prefillLeaveFormFromCalendarDate(dateKey: string) {
    const [yearText, monthText, dayText] = dateKey.split("-");
    const yearNumber = Number(yearText);
    const monthNumber = Number(monthText);
    const dayNumber = Number(dayText);
    if (
      !Number.isInteger(yearNumber) ||
      !Number.isInteger(monthNumber) ||
      !Number.isInteger(dayNumber) ||
      monthNumber < 1 ||
      monthNumber > 12 ||
      dayNumber < 1 ||
      dayNumber > 31
    ) {
      pushMobileFlowFeedback(
        isKoLocale ? "선택한 날짜를 해석할 수 없습니다." : "Unable to parse selected calendar date."
      );
      return;
    }

    const start = new Date(yearNumber, monthNumber - 1, dayNumber, 9, 0, 0);
    const end = new Date(yearNumber, monthNumber - 1, dayNumber, 18, 0, 0);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      pushMobileFlowFeedback(
        isKoLocale ? "선택한 날짜를 해석할 수 없습니다." : "Unable to parse selected calendar date."
      );
      return;
    }

    setLeaveType("ANNUAL");
    setLeaveUnit("FULL_DAY");
    setLeaveStartDate(toLocalInputValue(start));
    setLeaveEndDate(toLocalInputValue(end));
    setLeaveReason(
      isKoLocale
        ? `${dateKey} 캘린더 선택으로 자동 입력`
        : `Auto-prefilled from calendar selection (${dateKey})`
    );
    jumpToSection("leave");
    pushMobileFlowFeedback(
      isKoLocale
        ? `${dateKey} 휴가 신청 초안이 자동 입력되었습니다.`
        : `Leave request draft for ${dateKey} was auto-prefilled.`
    );
  }

  async function setCalendarMonthFromAnchor(anchor: Date, monthOffset: number) {
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset, 1, 0, 0, 0);
    const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset + 1, 0, 23, 59, 0);
    const nextPeriodStart = toLocalInputValue(monthStart);
    const nextPeriodEnd = toLocalInputValue(monthEnd);
    setPeriodStart(nextPeriodStart);
    setPeriodEnd(nextPeriodEnd);
    await refreshEmployeeSnapshot({ fromIso: toIso(nextPeriodStart), toIso: toIso(nextPeriodEnd) });
  }

  async function moveCalendarMonth(monthOffset: number) {
    const parsedPeriodStart = new Date(periodStart);
    const anchor = Number.isNaN(parsedPeriodStart.getTime()) ? new Date() : parsedPeriodStart;
    await setCalendarMonthFromAnchor(anchor, monthOffset);
  }

  async function resetCalendarToCurrentMonth() {
    await setCalendarMonthFromAnchor(new Date(), 0);
  }

  function pushMobileFlowFeedback(message: string) {
    setMobileFlowFeedback(message);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setMobileFlowFeedback((current) => (current === message ? "" : current));
      }, 2200);
    }
  }

  function jumpToSection(sectionId: string) {
    if (typeof document === "undefined") {
      return;
    }
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  }

  function applyRequestSearchPreset(preset: {
    scope: RequestSearchScope;
    query: string;
    sortOption: RequestSortOption;
    targetSectionId: string;
    feedback: string;
  }) {
    setRequestSearchScope(preset.scope);
    setRequestSearchQuery(preset.query);
    setRequestSortOption(preset.sortOption);
    jumpToSection(preset.targetSectionId);
    pushMobileFlowFeedback(preset.feedback);
  }

  function openPendingRequestSearch() {
    applyRequestSearchPreset({
      scope: "status",
      query: "pending",
      sortOption: "pending_first",
      targetSectionId: "request-search-sort",
      feedback: feedbackCopy.pendingRequestFilterApplied
    });
  }


  function applyLeaveRequestToResubmitDraft(request: LeaveRequestDto) {
    setLeaveType(request.leaveType);
    setLeaveUnit(request.unit);
    setLeaveStartDate(toLocalInputValue(new Date(request.startDate)));
    setLeaveEndDate(toLocalInputValue(new Date(request.endDate)));
    if (request.unit === "HOUR") {
      setLeaveHours(request.hours !== null ? String(request.hours) : "4");
    }
    setLeaveReason(request.reason?.trim() || request.decisionReason?.trim() || "Resubmit draft");
    setLastLeaveRequestId(request.id);
  }

  function applyResubmitCandidateToDraft(candidate: ResubmitCandidate) {
    if (candidate.channel === "attendance") {
      const targetAttendance = attendance.find((record) => record.id === candidate.recordId);
      if (!targetAttendance) {
        pushMobileFlowFeedback(feedbackCopy.selectedAttendanceResubmitMissing);
        return;
      }
      applyAttendanceRecordToCorrectionForm(targetAttendance);
      setAttendanceNotes(targetAttendance.notes?.trim() || defaultsCopy.resubmitCorrectionNote);
      setLastAppliedResubmitCandidateKey(candidate.key);
      jumpToSection("attendance");
      pushMobileFlowFeedback(feedbackCopy.attendanceResubmitDraftApplied);
      return;
    }

    const targetLeave = leaveRequests.find((request) => request.id === candidate.recordId);
    if (!targetLeave) {
      pushMobileFlowFeedback(feedbackCopy.selectedLeaveResubmitMissing);
      return;
    }
    applyLeaveRequestToResubmitDraft(targetLeave);
    setLastAppliedResubmitCandidateKey(candidate.key);
    jumpToSection("leave");
    pushMobileFlowFeedback(feedbackCopy.leaveResubmitDraftApplied);
  }

  function applySelectedResubmitCandidate() {
    if (!selectedResubmitCandidate) {
      pushMobileFlowFeedback(feedbackCopy.selectResubmitCandidateFirst);
      return;
    }
    applyResubmitCandidateToDraft(selectedResubmitCandidate);
  }

  function applyLatestResubmitCandidate() {
    if (resubmitCandidates.length === 0) {
      pushMobileFlowFeedback(feedbackCopy.noResubmitTarget);
      return;
    }
    const latest = resubmitCandidates[0];
    setSelectedResubmitCandidateKey(latest.key);
    applyResubmitCandidateToDraft(latest);
  }

  function clearResubmitSelection() {
    setSelectedResubmitCandidateKey("");
    setLastAppliedResubmitCandidateKey("");
    pushMobileFlowFeedback(feedbackCopy.resetResubmitSelection);
  }

  async function copyFailureCause(message: string | null) {
    if (!message) {
      pushMobileFlowFeedback(feedbackCopy.noFailureCauseToCopy);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      pushMobileFlowFeedback(feedbackCopy.clipboardUnavailable);
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      pushMobileFlowFeedback(feedbackCopy.copiedLatestFailureCause);
    } catch {
      pushMobileFlowFeedback(feedbackCopy.copyFailureCauseFailed);
    }
  }

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

  const leaveCalendarCells = useMemo<LeaveCalendarDayCell[]>(() => {
    const parsedPeriodStart = new Date(periodStart);
    const anchor = Number.isNaN(parsedPeriodStart.getTime()) ? new Date() : parsedPeriodStart;
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 0, 0, 0);
    const gridStart = shiftDays(startOfLocalDay(monthStart), -monthStart.getDay());
    const gridEnd = shiftDays(startOfLocalDay(monthEnd), 6 - monthEnd.getDay());

    const requestByDate = new Map<string, LeaveRequestDto[]>();
    for (const request of leaveRequests) {
      const parsedStartDate = new Date(request.startDate);
      const parsedEndDate = new Date(request.endDate);
      if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
        continue;
      }

      let cursor = startOfLocalDay(parsedStartDate);
      const requestEnd = startOfLocalDay(parsedEndDate);
      while (cursor.getTime() <= requestEnd.getTime()) {
        const dateKey = toLocalDateKey(cursor);
        const bucket = requestByDate.get(dateKey);
        if (bucket) {
          bucket.push(request);
        } else {
          requestByDate.set(dateKey, [request]);
        }
        cursor = shiftDays(cursor, 1);
      }
    }

    const todayKey = toLocalDateKey(new Date());
    const cells: LeaveCalendarDayCell[] = [];
    for (let cursor = new Date(gridStart); cursor.getTime() <= gridEnd.getTime(); cursor = shiftDays(cursor, 1)) {
      const dateKey = toLocalDateKey(cursor);
      const requestBucket = requestByDate.get(dateKey) ?? [];
      const requestCount = requestBucket.length;
      let approvedCount = 0;
      let pendingCount = 0;
      let rejectedCount = 0;
      for (const request of requestBucket) {
        if (request.state === "APPROVED") {
          approvedCount += 1;
        } else if (request.state === "PENDING") {
          pendingCount += 1;
        } else {
          rejectedCount += 1;
        }
      }

      let tone: LeaveCalendarStatusTone = "none";
      if (requestCount > 0) {
        if (approvedCount === requestCount) {
          tone = "approved";
        } else if (pendingCount === requestCount) {
          tone = "pending";
        } else if (rejectedCount === requestCount) {
          tone = "rejected";
        } else {
          tone = "mixed";
        }
      }

      const density: LeaveCalendarDensity =
        requestCount >= 3 ? "high" : requestCount === 2 ? "mid" : requestCount === 1 ? "low" : "none";

      cells.push({
        dateKey,
        dayOfMonth: cursor.getDate(),
        inCurrentMonth: cursor.getMonth() === monthStart.getMonth(),
        isToday: dateKey === todayKey,
        requestCount,
        approvedCount,
        pendingCount,
        rejectedCount,
        density,
        tone
      });
    }

    return cells;
  }, [leaveRequests, periodStart]);

  const leaveCalendarRows = useMemo(() => {
    return [...leaveRequests]
      .sort((lhs, rhs) => new Date(lhs.startDate).getTime() - new Date(rhs.startDate).getTime())
      .map((request) => ({
        id: request.id,
        dateRange: `${formatDateTimeByLocale(request.startDate)} ~ ${formatDateTimeByLocale(request.endDate)}`,
        status: request.state,
        label:
          request.unit === "HOUR" && request.hours !== null
            ? `${toLeaveTypeLabel(request.leaveType)} / ${leaveUnitCopy.hourUnit(request.hours.toFixed(2))}`
            : request.unit === "HALF_DAY"
              ? `${toLeaveTypeLabel(request.leaveType)} / ${leaveUnitCopy.halfDay}`
              : `${toLeaveTypeLabel(request.leaveType)} / ${leaveUnitCopy.dayUnit(formatDays(request.days))}`
      }));
  }, [leaveRequests, leaveUnitCopy, toLeaveTypeLabel]);

  const attendanceStatusSummary = useMemo(() => {
    return {
      pending: attendance.filter((record) => record.state === "PENDING").length,
      approved: attendance.filter((record) => record.state === "APPROVED").length,
      rejected: attendance.filter((record) => record.state === "REJECTED").length
    };
  }, [attendance]);

  const leaveStatusSummary = useMemo(() => {
    return {
      pending: leaveRequests.filter((request) => request.state === "PENDING").length,
      approved: leaveRequests.filter((request) => request.state === "APPROVED").length,
      rejected: leaveRequests.filter((request) => request.state === "REJECTED").length,
      canceled: leaveRequests.filter((request) => request.state === "CANCELED").length
    };
  }, [leaveRequests]);

  const totalPendingRequestCount = attendanceStatusSummary.pending + leaveStatusSummary.pending;
  const totalApprovedRequestCount = attendanceStatusSummary.approved + leaveStatusSummary.approved;
  const totalRejectedOrCanceledRequestCount =
    attendanceStatusSummary.rejected + leaveStatusSummary.rejected + leaveStatusSummary.canceled;

  const requestCompletionRatePercent = useMemo(() => {
    const totalHandled = totalApprovedRequestCount + totalRejectedOrCanceledRequestCount;
    const total = totalHandled + totalPendingRequestCount;
    if (total === 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((totalHandled / total) * 100)));
  }, [totalApprovedRequestCount, totalPendingRequestCount, totalRejectedOrCanceledRequestCount]);

  const resubmitCandidates = useMemo<ResubmitCandidate[]>(() => {
    const attendanceCandidates = attendance
      .filter((record) => record.state === "REJECTED")
      .map((record) => ({
        key: `attendance:${record.id}`,
        channel: "attendance" as const,
        recordId: record.id,
        status: "REJECTED" as const,
        at: record.checkOutAt ?? record.checkInAt,
        reason: record.notes?.trim() || defaultsCopy.noReasonProvided,
        summary: `${formatDateTimeByLocale(record.checkInAt)} ~ ${formatDateTimeByLocale(record.checkOutAt)}`
      }));

    const leaveCandidates = leaveRequests
      .filter((request) => request.state === "REJECTED" || request.state === "CANCELED")
      .map((request) => ({
        key: `leave:${request.id}`,
        channel: "leave" as const,
        recordId: request.id,
        status: request.state as "REJECTED" | "CANCELED",
        at: request.endDate,
        reason:
          request.decisionReason?.trim() ||
          request.reason?.trim() ||
          defaultsCopy.noReasonProvided,
        summary: `${toLeaveTypeLabel(request.leaveType)} / ${formatDateTimeByLocale(request.startDate)} ~ ${formatDateTimeByLocale(request.endDate)}`
      }));

    return [...attendanceCandidates, ...leaveCandidates]
      .sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))
      .slice(0, 12);
  }, [attendance, defaultsCopy.noReasonProvided, leaveRequests, toLeaveTypeLabel]);

  const selectedResubmitCandidate = useMemo(() => {
    if (resubmitCandidates.length === 0) {
      return null;
    }
    const explicit = selectedResubmitCandidateKey.trim();
    if (explicit.length === 0) {
      return resubmitCandidates[0];
    }
    return resubmitCandidates.find((candidate) => candidate.key === explicit) ?? resubmitCandidates[0];
  }, [resubmitCandidates, selectedResubmitCandidateKey]);

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

  const integratedSummaryCards = useMemo<IntegratedSummaryCard[]>(() => {
    const resubmitNeededCount = resubmitCandidates.length;
    const apiFailureCount = stats.fail;
    return [
      {
        key: "pending",
        label: summaryCardCopy.pendingRequestsLabel,
        value: `${totalPendingRequestCount}`,
        detail: summaryCardCopy.pendingRequestsDetail(attendanceStatusSummary.pending, leaveStatusSummary.pending),
        tone: totalPendingRequestCount > 0 ? "pending" : "ok"
      },
      {
        key: "completion",
        label: summaryCardCopy.completionRateLabel,
        value: `${requestCompletionRatePercent}%`,
        detail: summaryCardCopy.completionRateDetail(totalApprovedRequestCount, totalRejectedOrCanceledRequestCount),
        tone: requestCompletionRatePercent >= 70 ? "ok" : requestCompletionRatePercent >= 40 ? "pending" : "fail"
      },
      {
        key: "resubmit",
        label: summaryCardCopy.resubmitNeededLabel,
        value: `${resubmitNeededCount}`,
        detail:
          resubmitNeededCount > 0
            ? summaryCardCopy.resubmitNeededDetail(resubmitNeededCount)
            : summaryCardCopy.noResubmitNeededDetail,
        tone: resubmitNeededCount > 0 ? "fail" : "ok"
      },
      {
        key: "api-failures",
        label: summaryCardCopy.apiFailuresLabel,
        value: `${apiFailureCount}`,
        detail: summaryCardCopy.apiFailuresDetail(stats.success, stats.fail),
        tone: apiFailureCount > 0 ? "fail" : "info"
      }
    ];
  }, [
    attendanceStatusSummary.pending,
    leaveStatusSummary.pending,
    requestCompletionRatePercent,
    resubmitCandidates.length,
    stats.fail,
    stats.success,
    summaryCardCopy,
    totalApprovedRequestCount,
    totalPendingRequestCount,
    totalRejectedOrCanceledRequestCount
  ]);

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

  function applyAttendanceRecordToCorrectionForm(record: AttendanceRecordDto) {
    setSelectedCorrectionRecordId(record.id);
    setLastAttendanceId(record.id);
    setCheckInAt(toLocalInputValue(new Date(record.checkInAt)));
    setCheckOutAt(record.checkOutAt ? toLocalInputValue(new Date(record.checkOutAt)) : "");
    setBreakMinutes(String(record.breakMinutes));
    setIsHoliday(record.isHoliday);
    setAttendanceNotes(record.notes ?? correctionRequestNote);
  }

  function applySelectedCorrectionRecord() {
    if (!selectedCorrectionRecord) {
      return;
    }
    applyAttendanceRecordToCorrectionForm(selectedCorrectionRecord);
  }

  function applyLatestAttendanceToCorrectionForm() {
    if (!latestAttendance) {
      return;
    }
    applyAttendanceRecordToCorrectionForm(latestAttendance);
  }

  function selectCorrectionTarget(recordId: string) {
    setSelectedCorrectionRecordId(recordId);
    setLastAttendanceId(recordId);
  }

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
          onCreateAttendance={() => void createAttendance()}
          onCheckOutNow={() => void checkOutNow()}
          onRequestAttendanceCorrection={() => void requestAttendanceCorrection()}
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
          onCreateLeave={() => void createLeave()}
          onCancelLeave={() => void cancelLeave()}
          onPrefillLeaveFromCalendarDate={prefillLeaveFormFromCalendarDate}
          onMoveCalendarMonth={(delta) => void moveCalendarMonth(delta)}
          onResetCalendarToCurrentMonth={() => void resetCalendarToCurrentMonth()}
          onClearLogs={clearLogs}
        />
      </section>
    </main>
  );
}

