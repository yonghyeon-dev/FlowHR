"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    const startedAt = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }

      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken.trim()}`;
      } else {
        headers["x-actor-role"] = "employee";
        headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
        if (organizationId.trim().length > 0) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });

      const raw = await response.text();
      let body: unknown = null;
      if (raw.trim().length > 0) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }

      const durationMs = Date.now() - startedAt;
      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          status: response.status,
          ok: response.ok,
          durationMs,
          at: new Date().toLocaleString(runtimeLocale),
          body
        },
        ...prev
      ]);

      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function refreshEmployeeSnapshot(range?: { fromIso: string; toIso: string }) {
    const from = range?.fromIso ?? toIso(periodStart);
    const to = range?.toIso ?? toIso(periodEnd);

    const [attendanceRes, leaveRes, scheduleRes, balanceRes] = await Promise.all([
      callApi(callApiLabels.attendanceList, "GET", `/api/attendance/records${buildQuery({ from, to })}`),
      callApi(callApiLabels.leaveList, "GET", `/api/leave/requests${buildQuery({ from, to })}`),
      callApi(callApiLabels.scheduleList, "GET", `/api/scheduling/schedules${buildQuery({ from, to })}`),
      callApi(callApiLabels.leaveBalance, "GET", `/api/leave/balances/${employeeId.trim() || "EMP-1001"}`)
    ]);

    if (attendanceRes.response.ok) {
      const parsed = attendanceRes.body as { records?: AttendanceRecordDto[] };
      const records = parsed.records ?? [];
      const recentRecords = records.slice().reverse().slice(-10).reverse();
      setAttendance(recentRecords);
      const pending = records.find((record) => record.state === "PENDING");
      if (pending) {
        setLastAttendanceId(pending.id);
        setSelectedCorrectionRecordId(pending.id);
      } else if (recentRecords.length > 0 && !selectedCorrectionRecordId.trim() && !lastAttendanceId.trim()) {
        const latestId = recentRecords[recentRecords.length - 1].id;
        setSelectedCorrectionRecordId(latestId);
        setLastAttendanceId(latestId);
      }
    }

    if (leaveRes.response.ok) {
      const parsed = leaveRes.body as { requests?: LeaveRequestDto[] };
      const requests = parsed.requests ?? [];
      setLeaveRequests(requests.slice().reverse().slice(-10).reverse());
      const pending = requests.find((req) => req.state === "PENDING");
      if (pending) {
        setLastLeaveRequestId(pending.id);
      }
    }

    if (scheduleRes.response.ok) {
      const parsed = scheduleRes.body as { schedules?: WorkScheduleDto[] };
      const items = parsed.schedules ?? [];
      setSchedules(items.slice().reverse().slice(-10).reverse());
    }

    if (balanceRes.response.ok) {
      const parsed = balanceRes.body as { balance?: LeaveBalanceDto };
      setLeaveBalance(parsed.balance ?? null);
    }
  }

  async function createAttendance() {
    const { response, body } = await callApi(callApiLabels.createAttendance, "POST", "/api/attendance/records", {
      employeeId: employeeId.trim() || "EMP-1001",
      checkInAt: toIso(checkInAt),
      checkOutAt: checkOutAt ? toIso(checkOutAt) : undefined,
      breakMinutes: Math.max(0, Math.trunc(coerceNumber(breakMinutes))),
      isHoliday,
      notes: attendanceNotes.trim().length > 0 ? attendanceNotes.trim() : undefined
    });

    if (response.ok) {
      const parsed = body as { record?: { id?: string } };
      if (parsed.record?.id) {
        setLastAttendanceId(parsed.record.id);
        setSelectedCorrectionRecordId(parsed.record.id);
      }
      await refreshEmployeeSnapshot();
    }
  }

  async function checkOutNow() {
    if (!lastAttendanceId.trim()) {
      return;
    }
    const nowIso = new Date().toISOString();
    const { response } = await callApi(
      callApiLabels.checkOutNow,
      "PATCH",
      `/api/attendance/records/${lastAttendanceId.trim()}`,
      {
        checkOutAt: nowIso
      }
    );
    if (response.ok) {
      await refreshEmployeeSnapshot();
    }
  }

  async function requestAttendanceCorrection() {
    if (!lastAttendanceId.trim()) {
      return;
    }
    const { response } = await callApi(
      callApiLabels.requestAttendanceCorrection,
      "PATCH",
      `/api/attendance/records/${lastAttendanceId.trim()}`,
      {
        checkInAt: toIso(checkInAt),
        checkOutAt: checkOutAt ? toIso(checkOutAt) : undefined,
        breakMinutes: Math.max(0, Math.trunc(coerceNumber(breakMinutes))),
        isHoliday,
        notes: attendanceNotes.trim().length > 0 ? attendanceNotes.trim() : correctionRequestNote
      }
    );
    if (response.ok) {
      await refreshEmployeeSnapshot();
    }
  }

  async function createLeave() {
    const { response, body } = await callApi(callApiLabels.createLeave, "POST", "/api/leave/requests", {
      employeeId: employeeId.trim() || "EMP-1001",
      leaveType,
      startDate: toIso(leaveStartDate),
      endDate: toIso(leaveEndDate),
      unit: leaveUnit,
      hours: leaveUnit === "HOUR" ? Math.max(0, coerceNumber(leaveHours)) : undefined,
      reason: leaveReason.trim().length > 0 ? leaveReason.trim() : undefined
    });

    if (response.ok) {
      const parsed = body as { request?: { id?: string } };
      if (parsed.request?.id) {
        setLastLeaveRequestId(parsed.request.id);
      }
      await refreshEmployeeSnapshot();
    }
  }

  async function cancelLeave() {
    if (!lastLeaveRequestId.trim()) {
      return;
    }
    const { response } = await callApi(
      callApiLabels.cancelLeave,
      "POST",
      `/api/leave/requests/${lastLeaveRequestId.trim()}/cancel`,
      {
        reason: cancelReason.trim().length > 0 ? cancelReason.trim() : undefined
      }
    );
    if (response.ok) {
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
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    const fail = total - success;
    const successRate = total === 0 ? 0 : Math.round((success / total) * 100);
    return { total, success, fail, successRate };
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
    if (!leaveBalance) {
      return [];
    }
    return [
      {
        key: "remaining",
        label: leaveBalanceCopy.cardLabels.remaining,
        value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.remainingDays)),
        tone: "remaining"
      },
      {
        key: "granted",
        label: leaveBalanceCopy.cardLabels.granted,
        value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.grantedDays)),
        tone: "granted"
      },
      {
        key: "used",
        label: leaveBalanceCopy.cardLabels.used,
        value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.usedDays)),
        tone: "used"
      },
      {
        key: "carry-over",
        label: leaveBalanceCopy.cardLabels.carryOver,
        value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.carryOverDays)),
        tone: "carry-over"
      }
    ];
  }, [leaveBalance, leaveBalanceCopy]);

  const leaveUsageProjectionLabel = useMemo(() => {
    if (!leaveBalance || leaveBalance.grantedDays <= 0) {
      return leaveBalanceCopy.projectionPending;
    }

    const elapsedMonths = Math.max(1, new Date().getMonth() + 1);
    const averageUsedPerMonth = leaveBalance.usedDays / elapsedMonths;
    const projectedYearEndUsed = averageUsedPerMonth * 12;
    const projectedRemaining = leaveBalance.grantedDays - projectedYearEndUsed;
    if (projectedRemaining >= 0) {
      return leaveBalanceCopy.projectedRemaining(formatDays(projectedRemaining));
    }
    return leaveBalanceCopy.projectedShortage(formatDays(Math.abs(projectedRemaining)));
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
        dateRange: `${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`,
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
        summary: `${formatDateTime(record.checkInAt)} ~ ${formatDateTime(record.checkOutAt)}`
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
        summary: `${toLeaveTypeLabel(request.leaveType)} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`
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
    const rows: RequestFeedbackRow[] = [];
    if (latestAttendance) {
      rows.push({
        id: `attendance-${latestAttendance.id}`,
        channel: "attendance",
        status: latestAttendance.state,
        at: latestAttendance.checkOutAt ?? latestAttendance.checkInAt,
        message:
          latestAttendance.state === "REJECTED"
            ? `${requestFeedbackCopy.rejectionReasonPrefix}: ${latestAttendance.notes?.trim() || defaultsCopy.noReasonProvided}`
            : latestAttendance.state === "PENDING"
              ? requestFeedbackCopy.pendingMessage
              : requestFeedbackCopy.successMessage,
        tone:
          latestAttendance.state === "APPROVED"
            ? "ok"
            : latestAttendance.state === "PENDING"
              ? "pending"
              : "fail"
      });
    }
    if (latestLeaveRequest) {
      const rejectReason =
        latestLeaveRequest.decisionReason?.trim() ||
        latestLeaveRequest.reason?.trim() ||
        defaultsCopy.noReasonProvided;
      rows.push({
        id: `leave-${latestLeaveRequest.id}`,
        channel: "leave",
        status: latestLeaveRequest.state,
        at: latestLeaveRequest.endDate,
        message:
          latestLeaveRequest.state === "REJECTED"
            ? `${requestFeedbackCopy.rejectionReasonPrefix}: ${rejectReason}`
            : latestLeaveRequest.state === "CANCELED"
              ? `${requestFeedbackCopy.cancelReasonPrefix}: ${rejectReason}`
              : latestLeaveRequest.state === "PENDING"
                ? requestFeedbackCopy.pendingMessage
                : requestFeedbackCopy.successMessage,
        tone:
          latestLeaveRequest.state === "APPROVED"
            ? "ok"
            : latestLeaveRequest.state === "PENDING"
              ? "pending"
              : "fail"
      });
    }

    return rows.sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at));
  }, [defaultsCopy.noReasonProvided, latestAttendance, latestLeaveRequest, requestFeedbackCopy.cancelReasonPrefix, requestFeedbackCopy.pendingMessage, requestFeedbackCopy.rejectionReasonPrefix, requestFeedbackCopy.successMessage]);

  const requestSearchRows = useMemo<RequestSearchRow[]>(() => {
    const attendanceRows = attendance.map((record) => {
      const at = record.checkOutAt ?? record.checkInAt;
      const pendingHours =
        record.state === "PENDING" ? Math.max(0, (requestNowMs - toTimestamp(at)) / 3_600_000) : 0;
      return {
        key: `attendance:${record.id}`,
        channel: "attendance" as const,
        requestId: record.id,
        status: record.state,
        at,
        summary: `${formatDateTime(record.checkInAt)} ~ ${formatDateTime(record.checkOutAt)}`,
        detail: record.notes?.trim() || defaultsCopy.noNote,
        pendingHours
      };
    });

    const leaveRows = leaveRequests.map((request) => {
      const at = request.startDate;
      const pendingHours =
        request.state === "PENDING" ? Math.max(0, (requestNowMs - toTimestamp(at)) / 3_600_000) : 0;
      const leaveUnitLabel =
        request.unit === "HOUR" && request.hours !== null
          ? leaveUnitCopy.hourUnit(request.hours.toFixed(2))
          : request.unit === "HALF_DAY"
            ? leaveUnitCopy.halfDay
            : leaveUnitCopy.dayUnit(formatDays(request.days));
      return {
        key: `leave:${request.id}`,
        channel: "leave" as const,
        requestId: request.id,
        status: request.state,
        at,
        summary: `${toLeaveTypeLabel(request.leaveType)} / ${leaveUnitLabel} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`,
        detail:
          request.reason?.trim() ||
          request.decisionReason?.trim() ||
          defaultsCopy.noReason,
        pendingHours
      };
    });

    return [...attendanceRows, ...leaveRows].sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at));
  }, [attendance, defaultsCopy.noNote, defaultsCopy.noReason, leaveRequests, leaveUnitCopy, requestNowMs, toLeaveTypeLabel]);

  const filteredRequestSearchRows = useMemo(() => {
    const filtered = requestSearchRows.filter((row) =>
      matchesRequestSearch(requestSearchScope, normalizedRequestSearchQuery, row)
    );

    return sortRequestRowsByOption(filtered, requestSortOption);
  }, [normalizedRequestSearchQuery, requestSearchRows, requestSearchScope, requestSortOption]);

  const filteredRequestFeedbackRows = useMemo(() => {
    if (requestFeedbackStatusFilter === "all") {
      return requestFeedbackRows;
    }
    return requestFeedbackRows.filter((row) => row.status === requestFeedbackStatusFilter);
  }, [requestFeedbackStatusFilter, requestFeedbackRows]);

  const mobileRequestTimeline = useMemo<MobileRequestTimelineItem[]>(() => {
    const attendanceItems = attendance.map((record) => ({
      id: `attendance-${record.id}`,
      channel: "attendance" as const,
      status: record.state,
      at: record.checkOutAt ?? record.checkInAt,
      title: defaultsCopy.attendanceRequestTitle,
      detail: `${formatDateTime(record.checkInAt)} ~ ${formatDateTime(record.checkOutAt)}`
    }));

    const leaveItems = leaveRequests.map((request) => ({
      id: `leave-${request.id}`,
      channel: "leave" as const,
      status: request.state,
      at: request.endDate,
      title: defaultsCopy.leaveRequestTitle,
      detail: `${toLeaveTypeLabel(request.leaveType)} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`
    }));

    return [...attendanceItems, ...leaveItems]
      .sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))
      .slice(0, 12);
  }, [attendance, defaultsCopy.attendanceRequestTitle, defaultsCopy.leaveRequestTitle, leaveRequests, toLeaveTypeLabel]);

  const filteredMobileRequestTimeline = useMemo(() => {
    return mobileRequestTimeline.filter((item) => {
      if (timelineChannelFilter !== "all" && item.channel !== timelineChannelFilter) {
        return false;
      }
      if (timelineStatusFilter !== "all" && item.status !== timelineStatusFilter) {
        return false;
      }
      return true;
    });
  }, [mobileRequestTimeline, timelineChannelFilter, timelineStatusFilter]);

  const requestFailureCauses = useMemo<RequestFailureCause[]>(() => {
    const byId = new Map<string, RequestFailureCause>();

    logs
      .filter((log) => !log.ok)
      .slice(0, 4)
      .forEach((log) => {
        const message = extractEmployeeErrorMessage(log.body, isKoLocale);
        byId.set(`log-${log.id}`, {
          id: `log-${log.id}`,
          source: `${log.label} (${log.status})`,
          message,
          at: log.at
        });
      });

    const latestRejectedAttendance = [...attendance]
      .reverse()
      .find((record) => record.state === "REJECTED");
    if (latestRejectedAttendance) {
      byId.set(`attendance-${latestRejectedAttendance.id}`, {
        id: `attendance-${latestRejectedAttendance.id}`,
        source: defaultsCopy.attendanceRejectedSource,
        message:
          latestRejectedAttendance.notes?.trim() ||
          defaultsCopy.rejectionReasonMissing,
        at: formatDateTime(latestRejectedAttendance.checkOutAt ?? latestRejectedAttendance.checkInAt)
      });
    }

    const latestRejectedLeave = [...leaveRequests]
      .reverse()
      .find((request) => request.state === "REJECTED" || request.state === "CANCELED");
    if (latestRejectedLeave) {
      byId.set(`leave-${latestRejectedLeave.id}`, {
        id: `leave-${latestRejectedLeave.id}`,
        source:
          latestRejectedLeave.state === "REJECTED"
            ? defaultsCopy.leaveRejectedSource
            : defaultsCopy.leaveCanceledSource,
        message:
          latestRejectedLeave.decisionReason?.trim() ||
          latestRejectedLeave.reason?.trim() ||
          defaultsCopy.reasonMissing,
        at: formatDateTime(latestRejectedLeave.endDate)
      });
    }

    return [...byId.values()].slice(0, 6);
  }, [attendance, defaultsCopy.attendanceRejectedSource, defaultsCopy.leaveCanceledSource, defaultsCopy.leaveRejectedSource, defaultsCopy.reasonMissing, defaultsCopy.rejectionReasonMissing, isKoLocale, leaveRequests, logs]);

  const latestFailureCauseMessage = requestFailureCauses[0]?.message ?? null;

  const correctionValidation = useMemo(() => {
    if (!lastAttendanceId.trim()) {
      return { isValid: false, message: correctionValidationCopy.missingTargetRecordId };
    }

    const checkInMs = new Date(checkInAt).getTime();
    if (Number.isNaN(checkInMs)) {
      return { isValid: false, message: correctionValidationCopy.invalidCheckInFormat };
    }

    const normalizedBreakMinutes = Math.max(0, Math.trunc(coerceNumber(breakMinutes)));
    if (normalizedBreakMinutes > 12 * 60) {
      return { isValid: false, message: correctionValidationCopy.excessiveBreakMinutes };
    }

    if (checkOutAt.trim().length === 0) {
      return { isValid: true, message: null };
    }

    const checkOutMs = new Date(checkOutAt).getTime();
    if (Number.isNaN(checkOutMs)) {
      return { isValid: false, message: correctionValidationCopy.invalidCheckOutFormat };
    }
    if (checkOutMs <= checkInMs) {
      return { isValid: false, message: correctionValidationCopy.invalidTimeOrder };
    }

    const totalMinutes = Math.round((checkOutMs - checkInMs) / 60_000);
    if (normalizedBreakMinutes >= totalMinutes) {
      return { isValid: false, message: correctionValidationCopy.breakExceedsWorkMinutes };
    }

    return { isValid: true, message: null };
  }, [breakMinutes, checkInAt, checkOutAt, correctionValidationCopy.breakExceedsWorkMinutes, correctionValidationCopy.excessiveBreakMinutes, correctionValidationCopy.invalidCheckInFormat, correctionValidationCopy.invalidCheckOutFormat, correctionValidationCopy.invalidTimeOrder, correctionValidationCopy.missingTargetRecordId, lastAttendanceId]);

  const attendancePreSubmitChecks = useMemo<PreSubmitCheckItem[]>(() => {
    const checks: PreSubmitCheckItem[] = [];
    checks.push({
      id: "attendance-target",
      pass: lastAttendanceId.trim().length > 0,
      label: attendanceCheckCopy.targetLabel,
      detail:
        lastAttendanceId.trim().length > 0
          ? attendanceCheckCopy.targetSelectedDetail
          : attendanceCheckCopy.targetMissingDetail
    });

    const checkInMs = new Date(checkInAt).getTime();
    checks.push({
      id: "attendance-checkin",
      pass: !Number.isNaN(checkInMs),
      label: attendanceCheckCopy.checkInFormatLabel,
      detail: !Number.isNaN(checkInMs) ? attendanceCheckCopy.checkInFormatValidDetail : attendanceCheckCopy.checkInFormatInvalidDetail
    });

    const normalizedBreakMinutes = Math.max(0, Math.trunc(coerceNumber(breakMinutes)));
    checks.push({
      id: "attendance-break",
      pass: normalizedBreakMinutes <= 12 * 60,
      label: attendanceCheckCopy.breakRangeLabel,
      detail:
        normalizedBreakMinutes <= 12 * 60
          ? attendanceCheckCopy.breakRangeValidDetail(normalizedBreakMinutes)
          : attendanceCheckCopy.breakRangeInvalidDetail
    });

    if (checkOutAt.trim().length > 0) {
      const checkOutMs = new Date(checkOutAt).getTime();
      checks.push({
        id: "attendance-checkout-format",
        pass: !Number.isNaN(checkOutMs),
        label: attendanceCheckCopy.checkOutFormatLabel,
        detail:
          !Number.isNaN(checkOutMs)
            ? attendanceCheckCopy.checkOutFormatValidDetail
            : attendanceCheckCopy.checkOutFormatInvalidDetail
      });
      checks.push({
        id: "attendance-time-order",
        pass: !Number.isNaN(checkOutMs) && !Number.isNaN(checkInMs) && checkOutMs > checkInMs,
        label: attendanceCheckCopy.timeOrderLabel,
        detail: !Number.isNaN(checkOutMs) && !Number.isNaN(checkInMs) && checkOutMs > checkInMs
          ? attendanceCheckCopy.timeOrderValidDetail
          : attendanceCheckCopy.timeOrderInvalidDetail
      });
    }

    return checks;
  }, [attendanceCheckCopy, breakMinutes, checkInAt, checkOutAt, lastAttendanceId]);

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

  const leavePreSubmitChecks = useMemo<PreSubmitCheckItem[]>(() => {
    const checks: PreSubmitCheckItem[] = [];
    const startMs = new Date(leaveStartDate).getTime();
    const endMs = new Date(leaveEndDate).getTime();
    const validStart = !Number.isNaN(startMs);
    const validEnd = !Number.isNaN(endMs);

    checks.push({
      id: "leave-start-format",
      pass: validStart,
      label: leaveCheckCopy.startDateFormatLabel,
      detail: validStart ? leaveCheckCopy.startDateFormatValidDetail : leaveCheckCopy.startDateFormatInvalidDetail
    });
    checks.push({
      id: "leave-end-format",
      pass: validEnd,
      label: leaveCheckCopy.endDateFormatLabel,
      detail: validEnd ? leaveCheckCopy.endDateFormatValidDetail : leaveCheckCopy.endDateFormatInvalidDetail
    });
    checks.push({
      id: "leave-range",
      pass: validStart && validEnd && endMs >= startMs,
      label: leaveCheckCopy.requestRangeLabel,
      detail: validStart && validEnd && endMs >= startMs
        ? leaveCheckCopy.requestRangeValidDetail
        : leaveCheckCopy.requestRangeInvalidDetail
    });

    if (leaveUnit === "HOUR") {
      const hours = Math.max(0, coerceNumber(leaveHours));
      checks.push({
        id: "leave-hours",
        pass: hours > 0 && hours <= 12,
        label: leaveCheckCopy.hourlyInputLabel,
        detail:
          hours > 0 && hours <= 12
            ? leaveCheckCopy.hourlyInputValidDetail(hours)
            : leaveCheckCopy.hourlyInputInvalidDetail
      });
    }

    checks.push({
      id: "leave-estimated-days",
      pass: estimatedLeaveRequestedDays > 0,
      label: leaveCheckCopy.estimatedDaysLabel,
      detail:
        estimatedLeaveRequestedDays > 0
          ? leaveCheckCopy.estimatedDaysValidDetail(formatDays(estimatedLeaveRequestedDays))
          : leaveCheckCopy.estimatedDaysInvalidDetail
    });

    if (leaveType === "ANNUAL" && leaveBalance) {
      checks.push({
        id: "leave-balance",
        pass: leaveBalance.remainingDays >= estimatedLeaveRequestedDays,
        label: leaveCheckCopy.annualBalanceLabel,
        detail:
          leaveBalance.remainingDays >= estimatedLeaveRequestedDays
            ? leaveCheckCopy.annualBalanceSufficientDetail(formatDays(leaveBalance.remainingDays))
            : leaveCheckCopy.annualBalanceInsufficientDetail(
                formatDays(leaveBalance.remainingDays),
                formatDays(estimatedLeaveRequestedDays)
              )
      });
    }

    return checks;
  }, [
    estimatedLeaveRequestedDays,
    leaveBalance,
    leaveCheckCopy,
    leaveEndDate,
    leaveHours,
    leaveStartDate,
    leaveType,
    leaveUnit
  ]);

  const leavePreSubmitValid = useMemo(() => leavePreSubmitChecks.every((check) => check.pass), [leavePreSubmitChecks]);

  const leaveFirstFailCheck = useMemo(
    () => leavePreSubmitChecks.find((check) => !check.pass) ?? null,
    [leavePreSubmitChecks]
  );

  const resubmitFlowChecks = useMemo<PreSubmitCheckItem[]>(() => {
    const hasCandidate = Boolean(selectedResubmitCandidate);
    const isDraftApplied =
      hasCandidate && selectedResubmitCandidate
        ? lastAppliedResubmitCandidateKey === selectedResubmitCandidate.key
        : false;
    const isSubmissionReady = !hasCandidate
      ? false
      : selectedResubmitCandidate?.channel === "attendance"
        ? correctionValidation.isValid && attendancePreSubmitValid
        : leavePreSubmitValid;

    return [
      {
        id: "resubmit-candidate",
        pass: hasCandidate,
        label: resubmitFlowCheckCopy.candidateLabel,
        detail:
          hasCandidate ? resubmitFlowCheckCopy.candidateSelectedDetail : resubmitFlowCheckCopy.candidateMissingDetail
      },
      {
        id: "resubmit-draft",
        pass: isDraftApplied,
        label: resubmitFlowCheckCopy.draftAppliedLabel,
        detail:
          isDraftApplied ? resubmitFlowCheckCopy.draftAppliedDetail : resubmitFlowCheckCopy.draftMissingDetail
      },
      {
        id: "resubmit-submit-ready",
        pass: isSubmissionReady,
        label: resubmitFlowCheckCopy.submitReadyLabel,
        detail: isSubmissionReady
          ? resubmitFlowCheckCopy.submitReadyDetail
          : resubmitFlowCheckCopy.submitNotReadyDetail
      }
    ];
  }, [
    attendancePreSubmitValid,
    correctionValidation.isValid,
    lastAppliedResubmitCandidateKey,
    leavePreSubmitValid,
    resubmitFlowCheckCopy.candidateLabel,
    resubmitFlowCheckCopy.candidateMissingDetail,
    resubmitFlowCheckCopy.candidateSelectedDetail,
    resubmitFlowCheckCopy.draftAppliedDetail,
    resubmitFlowCheckCopy.draftAppliedLabel,
    resubmitFlowCheckCopy.draftMissingDetail,
    resubmitFlowCheckCopy.submitNotReadyDetail,
    resubmitFlowCheckCopy.submitReadyDetail,
    resubmitFlowCheckCopy.submitReadyLabel,
    selectedResubmitCandidate
  ]);

  const resubmitFlowReady = useMemo(
    () => resubmitFlowChecks.every((check) => check.pass),
    [resubmitFlowChecks]
  );

  const resubmitFirstFailCheck = useMemo(
    () => resubmitFlowChecks.find((check) => !check.pass) ?? null,
    [resubmitFlowChecks]
  );

  const integratedSubmitChecklistCards = useMemo<IntegratedSubmitChecklistCard[]>(() => {
    const attendancePassCount = attendancePreSubmitChecks.filter((check) => check.pass).length;
    const leavePassCount = leavePreSubmitChecks.filter((check) => check.pass).length;
    const resubmitPassCount = resubmitFlowChecks.filter((check) => check.pass).length;
    const attendanceReady =
      attendancePreSubmitValid && correctionValidation.isValid && lastAttendanceId.trim().length > 0;

    return [
      {
        key: "attendance",
        label: submitChecklistCardCopy.attendanceCorrectionLabel,
        passCount: attendancePassCount,
        totalCount: attendancePreSubmitChecks.length,
        ready: attendanceReady,
        detail: attendanceReady
          ? submitChecklistCardCopy.attendanceReadyDetail
          : correctionValidation.message || attendanceFirstFailCheck?.detail || submitChecklistCardCopy.attendanceFallbackDetail,
        targetSectionId: "attendance"
      },
      {
        key: "leave",
        label: submitChecklistCardCopy.leaveSubmissionLabel,
        passCount: leavePassCount,
        totalCount: leavePreSubmitChecks.length,
        ready: leavePreSubmitValid,
        detail: leavePreSubmitValid
          ? submitChecklistCardCopy.leaveReadyDetail(formatDays(estimatedLeaveRequestedDays))
          : leaveFirstFailCheck?.detail || submitChecklistCardCopy.leaveFallbackDetail,
        targetSectionId: "leave"
      },
      {
        key: "resubmit",
        label: submitChecklistCardCopy.requestResubmitLabel,
        passCount: resubmitPassCount,
        totalCount: resubmitFlowChecks.length,
        ready: resubmitFlowReady,
        detail: resubmitFlowReady
          ? submitChecklistCardCopy.requestResubmitReadyDetail
          : resubmitFirstFailCheck?.detail || submitChecklistCardCopy.requestResubmitFallbackDetail,
        targetSectionId: "request-resubmit"
      }
    ];
  }, [
    attendanceFirstFailCheck,
    attendancePreSubmitChecks,
    attendancePreSubmitValid,
    correctionValidation.isValid,
    correctionValidation.message,
    estimatedLeaveRequestedDays,
    lastAttendanceId,
    leaveFirstFailCheck,
    leavePreSubmitChecks,
    leavePreSubmitValid,
    resubmitFirstFailCheck,
    resubmitFlowChecks,
    resubmitFlowReady,
    submitChecklistCardCopy
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
          formatDateTime={formatDateTime}
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

        <article className="panel" id="attendance">
          <h2>{sectionTitles.attendance}</h2>
          <div className="input-grid">
            <label>
              {attendanceCopy.checkInTime}
              <input type="datetime-local" value={checkInAt} onChange={(event) => setCheckInAt(event.target.value)} />
            </label>
            <label>
              {attendanceCopy.checkOutTime}
              <input type="datetime-local" value={checkOutAt} onChange={(event) => setCheckOutAt(event.target.value)} />
            </label>
            <label>
              {attendanceCopy.breakMinutes}
              <input type="number" min={0} value={breakMinutes} onChange={(event) => setBreakMinutes(event.target.value)} />
            </label>
            <label>
              {attendanceCopy.holidayWork}
              <select value={isHoliday ? "yes" : "no"} onChange={(event) => setIsHoliday(event.target.value === "yes")}>
                <option value="no">{attendanceCopy.noOption}</option>
                <option value="yes">{attendanceCopy.yesOption}</option>
              </select>
            </label>
            <label className="full">
              {attendanceCopy.correctionNote}
              <input value={attendanceNotes} onChange={(event) => setAttendanceNotes(event.target.value)} />
            </label>
            <label className="full">
              {attendanceCopy.recentTargetRecordId}
              <input value={lastAttendanceId} onChange={(event) => setLastAttendanceId(event.target.value)} />
            </label>
            <label className="full">
              {attendanceCopy.selectCorrectionTargetRecord}
              <select
                value={selectedCorrectionRecordId}
                onChange={(event) => selectCorrectionTarget(event.target.value)}
              >
                <option value="">{attendanceCopy.selectFromRecentRecords}</option>
                {attendance.map((record) => (
                  <option key={record.id} value={record.id}>
                    {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)} ({toRequestStatusLabel(record.state)})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="small muted" style={{ margin: "4px 0 0" }}>
            {attendanceCopy.workTimeDelta}: <strong>{correctionDeltaLabel}</strong>
          </p>
          <div className="pre-submit-check-wrap">
            <p className="small" style={{ margin: "8px 0 0" }}>
              {attendanceCopy.preSubmitChecks} (
              {attendancePreSubmitChecks.filter((check) => check.pass).length}/{attendancePreSubmitChecks.length}{" "}
              {attendanceCopy.passed})
            </p>
            <ul
              className="pre-submit-check-list"
              aria-label={attendanceCopy.preSubmitChecksAriaLabel}
            >
              {attendancePreSubmitChecks.map((check) => (
                <li key={check.id} className={check.pass ? "pass" : "fail"}>
                  <strong>{check.pass ? preSubmitStatusLabels.pass : preSubmitStatusLabels.fail}</strong>
                  <span>{check.label}</span>
                  <p>{check.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          {correctionValidation.message ? (
            <p className="small" style={{ margin: "8px 0 0", color: "var(--danger)" }}>
              {correctionValidation.message}
            </p>
          ) : null}
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createAttendance()}>
              {callApiLabels.createAttendance}
            </button>
            <button className="btn btn-secondary" onClick={() => void checkOutNow()} disabled={!lastAttendanceId}>
              {callApiLabels.checkOutNow}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void requestAttendanceCorrection()}
              disabled={!correctionValidation.isValid || !attendancePreSubmitValid}
            >
              {callApiLabels.requestAttendanceCorrection}
            </button>
            <button
              className="btn btn-secondary"
              onClick={applySelectedCorrectionRecord}
              disabled={!selectedCorrectionRecord}
            >
              {attendanceCopy.loadSelectedRecord}
            </button>
            <button className="btn btn-secondary" onClick={applyLatestAttendanceToCorrectionForm} disabled={!latestAttendance}>
              {attendanceCopy.loadLatestRecord}
            </button>
            {attendanceNotePresets.map((preset) => (
              <button key={preset} className="btn btn-secondary" onClick={() => setAttendanceNotes(preset)}>
                {preset}
              </button>
            ))}
          </div>
          <ul className="log-list">
            {attendance.length === 0 ? (
              <li>
                <span className="fail">{listBadgeLabels.empty}</span>
                <span>{attendanceCopy.noRecords}</span>
                <time>-</time>
              </li>
            ) : (
              attendance.map((record) => (
                <li key={record.id}>
                  <span className={record.state === "APPROVED" ? "ok" : record.state === "PENDING" ? "fail" : "fail"}>
                    {toRequestStatusLabel(record.state)}
                  </span>
                  <span>
                    {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)}
                  </span>
                  <button className="btn btn-secondary" onClick={() => applyAttendanceRecordToCorrectionForm(record)}>
                    {attendanceCopy.selectAction}
                  </button>
                  <time>{record.id}</time>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="panel" id="leave">
          <h2>{sectionTitles.leave}</h2>
          <p className="small">{leaveBalanceSummary}</p>
          <div className="input-grid">
            <label>
              {leaveCopy.leaveType}
              <select value={leaveType} onChange={(event) => setLeaveType(event.target.value as "ANNUAL" | "SICK" | "UNPAID")}>
                <option value="ANNUAL">{toLeaveTypeLabel("ANNUAL")}</option>
                <option value="SICK">{toLeaveTypeLabel("SICK")}</option>
                <option value="UNPAID">{toLeaveTypeLabel("UNPAID")}</option>
              </select>
            </label>
            <label>
              {leaveCopy.requestUnit}
              <select
                value={leaveUnit}
                onChange={(event) => setLeaveUnit(event.target.value as "FULL_DAY" | "HALF_DAY" | "HOUR")}
              >
                <option value="FULL_DAY">{leaveCopy.fullDay}</option>
                <option value="HALF_DAY">{leaveCopy.halfDay}</option>
                <option value="HOUR">{leaveCopy.hourly}</option>
              </select>
            </label>
            <label>
              {leaveCopy.startDate}
              <input type="datetime-local" value={leaveStartDate} onChange={(event) => setLeaveStartDate(event.target.value)} />
            </label>
            <label>
              {leaveCopy.endDate}
              <input type="datetime-local" value={leaveEndDate} onChange={(event) => setLeaveEndDate(event.target.value)} />
            </label>
            {leaveUnit === "HOUR" ? (
              <label>
                {leaveCopy.hours}
                <input value={leaveHours} onChange={(event) => setLeaveHours(event.target.value)} />
              </label>
            ) : null}
            <label>
              {leaveCopy.cancelReason}
              <input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
            </label>
            <label className="full">
              {leaveCopy.requestReasonOptional}
              <input value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)} />
            </label>
            <label className="full">
              {leaveCopy.recentTargetRequestId}
              <input value={lastLeaveRequestId} onChange={(event) => setLastLeaveRequestId(event.target.value)} />
            </label>
          </div>
          <div className="pre-submit-check-wrap">
            <p className="small" style={{ margin: "8px 0 0" }}>
              {leaveCopy.preSubmitChecks} (
              {leavePreSubmitChecks.filter((check) => check.pass).length}/{leavePreSubmitChecks.length}{" "}
              {leaveCopy.passed})
            </p>
            <ul
              className="pre-submit-check-list"
              aria-label={leaveCopy.preSubmitChecksAriaLabel}
            >
              {leavePreSubmitChecks.map((check) => (
                <li key={check.id} className={check.pass ? "pass" : "fail"}>
                  <strong>{check.pass ? preSubmitStatusLabels.pass : preSubmitStatusLabels.fail}</strong>
                  <span>{check.label}</span>
                  <p>{check.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="leave-quick-actions" role="group" aria-label={leaveCopy.quickPresetsAriaLabel}>
            <button className="btn btn-secondary btn-small" onClick={() => applyLeaveQuickPreset("today-half")}>
              {leaveCopy.todayHalfDay}
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => applyLeaveQuickPreset("tomorrow-full")}>
              {leaveCopy.tomorrowFullDay}
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => applyLeaveQuickPreset("next-week-full")}>
              {leaveCopy.nextMonday}
            </button>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createLeave()} disabled={!leavePreSubmitValid}>
              {callApiLabels.createLeave}
            </button>
            <button className="btn btn-secondary" onClick={() => void cancelLeave()} disabled={!lastLeaveRequestId}>
              {callApiLabels.cancelLeave}
            </button>
          </div>
          <ul className="log-list">
            {leaveRequests.length === 0 ? (
              <li>
                <span className="fail">{listBadgeLabels.empty}</span>
                <span>{leaveCopy.noRequests}</span>
                <time>-</time>
              </li>
            ) : (
              leaveRequests.map((request) => (
                <li key={request.id}>
                  <span className={request.state === "APPROVED" ? "ok" : request.state === "PENDING" ? "fail" : "fail"}>
                    {toRequestStatusLabel(request.state)}
                  </span>
                  <span>
                    {toLeaveTypeLabel(request.leaveType)} / {formatDateTime(request.startDate)} ~ {formatDateTime(request.endDate)} (
                    {`${formatDays(request.days)}${leaveCopy.dayUnitSuffix}`}
                    {request.unit === "HOUR" && request.hours !== null
                      ? ` / ${request.hours.toFixed(2)}${leaveCopy.hourUnitSuffix}`
                      : request.unit === "HALF_DAY"
                        ? ` / ${leaveCopy.halfDaySuffix}`
                        : ""}
                    )
                  </span>
                  <time>{request.id}</time>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="panel" id="leave-calendar">
          <h2>{sectionTitles.leaveCalendar}</h2>
          <p className="small">
            {leaveCalendarCopy.usageRateLabel} {leaveUsageRatePercent}% ({leaveCalendarCopy.usedLabel}{" "}
            {formatDays(leaveBalance?.usedDays ?? 0)} / {leaveCalendarCopy.grantedLabel}{" "}
            {formatDays(leaveBalance?.grantedDays ?? 0)})
          </p>
          <div className="leave-balance-visual" aria-label={leaveCalendarCopy.visualizationAriaLabel}>
            <div className="leave-usage-ring" style={leaveUsageRingStyle}>
              <div>
                <strong>{leaveUsageRatePercent}%</strong>
                <span>{leaveCalendarCopy.usageRateShort}</span>
              </div>
            </div>
            <div className="leave-balance-cards">
              {leaveBalanceCards.length === 0 ? (
                <p className="small">
                  {leaveCalendarCopy.visualizationHint}
                </p>
              ) : (
                leaveBalanceCards.map((card) => (
                  <article key={card.key} className={`leave-balance-card tone-${card.tone}`}>
                    <p>{card.label}</p>
                    <strong>{card.value}</strong>
                  </article>
                ))
              )}
            </div>
          </div>
          <p className="small leave-projection">{leaveUsageProjectionLabel}</p>
          <div className="leave-calendar-toolbar">
            <strong>
              {leaveCalendarMonthLabel} {leaveCalendarCopy.densityViewLabel}
            </strong>
            <div className="leave-calendar-shortcuts" aria-label={leaveCalendarCopy.quickNavigationAriaLabel}>
              <button className="btn btn-secondary btn-small" onClick={() => void moveCalendarMonth(-1)}>
                {leaveCalendarCopy.previousMonth}
              </button>
              <button className="btn btn-secondary btn-small" onClick={() => void resetCalendarToCurrentMonth()}>
                {leaveCalendarCopy.currentMonth}
              </button>
              <button className="btn btn-secondary btn-small" onClick={() => void moveCalendarMonth(1)}>
                {leaveCalendarCopy.nextMonth}
              </button>
            </div>
          </div>
          <div className="leave-calendar-weekdays" aria-hidden="true">
            {leaveCalendarWeekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="leave-calendar-grid">
            {leaveCalendarCells.map((cell) => (
              <article
                key={cell.dateKey}
                className={[
                  "leave-calendar-day",
                  `density-${cell.density}`,
                  `tone-${cell.tone}`,
                  cell.inCurrentMonth ? "in-month" : "out-month",
                  cell.isToday ? "today" : ""
                ]
                  .join(" ")
                  .trim()}
                title={
                  cell.requestCount === 0
                    ? `${cell.dateKey}: ${leaveCalendarCopy.noScheduleInDateLabel}`
                    : `${cell.dateKey}: ${cell.requestCount}${leaveCalendarCopy.itemSuffix} (${leaveCalendarCopy.approvedLabel} ${cell.approvedCount}, ${leaveCalendarCopy.pendingLabel} ${cell.pendingCount}, ${leaveCalendarCopy.rejectedOrCanceledLabel} ${cell.rejectedCount})`
                }
              >
                <div className="leave-day-head">
                  <span>{cell.dayOfMonth}</span>
                  {cell.requestCount > 0 ? <strong>{`${cell.requestCount}${leaveCalendarCopy.itemSuffix}`}</strong> : null}
                </div>
                <p>
                  {cell.requestCount === 0
                    ? leaveCalendarCopy.noScheduleLabel
                    : `${leaveCalendarCopy.approvedLabel} ${cell.approvedCount} / ${leaveCalendarCopy.pendingLabel} ${cell.pendingCount} / ${leaveCalendarCopy.rejectedLabel} ${cell.rejectedCount}`}
                </p>
              </article>
            ))}
          </div>
          {leaveCalendarRows.length === 0 ? (
            <p className="small" style={{ marginTop: 12 }}>
              {leaveCalendarCopy.noScheduleInRange}
            </p>
          ) : (
            <ul className="simple-list leave-calendar-list" style={{ marginTop: 12 }}>
              {leaveCalendarRows.map((row) => (
                <li key={row.id}>
                  <span>
                    <strong>{row.label}</strong>
                    <br />
                    <span className="small">{row.dateRange}</span>
                  </span>
                  <span className={row.status === "APPROVED" ? "ok" : row.status === "PENDING" ? "muted" : "fail"}>
                    {toRequestStatusLabel(row.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel" id="schedule">
          <h2>{sectionTitles.schedule}</h2>
          {showDevTools ? (
            <div className="actions">
              <Link className="btn btn-secondary" href="/ops/scheduling-cockpit">
                {scheduleCopy.devSchedulingCockpit}
              </Link>
            </div>
          ) : null}
          <ul className="log-list">
            {schedules.length === 0 ? (
              <li>
                <span className="fail">{listBadgeLabels.empty}</span>
                <span>{scheduleCopy.noSchedules}</span>
                <time>-</time>
              </li>
            ) : (
              schedules.map((schedule) => (
                <li key={schedule.id}>
                  <span className="ok">{schedule.isHoliday ? listBadgeLabels.holiday : listBadgeLabels.work}</span>
                  <span>
                    {formatDateTime(schedule.startAt)} ~ {formatDateTime(schedule.endAt)} (
                    {scheduleCopy.breakMinutesFormat(schedule.breakMinutes)})
                  </span>
                  <time>{schedule.id}</time>
                </li>
              ))
            )}
          </ul>
        </article>

        {showDevTools ? (
          <article className="panel panel-log">
            <h2>{sectionTitles.apiLogs}</h2>
            <p className="small">
              {apiLogsCopy.runningNow}: <strong>{pendingLabel ?? apiLogsCopy.none}</strong> / {apiLogsCopy.totalCalls} {stats.total}
              {apiLogsCopy.summary(stats.success, stats.fail)}
            </p>
            <div className="actions">
              <button className="btn btn-secondary" onClick={clearLogs} disabled={logs.length === 0}>
                {apiLogsCopy.clearLogs}
              </button>
            </div>
            <pre>{latestPayload}</pre>
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>
                    {log.ok ? listBadgeLabels.success : listBadgeLabels.fail} {log.status}
                  </span>
                  <span>
                    {log.label} ({Math.max(0, Math.round(log.durationMs))}ms)
                  </span>
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>
    </main>
  );
}

