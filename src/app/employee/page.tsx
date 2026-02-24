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

const LEAVE_CALENDAR_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const ATTENDANCE_NOTE_PRESETS = ["퇴근 누락 정정", "출근 시각 정정", "휴게시간 정정"] as const;

function formatDeltaMinutes(deltaMinutes: number) {
  if (deltaMinutes === 0) {
    return "변화 없음";
  }
  const absMinutes = Math.abs(deltaMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}시간`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}분`);
  }
  const sign = deltaMinutes > 0 ? "+" : "-";
  return `${sign}${parts.join(" ")}`;
}

function extractErrorMessage(body: unknown) {
  if (body === null || body === undefined) {
    return "서버 응답이 비어 있습니다.";
  }
  if (typeof body === "string") {
    return body.trim().length > 0 ? body : "알 수 없는 오류";
  }
  if (typeof body !== "object") {
    return String(body);
  }

  const record = body as Record<string, unknown>;
  const candidates = [record.error, record.message, record.reason, record.detail];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === "string") {
      return first;
    }
    if (first && typeof first === "object") {
      const firstRecord = first as Record<string, unknown>;
      if (typeof firstRecord.message === "string" && firstRecord.message.trim().length > 0) {
        return firstRecord.message;
      }
    }
  }

  try {
    const compact = JSON.stringify(body);
    return compact.length > 140 ? `${compact.slice(0, 140)}...` : compact;
  } catch {
    return "응답을 해석할 수 없습니다.";
  }
}

export default function EmployeeSelfServicePage() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";

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
  const [cancelReason, setCancelReason] = useState("개인 사정으로 취소");

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

  const requestStatusLabels = useMemo(
    () =>
      ({
        PENDING: isKoLocale ? "대기" : "Pending",
        APPROVED: isKoLocale ? "승인" : "Approved",
        REJECTED: isKoLocale ? "반려" : "Rejected",
        CANCELED: isKoLocale ? "취소" : "Canceled"
      }) as const,
    [isKoLocale]
  );
  const leaveTypeLabels = useMemo(
    () =>
      ({
        ANNUAL: isKoLocale ? "연차" : "Annual",
        SICK: isKoLocale ? "병가" : "Sick",
        UNPAID: isKoLocale ? "무급" : "Unpaid"
      }) as const,
    [isKoLocale]
  );
  const preSubmitStatusLabels = useMemo(
    () =>
      ({
        pass: isKoLocale ? "통과" : "Pass",
        fail: isKoLocale ? "실패" : "Fail"
      }) as const,
    [isKoLocale]
  );
  const listBadgeLabels = useMemo(
    () =>
      ({
        empty: isKoLocale ? "없음" : "None",
        applied: isKoLocale ? "적용됨" : "Applied",
        holiday: isKoLocale ? "휴일" : "Holiday",
        work: isKoLocale ? "근무" : "Work",
        success: isKoLocale ? "성공" : "Success",
        fail: isKoLocale ? "실패" : "Fail"
      }) as const,
    [isKoLocale]
  );

  const toRequestStatusLabel = useCallback(
    (status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") => requestStatusLabels[status],
    [requestStatusLabels]
  );
  const toLeaveTypeLabel = useCallback(
    (leaveType: string) => leaveTypeLabels[leaveType as keyof typeof leaveTypeLabels] ?? leaveType,
    [leaveTypeLabels]
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? (isKoLocale ? "미설정" : "not configured");
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
          at: new Date().toLocaleString("ko-KR"),
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
      callApi("내 출퇴근 조회", "GET", `/api/attendance/records${buildQuery({ from, to })}`),
      callApi("내 휴가 요청 조회", "GET", `/api/leave/requests${buildQuery({ from, to })}`),
      callApi("내 근무 일정 조회", "GET", `/api/scheduling/schedules${buildQuery({ from, to })}`),
      callApi("내 휴가 잔여 조회", "GET", `/api/leave/balances/${employeeId.trim() || "EMP-1001"}`)
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
    const { response, body } = await callApi("출퇴근 기록 생성", "POST", "/api/attendance/records", {
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
      "퇴근 처리(지금)",
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
      "출퇴근 정정(요청)",
      "PATCH",
      `/api/attendance/records/${lastAttendanceId.trim()}`,
      {
        checkInAt: toIso(checkInAt),
        checkOutAt: checkOutAt ? toIso(checkOutAt) : undefined,
        breakMinutes: Math.max(0, Math.trunc(coerceNumber(breakMinutes))),
        isHoliday,
        notes: attendanceNotes.trim().length > 0 ? attendanceNotes.trim() : "정정 요청"
      }
    );
    if (response.ok) {
      await refreshEmployeeSnapshot();
    }
  }

  async function createLeave() {
    const { response, body } = await callApi("휴가 신청", "POST", "/api/leave/requests", {
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
      "휴가 취소",
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
      feedback: isKoLocale ? "대기 요청 필터가 적용되었습니다." : "Pending requests filter is now applied."
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
        pushMobileFlowFeedback("선택한 출퇴근 재제출 대상이 최신 목록에 없습니다.");
        return;
      }
      applyAttendanceRecordToCorrectionForm(targetAttendance);
      setAttendanceNotes(targetAttendance.notes?.trim() || "재제출 정정");
      setLastAppliedResubmitCandidateKey(candidate.key);
      jumpToSection("attendance");
      pushMobileFlowFeedback("출퇴근 재제출 초안을 정정 폼에 반영했습니다.");
      return;
    }

    const targetLeave = leaveRequests.find((request) => request.id === candidate.recordId);
    if (!targetLeave) {
      pushMobileFlowFeedback("선택한 휴가 재제출 대상이 최신 목록에 없습니다.");
      return;
    }
    applyLeaveRequestToResubmitDraft(targetLeave);
    setLastAppliedResubmitCandidateKey(candidate.key);
    jumpToSection("leave");
    pushMobileFlowFeedback("휴가 재제출 초안을 신청 폼에 반영했습니다.");
  }

  function applySelectedResubmitCandidate() {
    if (!selectedResubmitCandidate) {
      pushMobileFlowFeedback("재제출 후보를 먼저 선택해 주세요.");
      return;
    }
    applyResubmitCandidateToDraft(selectedResubmitCandidate);
  }

  function applyLatestResubmitCandidate() {
    if (resubmitCandidates.length === 0) {
      pushMobileFlowFeedback("재제출할 반려/취소 건이 없습니다.");
      return;
    }
    const latest = resubmitCandidates[0];
    setSelectedResubmitCandidateKey(latest.key);
    applyResubmitCandidateToDraft(latest);
  }

  function clearResubmitSelection() {
    setSelectedResubmitCandidateKey("");
    setLastAppliedResubmitCandidateKey("");
    pushMobileFlowFeedback("재제출 후보 선택을 초기화했습니다.");
  }

  async function copyFailureCause(message: string | null) {
    if (!message) {
      pushMobileFlowFeedback("복사할 실패 원인이 없습니다.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      pushMobileFlowFeedback("클립보드 복사를 지원하지 않는 환경입니다.");
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      pushMobileFlowFeedback("최근 실패 원인을 클립보드에 복사했습니다.");
    } catch {
      pushMobileFlowFeedback("실패 원인 복사에 실패했습니다.");
    }
  }

  function clearLogs() {
    setLogs([]);
  }

  const latestPayload = useMemo(() => {
    if (!newestLog) {
      return "아직 호출 이력이 없습니다.";
    }
    try {
      return JSON.stringify(newestLog.body, null, 2);
    } catch {
      return String(newestLog.body);
    }
  }, [newestLog]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    const fail = total - success;
    const successRate = total === 0 ? 0 : Math.round((success / total) * 100);
    return { total, success, fail, successRate };
  }, [logs]);

  const leaveBalanceSummary = useMemo(() => {
    if (!leaveBalance) {
      return "잔여 휴가 정보를 아직 불러오지 못했습니다.";
    }
    return `잔여 ${formatDays(leaveBalance.remainingDays)}일 (부여 ${formatDays(leaveBalance.grantedDays)}일, 사용 ${formatDays(leaveBalance.usedDays)}일)`;
  }, [leaveBalance]);

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
      return "기록 없음";
    }
    if (!latestAttendance.checkOutAt) {
      return "근무 중";
    }
    return "퇴근 완료";
  }, [latestAttendance]);

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
      { key: "remaining", label: "잔여", value: `${formatDays(leaveBalance.remainingDays)}일`, tone: "remaining" },
      { key: "granted", label: "부여", value: `${formatDays(leaveBalance.grantedDays)}일`, tone: "granted" },
      { key: "used", label: "사용", value: `${formatDays(leaveBalance.usedDays)}일`, tone: "used" },
      { key: "carry-over", label: "이월", value: `${formatDays(leaveBalance.carryOverDays)}일`, tone: "carry-over" }
    ];
  }, [leaveBalance]);

  const leaveUsageProjectionLabel = useMemo(() => {
    if (!leaveBalance || leaveBalance.grantedDays <= 0) {
      return "연차 사용 속도 예측은 잔여 정보를 불러오면 표시됩니다.";
    }

    const elapsedMonths = Math.max(1, new Date().getMonth() + 1);
    const averageUsedPerMonth = leaveBalance.usedDays / elapsedMonths;
    const projectedYearEndUsed = averageUsedPerMonth * 12;
    const projectedRemaining = leaveBalance.grantedDays - projectedYearEndUsed;
    if (projectedRemaining >= 0) {
      return `현재 사용 속도 기준 연말 예상 잔여 ${formatDays(projectedRemaining)}일`;
    }
    return `현재 사용 속도 기준 연말 예상 부족 ${formatDays(Math.abs(projectedRemaining))}일`;
  }, [leaveBalance]);

  const leaveCalendarMonthLabel = useMemo(() => {
    const parsedPeriodStart = new Date(periodStart);
    const anchor = Number.isNaN(parsedPeriodStart.getTime()) ? new Date() : parsedPeriodStart;
    return `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`;
  }, [periodStart]);

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
            ? `${toLeaveTypeLabel(request.leaveType)} / ${request.hours.toFixed(2)}시간`
            : request.unit === "HALF_DAY"
              ? `${toLeaveTypeLabel(request.leaveType)} / 반차`
              : `${toLeaveTypeLabel(request.leaveType)} / ${formatDays(request.days)}일`
      }));
  }, [leaveRequests, toLeaveTypeLabel]);

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
        reason: record.notes?.trim() || (isKoLocale ? "사유 미기록" : "No reason provided"),
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
          (isKoLocale ? "사유 미기록" : "No reason provided"),
        summary: `${toLeaveTypeLabel(request.leaveType)} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`
      }));

    return [...attendanceCandidates, ...leaveCandidates]
      .sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))
      .slice(0, 12);
  }, [attendance, isKoLocale, leaveRequests, toLeaveTypeLabel]);

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
        label: isKoLocale ? "대기 요청" : "Pending requests",
        value: `${totalPendingRequestCount}`,
        detail: isKoLocale
          ? `출퇴근 ${attendanceStatusSummary.pending} / 휴가 ${leaveStatusSummary.pending}`
          : `Attendance ${attendanceStatusSummary.pending} / Leave ${leaveStatusSummary.pending}`,
        tone: totalPendingRequestCount > 0 ? "pending" : "ok"
      },
      {
        key: "completion",
        label: isKoLocale ? "처리 완료율" : "Completion rate",
        value: `${requestCompletionRatePercent}%`,
        detail: isKoLocale
          ? `승인 ${totalApprovedRequestCount} / 조치 필요 ${totalRejectedOrCanceledRequestCount}`
          : `Approved ${totalApprovedRequestCount} / Needs action ${totalRejectedOrCanceledRequestCount}`,
        tone: requestCompletionRatePercent >= 70 ? "ok" : requestCompletionRatePercent >= 40 ? "pending" : "fail"
      },
      {
        key: "resubmit",
        label: isKoLocale ? "재제출 필요" : "Resubmit needed",
        value: `${resubmitNeededCount}`,
        detail:
          resubmitNeededCount > 0
            ? isKoLocale
              ? `${resubmitNeededCount}건 반려/취소`
              : `${resubmitNeededCount} rejected or canceled request(s)`
            : isKoLocale
              ? "반려/취소 요청 없음"
              : "No rejected or canceled request",
        tone: resubmitNeededCount > 0 ? "fail" : "ok"
      },
      {
        key: "api-failures",
        label: isKoLocale ? "API 실패" : "API failures",
        value: `${apiFailureCount}`,
        detail: isKoLocale
          ? `성공 ${stats.success} / 실패 ${stats.fail}`
          : `Success ${stats.success} / Failed ${stats.fail}`,
        tone: apiFailureCount > 0 ? "fail" : "info"
      }
    ];
  }, [
    attendanceStatusSummary.pending,
    isKoLocale,
    leaveStatusSummary.pending,
    requestCompletionRatePercent,
    totalApprovedRequestCount,
    totalPendingRequestCount,
    totalRejectedOrCanceledRequestCount,
    resubmitCandidates.length,
    stats.fail,
    stats.success
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
            ? `반려 사유: ${latestAttendance.notes?.trim() || "사유 미기록"}`
            : latestAttendance.state === "PENDING"
              ? "승인 대기 중입니다."
              : "정상 처리되었습니다.",
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
        "사유 미기록";
      rows.push({
        id: `leave-${latestLeaveRequest.id}`,
        channel: "leave",
        status: latestLeaveRequest.state,
        at: latestLeaveRequest.endDate,
        message:
          latestLeaveRequest.state === "REJECTED"
            ? `반려 사유: ${rejectReason}`
            : latestLeaveRequest.state === "CANCELED"
              ? `취소 사유: ${rejectReason}`
              : latestLeaveRequest.state === "PENDING"
                ? "승인 대기 중입니다."
                : "정상 처리되었습니다.",
        tone:
          latestLeaveRequest.state === "APPROVED"
            ? "ok"
            : latestLeaveRequest.state === "PENDING"
              ? "pending"
              : "fail"
      });
    }

    return rows.sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at));
  }, [latestAttendance, latestLeaveRequest]);

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
        detail: record.notes?.trim() || (isKoLocale ? "메모 없음" : "No note"),
        pendingHours
      };
    });

    const leaveRows = leaveRequests.map((request) => {
      const at = request.startDate;
      const pendingHours =
        request.state === "PENDING" ? Math.max(0, (requestNowMs - toTimestamp(at)) / 3_600_000) : 0;
      const leaveUnitLabel =
        request.unit === "HOUR" && request.hours !== null
          ? isKoLocale
            ? `${request.hours.toFixed(2)}시간`
            : `${request.hours.toFixed(2)}h`
          : request.unit === "HALF_DAY"
            ? isKoLocale
              ? "반차"
              : "0.5d"
            : isKoLocale
              ? `${formatDays(request.days)}일`
              : `${formatDays(request.days)}d`;
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
          (isKoLocale ? "사유 미기록" : "No reason"),
        pendingHours
      };
    });

    return [...attendanceRows, ...leaveRows].sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at));
  }, [attendance, isKoLocale, leaveRequests, requestNowMs, toLeaveTypeLabel]);

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
      title: "출퇴근 요청",
      detail: `${formatDateTime(record.checkInAt)} ~ ${formatDateTime(record.checkOutAt)}`
    }));

    const leaveItems = leaveRequests.map((request) => ({
      id: `leave-${request.id}`,
      channel: "leave" as const,
      status: request.state,
      at: request.endDate,
      title: "휴가 요청",
      detail: `${toLeaveTypeLabel(request.leaveType)} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`
    }));

    return [...attendanceItems, ...leaveItems]
      .sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))
      .slice(0, 12);
  }, [attendance, leaveRequests, toLeaveTypeLabel]);

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
        const message = extractErrorMessage(log.body);
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
        source: "출퇴근 반려",
        message: latestRejectedAttendance.notes?.trim() || "반려 사유가 기록되지 않았습니다.",
        at: formatDateTime(latestRejectedAttendance.checkOutAt ?? latestRejectedAttendance.checkInAt)
      });
    }

    const latestRejectedLeave = [...leaveRequests]
      .reverse()
      .find((request) => request.state === "REJECTED" || request.state === "CANCELED");
    if (latestRejectedLeave) {
      byId.set(`leave-${latestRejectedLeave.id}`, {
        id: `leave-${latestRejectedLeave.id}`,
        source: latestRejectedLeave.state === "REJECTED" ? "휴가 반려" : "휴가 취소",
        message:
          latestRejectedLeave.decisionReason?.trim() ||
          latestRejectedLeave.reason?.trim() ||
          "사유가 기록되지 않았습니다.",
        at: formatDateTime(latestRejectedLeave.endDate)
      });
    }

    return [...byId.values()].slice(0, 6);
  }, [attendance, leaveRequests, logs]);

  const latestFailureCauseMessage = requestFailureCauses[0]?.message ?? null;

  const correctionValidation = useMemo(() => {
    if (!lastAttendanceId.trim()) {
      return { isValid: false, message: "정정 대상 기록 ID를 선택해 주세요." };
    }

    const checkInMs = new Date(checkInAt).getTime();
    if (Number.isNaN(checkInMs)) {
      return { isValid: false, message: "출근 시각 형식이 올바르지 않습니다." };
    }

    const normalizedBreakMinutes = Math.max(0, Math.trunc(coerceNumber(breakMinutes)));
    if (normalizedBreakMinutes > 12 * 60) {
      return { isValid: false, message: "휴게 시간이 과도합니다. 12시간 이하로 입력해 주세요." };
    }

    if (checkOutAt.trim().length === 0) {
      return { isValid: true, message: null };
    }

    const checkOutMs = new Date(checkOutAt).getTime();
    if (Number.isNaN(checkOutMs)) {
      return { isValid: false, message: "퇴근 시각 형식이 올바르지 않습니다." };
    }
    if (checkOutMs <= checkInMs) {
      return { isValid: false, message: "퇴근 시각은 출근 시각 이후여야 합니다." };
    }

    const totalMinutes = Math.round((checkOutMs - checkInMs) / 60_000);
    if (normalizedBreakMinutes >= totalMinutes) {
      return { isValid: false, message: "휴게 시간이 근무 시간보다 크거나 같습니다." };
    }

    return { isValid: true, message: null };
  }, [breakMinutes, checkInAt, checkOutAt, lastAttendanceId]);

  const attendancePreSubmitChecks = useMemo<PreSubmitCheckItem[]>(() => {
    const checks: PreSubmitCheckItem[] = [];
    checks.push({
      id: "attendance-target",
      pass: lastAttendanceId.trim().length > 0,
      label: "정정 대상 선택",
      detail: lastAttendanceId.trim().length > 0 ? "정정 대상 기록이 선택되었습니다." : "정정 대상 기록 ID를 선택해 주세요."
    });

    const checkInMs = new Date(checkInAt).getTime();
    checks.push({
      id: "attendance-checkin",
      pass: !Number.isNaN(checkInMs),
      label: "출근 시각 형식",
      detail: !Number.isNaN(checkInMs) ? "출근 시각 형식이 유효합니다." : "출근 시각 형식이 올바르지 않습니다."
    });

    const normalizedBreakMinutes = Math.max(0, Math.trunc(coerceNumber(breakMinutes)));
    checks.push({
      id: "attendance-break",
      pass: normalizedBreakMinutes <= 12 * 60,
      label: "휴게 시간 범위",
      detail:
        normalizedBreakMinutes <= 12 * 60
          ? `휴게 ${normalizedBreakMinutes}분`
          : "휴게 시간이 과도합니다. 12시간 이하로 입력해 주세요."
    });

    if (checkOutAt.trim().length > 0) {
      const checkOutMs = new Date(checkOutAt).getTime();
      checks.push({
        id: "attendance-checkout-format",
        pass: !Number.isNaN(checkOutMs),
        label: "퇴근 시각 형식",
        detail: !Number.isNaN(checkOutMs) ? "퇴근 시각 형식이 유효합니다." : "퇴근 시각 형식이 올바르지 않습니다."
      });
      checks.push({
        id: "attendance-time-order",
        pass: !Number.isNaN(checkOutMs) && !Number.isNaN(checkInMs) && checkOutMs > checkInMs,
        label: "출퇴근 시간 순서",
        detail: !Number.isNaN(checkOutMs) && !Number.isNaN(checkInMs) && checkOutMs > checkInMs
          ? "출퇴근 시간 순서가 유효합니다."
          : "퇴근 시각은 출근 시각 이후여야 합니다."
      });
    }

    return checks;
  }, [breakMinutes, checkInAt, checkOutAt, lastAttendanceId]);

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
      label: "시작일 형식",
      detail: validStart ? "시작일 형식이 유효합니다." : "시작일 형식이 올바르지 않습니다."
    });
    checks.push({
      id: "leave-end-format",
      pass: validEnd,
      label: "종료일 형식",
      detail: validEnd ? "종료일 형식이 유효합니다." : "종료일 형식이 올바르지 않습니다."
    });
    checks.push({
      id: "leave-range",
      pass: validStart && validEnd && endMs >= startMs,
      label: "신청 기간",
      detail: validStart && validEnd && endMs >= startMs
        ? "신청 기간이 유효합니다."
        : "종료일은 시작일과 같거나 이후여야 합니다."
    });

    if (leaveUnit === "HOUR") {
      const hours = Math.max(0, coerceNumber(leaveHours));
      checks.push({
        id: "leave-hours",
        pass: hours > 0 && hours <= 12,
        label: "시간 단위 입력",
        detail: hours > 0 && hours <= 12 ? `${hours.toFixed(1)}시간` : "시간 단위는 0보다 크고 12 이하여야 합니다."
      });
    }

    checks.push({
      id: "leave-estimated-days",
      pass: estimatedLeaveRequestedDays > 0,
      label: "신청 일수 계산",
      detail:
        estimatedLeaveRequestedDays > 0
          ? `예상 신청 ${formatDays(estimatedLeaveRequestedDays)}일`
          : "신청 일수를 계산할 수 없습니다."
    });

    if (leaveType === "ANNUAL" && leaveBalance) {
      checks.push({
        id: "leave-balance",
        pass: leaveBalance.remainingDays >= estimatedLeaveRequestedDays,
        label: "잔여 연차 검증",
        detail:
          leaveBalance.remainingDays >= estimatedLeaveRequestedDays
            ? `잔여 ${formatDays(leaveBalance.remainingDays)}일`
            : `잔여 ${formatDays(leaveBalance.remainingDays)}일, 요청 ${formatDays(estimatedLeaveRequestedDays)}일`
      });
    }

    return checks;
  }, [
    estimatedLeaveRequestedDays,
    leaveBalance,
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
        label: "재제출 후보 선택",
        detail: hasCandidate ? "재제출 대상이 선택되었습니다." : "반려/취소 요청에서 재제출 대상을 선택해 주세요."
      },
      {
        id: "resubmit-draft",
        pass: isDraftApplied,
        label: "초안 반영",
        detail: isDraftApplied ? "선택 후보 초안을 신청 폼에 반영했습니다." : "선택 초안 적용 버튼으로 폼을 먼저 채워 주세요."
      },
      {
        id: "resubmit-submit-ready",
        pass: isSubmissionReady,
        label: "제출 가능 상태",
        detail: isSubmissionReady
          ? "검증을 통과했습니다. 해당 폼에서 재제출할 수 있습니다."
          : "재제출 전 입력값 검증을 다시 확인해 주세요."
      }
    ];
  }, [
    attendancePreSubmitValid,
    correctionValidation.isValid,
    lastAppliedResubmitCandidateKey,
    leavePreSubmitValid,
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
        label: "출퇴근 정정 제출",
        passCount: attendancePassCount,
        totalCount: attendancePreSubmitChecks.length,
        ready: attendanceReady,
        detail: attendanceReady
          ? "정정 제출이 가능합니다."
          : correctionValidation.message || attendanceFirstFailCheck?.detail || "정정 입력을 보완해 주세요.",
        targetSectionId: "attendance"
      },
      {
        key: "leave",
        label: "휴가 신청 제출",
        passCount: leavePassCount,
        totalCount: leavePreSubmitChecks.length,
        ready: leavePreSubmitValid,
        detail: leavePreSubmitValid
          ? `예상 ${formatDays(estimatedLeaveRequestedDays)}일 신청 가능합니다.`
          : leaveFirstFailCheck?.detail || "휴가 신청 입력을 보완해 주세요.",
        targetSectionId: "leave"
      },
      {
        key: "resubmit",
        label: "요청 재제출",
        passCount: resubmitPassCount,
        totalCount: resubmitFlowChecks.length,
        ready: resubmitFlowReady,
        detail: resubmitFlowReady
          ? "재제출 흐름 검증을 통과했습니다."
          : resubmitFirstFailCheck?.detail || "재제출 후보 선택 및 초안 반영이 필요합니다.",
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
    resubmitFlowReady
  ]);

  const correctionDeltaLabel = useMemo(() => {
    if (!selectedCorrectionRecord) {
      return "비교 대상 없음";
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
      return "비교 불가";
    }
    return formatDeltaMinutes(draftNetMinutes - originalNetMinutes);
  }, [breakMinutes, checkInAt, checkOutAt, selectedCorrectionRecord]);

  function applyAttendanceRecordToCorrectionForm(record: AttendanceRecordDto) {
    setSelectedCorrectionRecordId(record.id);
    setLastAttendanceId(record.id);
    setCheckInAt(toLocalInputValue(new Date(record.checkInAt)));
    setCheckOutAt(record.checkOutAt ? toLocalInputValue(new Date(record.checkOutAt)) : "");
    setBreakMinutes(String(record.breakMinutes));
    setIsHoliday(record.isHoliday);
    setAttendanceNotes(record.notes ?? "정정 요청");
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
        leaveBalanceLabel={leaveBalance ? `${formatDays(leaveBalance.remainingDays)}일` : "-"}
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
          <h2>출퇴근</h2>
          <div className="input-grid">
            <label>
              출근 시각
              <input type="datetime-local" value={checkInAt} onChange={(event) => setCheckInAt(event.target.value)} />
            </label>
            <label>
              퇴근 시각
              <input type="datetime-local" value={checkOutAt} onChange={(event) => setCheckOutAt(event.target.value)} />
            </label>
            <label>
              휴게 분
              <input type="number" min={0} value={breakMinutes} onChange={(event) => setBreakMinutes(event.target.value)} />
            </label>
            <label>
              휴일 근무
              <select value={isHoliday ? "yes" : "no"} onChange={(event) => setIsHoliday(event.target.value === "yes")}>
                <option value="no">아니오</option>
                <option value="yes">예</option>
              </select>
            </label>
            <label className="full">
              정정/메모
              <input value={attendanceNotes} onChange={(event) => setAttendanceNotes(event.target.value)} />
            </label>
            <label className="full">
              최근/대상 기록 ID
              <input value={lastAttendanceId} onChange={(event) => setLastAttendanceId(event.target.value)} />
            </label>
            <label className="full">
              정정 대상 기록 선택
              <select
                value={selectedCorrectionRecordId}
                onChange={(event) => selectCorrectionTarget(event.target.value)}
              >
                <option value="">최근 기록에서 선택</option>
                {attendance.map((record) => (
                  <option key={record.id} value={record.id}>
                    {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)} ({toRequestStatusLabel(record.state)})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="small muted" style={{ margin: "4px 0 0" }}>
            근무시간 변화: <strong>{correctionDeltaLabel}</strong>
          </p>
          <div className="pre-submit-check-wrap">
            <p className="small" style={{ margin: "8px 0 0" }}>
              제출 직전 검증 ({attendancePreSubmitChecks.filter((check) => check.pass).length}/
              {attendancePreSubmitChecks.length} 통과)
            </p>
            <ul className="pre-submit-check-list" aria-label="출퇴근 제출 직전 검증">
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
              출퇴근 기록 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void checkOutNow()} disabled={!lastAttendanceId}>
              퇴근 처리(지금)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void requestAttendanceCorrection()}
              disabled={!correctionValidation.isValid || !attendancePreSubmitValid}
            >
              출퇴근 정정(요청)
            </button>
            <button
              className="btn btn-secondary"
              onClick={applySelectedCorrectionRecord}
              disabled={!selectedCorrectionRecord}
            >
              선택 기록 불러오기
            </button>
            <button className="btn btn-secondary" onClick={applyLatestAttendanceToCorrectionForm} disabled={!latestAttendance}>
              최근 기록 불러오기
            </button>
            {ATTENDANCE_NOTE_PRESETS.map((preset) => (
              <button key={preset} className="btn btn-secondary" onClick={() => setAttendanceNotes(preset)}>
                {preset}
              </button>
            ))}
          </div>
          <ul className="log-list">
            {attendance.length === 0 ? (
              <li>
                <span className="fail">{listBadgeLabels.empty}</span>
                <span>출퇴근 기록이 없습니다.</span>
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
                    선택
                  </button>
                  <time>{record.id}</time>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="panel" id="leave">
          <h2>휴가</h2>
          <p className="small">{leaveBalanceSummary}</p>
          <div className="input-grid">
            <label>
              휴가 유형
              <select value={leaveType} onChange={(event) => setLeaveType(event.target.value as "ANNUAL" | "SICK" | "UNPAID")}>
                <option value="ANNUAL">{toLeaveTypeLabel("ANNUAL")}</option>
                <option value="SICK">{toLeaveTypeLabel("SICK")}</option>
                <option value="UNPAID">{toLeaveTypeLabel("UNPAID")}</option>
              </select>
            </label>
            <label>
              신청 단위
              <select
                value={leaveUnit}
                onChange={(event) => setLeaveUnit(event.target.value as "FULL_DAY" | "HALF_DAY" | "HOUR")}
              >
                <option value="FULL_DAY">일 단위</option>
                <option value="HALF_DAY">반차</option>
                <option value="HOUR">시간 단위</option>
              </select>
            </label>
            <label>
              시작일
              <input type="datetime-local" value={leaveStartDate} onChange={(event) => setLeaveStartDate(event.target.value)} />
            </label>
            <label>
              종료일
              <input type="datetime-local" value={leaveEndDate} onChange={(event) => setLeaveEndDate(event.target.value)} />
            </label>
            {leaveUnit === "HOUR" ? (
              <label>
                시간(시)
                <input value={leaveHours} onChange={(event) => setLeaveHours(event.target.value)} />
              </label>
            ) : null}
            <label>
              취소 사유
              <input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
            </label>
            <label className="full">
              신청 사유(선택)
              <input value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)} />
            </label>
            <label className="full">
              최근/대상 요청 ID
              <input value={lastLeaveRequestId} onChange={(event) => setLastLeaveRequestId(event.target.value)} />
            </label>
          </div>
          <div className="pre-submit-check-wrap">
            <p className="small" style={{ margin: "8px 0 0" }}>
              제출 직전 검증 ({leavePreSubmitChecks.filter((check) => check.pass).length}/{leavePreSubmitChecks.length}
              통과)
            </p>
            <ul className="pre-submit-check-list" aria-label="휴가 제출 직전 검증">
              {leavePreSubmitChecks.map((check) => (
                <li key={check.id} className={check.pass ? "pass" : "fail"}>
                  <strong>{check.pass ? preSubmitStatusLabels.pass : preSubmitStatusLabels.fail}</strong>
                  <span>{check.label}</span>
                  <p>{check.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="leave-quick-actions" role="group" aria-label="휴가 빠른 입력">
            <button className="btn btn-secondary btn-small" onClick={() => applyLeaveQuickPreset("today-half")}>
              오늘 반차
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => applyLeaveQuickPreset("tomorrow-full")}>
              내일 하루
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => applyLeaveQuickPreset("next-week-full")}>
              다음주 월요일
            </button>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createLeave()} disabled={!leavePreSubmitValid}>
              휴가 신청
            </button>
            <button className="btn btn-secondary" onClick={() => void cancelLeave()} disabled={!lastLeaveRequestId}>
              휴가 취소
            </button>
          </div>
          <ul className="log-list">
            {leaveRequests.length === 0 ? (
              <li>
                <span className="fail">{listBadgeLabels.empty}</span>
                <span>휴가 요청이 없습니다.</span>
                <time>-</time>
              </li>
            ) : (
              leaveRequests.map((request) => (
                <li key={request.id}>
                  <span className={request.state === "APPROVED" ? "ok" : request.state === "PENDING" ? "fail" : "fail"}>
                    {toRequestStatusLabel(request.state)}
                  </span>
                  <span>
                    {toLeaveTypeLabel(request.leaveType)} / {formatDateTime(request.startDate)} ~ {formatDateTime(request.endDate)} ({formatDays(request.days)}일
                    {request.unit === "HOUR" && request.hours !== null ? ` / ${request.hours.toFixed(2)}시간` : request.unit === "HALF_DAY" ? " / 반차" : ""}
                    )
                  </span>
                  <time>{request.id}</time>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="panel" id="leave-calendar">
          <h2>휴가 캘린더</h2>
          <p className="small">
            연차 사용률 {leaveUsageRatePercent}% (사용 {formatDays(leaveBalance?.usedDays ?? 0)} / 부여{" "}
            {formatDays(leaveBalance?.grantedDays ?? 0)})
          </p>
          <div className="leave-balance-visual" aria-label="연차 잔여 시각화">
            <div className="leave-usage-ring" style={leaveUsageRingStyle}>
              <div>
                <strong>{leaveUsageRatePercent}%</strong>
                <span>사용률</span>
              </div>
            </div>
            <div className="leave-balance-cards">
              {leaveBalanceCards.length === 0 ? (
                <p className="small">잔여 연차 데이터를 불러오면 시각화가 활성화됩니다.</p>
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
            <strong>{leaveCalendarMonthLabel} 밀도 보기</strong>
            <div className="leave-calendar-shortcuts" aria-label="캘린더 빠른 이동">
              <button className="btn btn-secondary btn-small" onClick={() => void moveCalendarMonth(-1)}>
                이전 달
              </button>
              <button className="btn btn-secondary btn-small" onClick={() => void resetCalendarToCurrentMonth()}>
                이번 달
              </button>
              <button className="btn btn-secondary btn-small" onClick={() => void moveCalendarMonth(1)}>
                다음 달
              </button>
            </div>
          </div>
          <div className="leave-calendar-weekdays" aria-hidden="true">
            {LEAVE_CALENDAR_WEEKDAYS.map((weekday) => (
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
                    ? `${cell.dateKey}: 휴가 일정 없음`
                    : `${cell.dateKey}: ${cell.requestCount}건 (승인 ${cell.approvedCount}, 대기 ${cell.pendingCount}, 반려/취소 ${cell.rejectedCount})`
                }
              >
                <div className="leave-day-head">
                  <span>{cell.dayOfMonth}</span>
                  {cell.requestCount > 0 ? <strong>{cell.requestCount}건</strong> : null}
                </div>
                <p>
                  {cell.requestCount === 0
                    ? "일정 없음"
                    : `승인 ${cell.approvedCount} / 대기 ${cell.pendingCount} / 반려 ${cell.rejectedCount}`}
                </p>
              </article>
            ))}
          </div>
          {leaveCalendarRows.length === 0 ? (
            <p className="small" style={{ marginTop: 12 }}>
              이번 조회 구간에 휴가 일정이 없습니다.
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
          <h2>근무 일정</h2>
          {showDevTools ? (
            <div className="actions">
              <Link className="btn btn-secondary" href="/ops/scheduling-cockpit">
                (dev) 스케줄링 Cockpit
              </Link>
            </div>
          ) : null}
          <ul className="log-list">
            {schedules.length === 0 ? (
              <li>
                <span className="fail">{listBadgeLabels.empty}</span>
                <span>근무 일정이 없습니다.</span>
                <time>-</time>
              </li>
            ) : (
              schedules.map((schedule) => (
                <li key={schedule.id}>
                  <span className="ok">{schedule.isHoliday ? listBadgeLabels.holiday : listBadgeLabels.work}</span>
                  <span>
                    {formatDateTime(schedule.startAt)} ~ {formatDateTime(schedule.endAt)} (휴게 {schedule.breakMinutes}분)
                  </span>
                  <time>{schedule.id}</time>
                </li>
              ))
            )}
          </ul>
        </article>

        {showDevTools ? (
          <article className="panel panel-log">
            <h2>{isKoLocale ? "API 실행 로그" : "API execution logs"}</h2>
            <p className="small">
              {isKoLocale ? "현재 실행 중" : "Running now"}: <strong>{pendingLabel ?? (isKoLocale ? "없음" : "none")}</strong>{" "}
              / {isKoLocale ? "총 호출" : "Total calls"} {stats.total}
              {isKoLocale
                ? `건 (성공 ${stats.success}건, 실패 ${stats.fail}건)`
                : ` (success ${stats.success}, fail ${stats.fail})`}
            </p>
            <div className="actions">
              <button className="btn btn-secondary" onClick={clearLogs} disabled={logs.length === 0}>
                로그 초기화
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

