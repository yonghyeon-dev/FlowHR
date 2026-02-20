"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  durationMs: number;
  at: string;
  body: unknown;
};

type AttendanceRecordDto = {
  id: string;
  employeeId: string;
  checkInAt: string;
  checkOutAt: string | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
};

type LeaveRequestDto = {
  id: string;
  employeeId: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID";
  startDate: string;
  endDate: string;
  unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  hours: number | null;
  days: number;
  reason: string | null;
  decisionReason?: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
};

type WorkScheduleDto = {
  id: string;
  employeeId: string;
  startAt: string;
  endAt: string;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
};

type LeaveBalanceDto = {
  employeeId: string;
  grantedDays: number;
  usedDays: number;
  remainingDays: number;
  carryOverDays: number;
  lastAccrualYear: number | null;
  updatedAt: string;
};

type LeaveCalendarDensity = "none" | "low" | "mid" | "high";
type LeaveCalendarStatusTone = "none" | "approved" | "pending" | "rejected" | "mixed";

type LeaveCalendarDayCell = {
  dateKey: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  requestCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  density: LeaveCalendarDensity;
  tone: LeaveCalendarStatusTone;
};

type RequestFeedbackRow = {
  id: string;
  channel: "attendance" | "leave";
  status: string;
  at: string;
  message: string;
  tone: "ok" | "pending" | "fail";
};

type RequestFailureCause = {
  id: string;
  source: string;
  message: string;
  at: string;
};

const LEAVE_CALENDAR_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function todayStartLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0));
}

function todayEndLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0));
}

function firstDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
}

function lastDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0));
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function toLocalDateKey(value: Date | string) {
  const parsed = typeof value === "string" ? new Date(value) : value;
  const adjusted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function shiftDays(value: Date, days: number) {
  const shifted = new Date(value);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function coerceNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value.trim() === "") {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function toTimestamp(value: string | null) {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
}

const ATTENDANCE_NOTE_PRESETS = ["퇴근 누락 정정", "출근 시각 정정", "휴게시간 정정"] as const;

function calculateNetMinutes(input: { checkInAt: string; checkOutAt: string | null; breakMinutes: number }) {
  const checkInMs = new Date(input.checkInAt).getTime();
  if (Number.isNaN(checkInMs)) {
    return null;
  }
  if (!input.checkOutAt) {
    return null;
  }
  const checkOutMs = new Date(input.checkOutAt).getTime();
  if (Number.isNaN(checkOutMs) || checkOutMs <= checkInMs) {
    return null;
  }
  const grossMinutes = Math.round((checkOutMs - checkInMs) / 60_000);
  return grossMinutes - Math.max(0, Math.trunc(input.breakMinutes));
}

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
  const [mobileFlowFeedback, setMobileFlowFeedback] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not configured";
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

  function startTodayAttendanceFlow() {
    setCheckInAt(todayStartLocal());
    setCheckOutAt(todayEndLocal());
    setBreakMinutes("60");
    setIsHoliday(false);
    setAttendanceNotes("모바일 단축 입력");
    jumpToSection("attendance");
    pushMobileFlowFeedback("출퇴근 입력 폼을 오늘 기준으로 채웠습니다.");
  }

  function startAttendanceCorrectionFlow() {
    if (latestAttendance) {
      applyAttendanceRecordToCorrectionForm(latestAttendance);
      setAttendanceNotes("모바일 단축 정정");
      jumpToSection("attendance");
      pushMobileFlowFeedback("최근 출퇴근 기록을 정정 폼에 불러왔습니다.");
      return;
    }
    pushMobileFlowFeedback("불러올 최근 출퇴근 기록이 없습니다.");
  }

  function startLeaveHalfDayFlow() {
    applyLeaveQuickPreset("today-half");
    jumpToSection("leave");
    pushMobileFlowFeedback("휴가 신청 폼을 오늘 반차 기준으로 채웠습니다.");
  }

  function startLeaveFullDayFlow() {
    applyLeaveQuickPreset("tomorrow-full");
    jumpToSection("leave");
    pushMobileFlowFeedback("휴가 신청 폼을 내일 하루 기준으로 채웠습니다.");
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
            ? `${request.leaveType} / ${request.hours.toFixed(2)}시간`
            : request.unit === "HALF_DAY"
              ? `${request.leaveType} / 반차`
              : `${request.leaveType} / ${formatDays(request.days)}일`
      }));
  }, [leaveRequests]);

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
      <header className="page-header">
        <div>
          <h1 className="page-title">직원 포털</h1>
          <p className="page-subtitle">출퇴근 기록, 휴가 신청/취소, 내 스케줄 확인을 직원이 직접 처리합니다.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee/payslips">
            급여 명세서
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
          </Link>
          <Link className="btn btn-secondary" href="/admin">
            관리자
          </Link>
          <Link className="btn btn-secondary" href="/">
            홈
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/ops/mvp-console">
              (dev) ops 콘솔
            </Link>
          ) : null}
        </div>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          현재 환경은 <strong>production</strong>입니다. 출퇴근/휴가 API 호출을 위해 로그인 세션(Bearer)이 필요합니다:{" "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>오늘 출퇴근</p>
          <strong>{attendanceSummary}</strong>
        </article>
        <article className="kpi-card">
          <p>잔여 휴가</p>
          <strong>{leaveBalance ? `${formatDays(leaveBalance.remainingDays)}일` : "-"}</strong>
        </article>
        <article className="kpi-card">
          <p>휴가 대기</p>
          <strong>{pendingLeaveCount}</strong>
        </article>
        <article className="kpi-card">
          <p>API 성공률</p>
          <strong>{stats.successRate}%</strong>
        </article>
        <article className="kpi-card">
          <p>최근 실행</p>
          <strong>{pendingLabel ?? "-"}</strong>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel" id="account">
          <h2>내 계정</h2>
          {isProductionRuntime ? (
            <p className="small">
              {supabaseSession
                ? `${supabaseSession.email ?? supabaseSession.userId} · role=${supabaseSession.role ?? "-"} · org=${supabaseSession.organizationId ?? "-"}`
                : "현재 로그인되어 있지 않습니다."}{" "}
              <span className="muted">(Bearer {usesBearerToken ? "ON" : "OFF"})</span>
            </p>
          ) : (
            <p className="small muted">로컬 개발: Dev Header(x-actor-*) 모드가 기본입니다.</p>
          )}
          {supabaseSessionError ? (
            <p className="small" style={{ marginTop: 10, color: "var(--danger)" }}>
              세션 오류: {supabaseSessionError}
            </p>
          ) : null}

          {showDevTools || !isProductionRuntime ? (
            <details className="details" style={{ marginTop: 12 }}>
              <summary>
                개발/검증 설정 <small>(필요할 때만)</small>
              </summary>
              <div className="input-grid" style={{ marginTop: 12 }}>
                <label>
                  Organization ID (선택)
                  <input
                    value={organizationId}
                    placeholder="예: ORG-00001"
                    onChange={(event) => setOrganizationId(event.target.value)}
                  />
                </label>
                <label>
                  내 직원 ID
                  <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
                </label>
                {showDevTools ? (
                  <label className="full">
                    Bearer Access Token (override)
                    <textarea
                      rows={3}
                      placeholder="비어 있으면 Dev Header(로컬) 또는 세션(Bearer)이 사용됩니다."
                      value={accessToken}
                      onChange={(event) => setAccessToken(event.target.value)}
                    />
                  </label>
                ) : null}
                <label>
                  조회 기간 시작
                  <input
                    type="datetime-local"
                    value={periodStart}
                    onChange={(event) => setPeriodStart(event.target.value)}
                  />
                </label>
                <label>
                  조회 기간 종료
                  <input
                    type="datetime-local"
                    value={periodEnd}
                    onChange={(event) => setPeriodEnd(event.target.value)}
                  />
                </label>
              </div>
              {showDevTools ? (
                <p className="small muted" style={{ marginTop: 10 }}>
                  (dev) Runtime Supabase URL: <code>{supabaseUrl}</code> / Auth Mode{" "}
                  {usesBearerToken ? "Bearer Token" : "Dev Header"}
                </p>
              ) : null}
            </details>
          ) : null}
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void refreshEmployeeSnapshot()}>
              내 데이터 새로고침
            </button>
          </div>
        </article>

        <article className="panel panel-request-feedback" id="request-feedback">
          <h2>요청 상태 피드백</h2>
          <p className="small">최근 출퇴근/휴가 요청 상태와 반려·실패 원인을 한 화면에서 확인합니다.</p>
          <div className="feedback-kpi-grid">
            <article className="feedback-kpi-card">
              <p>출퇴근 요청</p>
              <strong>
                대기 {attendanceStatusSummary.pending} / 승인 {attendanceStatusSummary.approved}
              </strong>
              <span>반려 {attendanceStatusSummary.rejected}</span>
            </article>
            <article className="feedback-kpi-card">
              <p>휴가 요청</p>
              <strong>
                대기 {leaveStatusSummary.pending} / 승인 {leaveStatusSummary.approved}
              </strong>
              <span>
                반려 {leaveStatusSummary.rejected} / 취소 {leaveStatusSummary.canceled}
              </span>
            </article>
          </div>
          {requestFeedbackRows.length === 0 ? (
            <p className="small muted" style={{ marginTop: 10 }}>
              아직 최근 요청 피드백이 없습니다. 먼저 조회 후 요청을 생성해 보세요.
            </p>
          ) : (
            <ul className="simple-list feedback-row-list" aria-label="요청 상태 피드백">
              {requestFeedbackRows.map((row) => (
                <li key={row.id}>
                  <span>
                    <strong>{row.channel === "attendance" ? "출퇴근" : "휴가"}</strong>{" "}
                    <span className={`feedback-state-pill state-${row.tone}`}>{row.status}</span>
                    <br />
                    <span className="small">{row.message}</span>
                  </span>
                  <time>{formatDateTime(row.at)}</time>
                </li>
              ))}
            </ul>
          )}
          <hr className="divider" />
          <div className="actions">
            <p className="small" style={{ margin: 0 }}>
              실패 원인 가시화 ({requestFailureCauses.length}건)
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => void copyFailureCause(latestFailureCauseMessage)}
            >
              최근 실패 원인 복사
            </button>
          </div>
          {requestFailureCauses.length === 0 ? (
            <p className="small muted" style={{ marginTop: 10 }}>
              최근 실패/반려 이력이 없습니다.
            </p>
          ) : (
            <ul className="failure-cause-list" aria-label="실패 원인 목록">
              {requestFailureCauses.map((cause) => (
                <li key={cause.id}>
                  <strong>{cause.source}</strong>
                  <p>{cause.message}</p>
                  <time>{cause.at}</time>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel panel-mobile-shortcuts" id="mobile-shortcuts">
          <h2>모바일 단축 흐름</h2>
          <p className="small">터치 중심 단축 버튼으로 입력/정정/신청/갱신을 빠르게 진행합니다.</p>
          <div className="mobile-shortcut-grid" role="group" aria-label="모바일 단축 버튼">
            <button className="btn btn-secondary btn-small" onClick={startTodayAttendanceFlow}>
              오늘 출퇴근 입력
            </button>
            <button className="btn btn-secondary btn-small" onClick={startAttendanceCorrectionFlow}>
              출퇴근 정정 시작
            </button>
            <button className="btn btn-secondary btn-small" onClick={startLeaveHalfDayFlow}>
              오늘 반차 신청
            </button>
            <button className="btn btn-secondary btn-small" onClick={startLeaveFullDayFlow}>
              내일 하루 신청
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => jumpToSection("request-feedback")}>
              피드백 바로가기
            </button>
            <button className="btn btn-primary btn-small" onClick={() => void refreshEmployeeSnapshot()}>
              요청 상태 새로고침
            </button>
          </div>
          {mobileFlowFeedback ? <p className="mobile-shortcut-feedback">{mobileFlowFeedback}</p> : null}
        </article>

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
                    {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)} ({record.state})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="small muted" style={{ margin: "4px 0 0" }}>
            근무시간 변화: <strong>{correctionDeltaLabel}</strong>
          </p>
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
              disabled={!correctionValidation.isValid}
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
                <span className="fail">EMPTY</span>
                <span>출퇴근 기록이 없습니다.</span>
                <time>-</time>
              </li>
            ) : (
              attendance.map((record) => (
                <li key={record.id}>
                  <span className={record.state === "APPROVED" ? "ok" : record.state === "PENDING" ? "fail" : "fail"}>
                    {record.state}
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
                <option value="ANNUAL">연차(ANNUAL)</option>
                <option value="SICK">병가(SICK)</option>
                <option value="UNPAID">무급(UNPAID)</option>
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
            <button className="btn btn-primary" onClick={() => void createLeave()}>
              휴가 신청
            </button>
            <button className="btn btn-secondary" onClick={() => void cancelLeave()} disabled={!lastLeaveRequestId}>
              휴가 취소
            </button>
          </div>
          <ul className="log-list">
            {leaveRequests.length === 0 ? (
              <li>
                <span className="fail">EMPTY</span>
                <span>휴가 요청이 없습니다.</span>
                <time>-</time>
              </li>
            ) : (
              leaveRequests.map((request) => (
                <li key={request.id}>
                  <span className={request.state === "APPROVED" ? "ok" : request.state === "PENDING" ? "fail" : "fail"}>
                    {request.state}
                  </span>
                  <span>
                    {request.leaveType} / {formatDateTime(request.startDate)} ~ {formatDateTime(request.endDate)} ({formatDays(request.days)}일
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
                    {row.status}
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
                <span className="fail">EMPTY</span>
                <span>근무 일정이 없습니다.</span>
                <time>-</time>
              </li>
            ) : (
              schedules.map((schedule) => (
                <li key={schedule.id}>
                  <span className="ok">{schedule.isHoliday ? "HOLIDAY" : "WORK"}</span>
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
            <h2>API 실행 로그</h2>
            <p className="small">
              현재 실행 중: <strong>{pendingLabel ?? "없음"}</strong> / 총 호출 {stats.total}건 (성공{" "}
              {stats.success}건, 실패 {stats.fail}건)
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
                    {log.ok ? "OK" : "FAIL"} {log.status}
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

