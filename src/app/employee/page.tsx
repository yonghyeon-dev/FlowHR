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

type RequestStatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
type TimelineChannelFilter = "all" | "attendance" | "leave";

type MobileRequestTimelineItem = {
  id: string;
  channel: "attendance" | "leave";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  at: string;
  title: string;
  detail: string;
};

type PreSubmitCheckItem = {
  id: string;
  pass: boolean;
  label: string;
  detail: string;
};

type IntegratedSummaryCard = {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: "ok" | "pending" | "fail" | "info";
};

type ResubmitCandidate = {
  key: string;
  channel: "attendance" | "leave";
  recordId: string;
  status: "REJECTED" | "CANCELED";
  at: string;
  reason: string;
  summary: string;
};

type MobileStatusBadge = {
  key: string;
  label: string;
  count: number;
  detail: string;
  tone: "ok" | "pending" | "fail" | "info";
};

type IntegratedSubmitChecklistCard = {
  key: string;
  label: string;
  passCount: number;
  totalCount: number;
  ready: boolean;
  detail: string;
  targetSectionId: string;
};

type RequestBottleneckSeverity = "normal" | "watch" | "critical";

type RequestBottleneckFeedbackCard = {
  key: string;
  label: string;
  severity: RequestBottleneckSeverity;
  count: number;
  detail: string;
  targetSectionId: string;
};

type MobileSubmitGuideCard = {
  key: string;
  label: string;
  ready: boolean;
  progressLabel: string;
  detail: string;
  targetSectionId: string;
  ctaLabel: string;
  tone: "ready" | "pending" | "fail";
};

type RequestSearchScope = "all" | "request_id" | "status" | "content";
type RequestSortOption = "pending_first" | "latest_desc" | "oldest_asc" | "status";

type RequestSearchRow = {
  key: string;
  channel: "attendance" | "leave";
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  at: string;
  summary: string;
  detail: string;
  pendingHours: number;
};

type ApprovalWaitPredictionCard = {
  key: string;
  label: string;
  severity: RequestBottleneckSeverity;
  pendingCount: number;
  averageWaitHours: number;
  maxWaitHours: number;
  predictedBreaches: number;
  etaLabel: string;
  detail: string;
  targetSectionId: string;
};

type MobileFollowUpGuideCard = {
  key: string;
  label: string;
  tone: "ready" | "pending" | "fail";
  detail: string;
  ctaLabel: string;
  targetSectionId: string;
};

type RequestHistorySortAccuracyCard = {
  key: string;
  label: string;
  severity: RequestBottleneckSeverity;
  accuracyScore: number;
  matchedCount: number;
  totalCompared: number;
  detail: string;
  targetSectionId: string;
};

type ApprovalDelayRiskPredictionCard = {
  key: string;
  label: string;
  severity: RequestBottleneckSeverity;
  pendingCount: number;
  stalledCount: number;
  criticalCount: number;
  averageWaitHours: number;
  maxWaitHours: number;
  riskScore: number;
  etaLabel: string;
  detail: string;
  targetSectionId: string;
};

type MobileFollowUpRecommendationCard = {
  key: string;
  label: string;
  tone: "ready" | "pending" | "fail";
  detail: string;
  ctaLabel: string;
  targetSectionId: string;
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

function statusToTone(status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") {
  if (status === "APPROVED") {
    return "ok";
  }
  if (status === "PENDING") {
    return "pending";
  }
  return "fail";
}

function statusSortRank(status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") {
  if (status === "PENDING") {
    return 0;
  }
  if (status === "REJECTED") {
    return 1;
  }
  if (status === "CANCELED") {
    return 2;
  }
  return 3;
}

function sortRequestRowsByOption(rows: RequestSearchRow[], sortOption: RequestSortOption) {
  return [...rows].sort((left, right) => {
    if (sortOption === "latest_desc") {
      return toTimestamp(right.at) - toTimestamp(left.at);
    }
    if (sortOption === "oldest_asc") {
      return toTimestamp(left.at) - toTimestamp(right.at);
    }
    if (sortOption === "status") {
      const statusDiff = statusSortRank(left.status) - statusSortRank(right.status);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return toTimestamp(right.at) - toTimestamp(left.at);
    }
    const pendingDiff = Number(right.status === "PENDING") - Number(left.status === "PENDING");
    if (pendingDiff !== 0) {
      return pendingDiff;
    }
    if (right.status === "PENDING" && left.status === "PENDING") {
      const waitDiff = right.pendingHours - left.pendingHours;
      if (waitDiff !== 0) {
        return waitDiff;
      }
    }
    return toTimestamp(right.at) - toTimestamp(left.at);
  });
}

function matchesRequestSearch(scope: RequestSearchScope, query: string, row: RequestSearchRow) {
  if (!query) {
    return true;
  }
  const normalizedRequestId = row.requestId.toLowerCase();
  const normalizedStatus = row.status.toLowerCase();
  const normalizedContent = `${row.summary} ${row.detail} ${row.channel}`.toLowerCase();

  if (scope === "request_id") {
    return normalizedRequestId.includes(query);
  }
  if (scope === "status") {
    return normalizedStatus.includes(query);
  }
  if (scope === "content") {
    return normalizedContent.includes(query);
  }
  return `${normalizedRequestId} ${normalizedStatus} ${normalizedContent}`.includes(query);
}

function bottleneckSeverityRank(severity: RequestBottleneckSeverity) {
  if (severity === "critical") {
    return 2;
  }
  if (severity === "watch") {
    return 1;
  }
  return 0;
}

function estimateLeaveRequestedDays(input: {
  startDate: string;
  endDate: string;
  unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  hoursInput: string;
}) {
  if (input.unit === "HALF_DAY") {
    return 0.5;
  }
  if (input.unit === "HOUR") {
    return Math.max(0, coerceNumber(input.hoursInput)) / 8;
  }

  const startMs = new Date(input.startDate).getTime();
  const endMs = new Date(input.endDate).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((endMs - startMs + 1) / dayMs));
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
  const [requestFeedbackStatusFilter, setRequestFeedbackStatusFilter] = useState<RequestStatusFilter>("all");
  const [timelineChannelFilter, setTimelineChannelFilter] = useState<TimelineChannelFilter>("all");
  const [timelineStatusFilter, setTimelineStatusFilter] = useState<RequestStatusFilter>("all");
  const [requestSearchScope, setRequestSearchScope] = useState<RequestSearchScope>("all");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestSortOption, setRequestSortOption] = useState<RequestSortOption>("pending_first");
  const [selectedResubmitCandidateKey, setSelectedResubmitCandidateKey] = useState("");
  const [lastAppliedResubmitCandidateKey, setLastAppliedResubmitCandidateKey] = useState("");

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

  function openPendingRequestSearch() {
    setRequestSearchScope("status");
    setRequestSearchQuery("pending");
    setRequestSortOption("pending_first");
    jumpToSection("request-search-sort");
    pushMobileFlowFeedback("승인 대기 요청 필터를 열었습니다.");
  }

  function openRejectedRequestSearch() {
    setRequestSearchScope("status");
    setRequestSearchQuery("rejected");
    setRequestSortOption("latest_desc");
    jumpToSection("request-search-sort");
    pushMobileFlowFeedback("반려 요청 필터를 열었습니다.");
  }

  function runMobileFollowUpAction(card: MobileFollowUpGuideCard) {
    if (card.key === "pending-follow-up" && totalPendingRequestCount > 0) {
      openPendingRequestSearch();
      return;
    }
    if (card.key === "resubmit-follow-up" && resubmitCandidates.length > 0 && !resubmitFlowReady) {
      openRejectedRequestSearch();
      jumpToSection("request-resubmit");
      pushMobileFlowFeedback("재제출 대상 요청을 먼저 점검해 주세요.");
      return;
    }
    if (card.key === "api-failure-follow-up" && stats.fail > 0) {
      jumpToSection("request-feedback");
      pushMobileFlowFeedback("최근 API 실패 원인을 먼저 확인해 주세요.");
      return;
    }
    jumpToSection(card.targetSectionId);
  }

  function runMobileFollowUpRecommendationAction(card: MobileFollowUpRecommendationCard) {
    if (card.key === "sort-accuracy") {
      const hasSortAccuracyRisk = requestHistorySortAccuracyCards.some(
        (accuracyCard) => accuracyCard.totalCompared > 0 && accuracyCard.severity !== "normal"
      );
      if (hasSortAccuracyRisk) {
        openPendingRequestSearch();
        jumpToSection("request-history-sort-accuracy");
        pushMobileFlowFeedback("Requested history sort-accuracy review is opened.");
        return;
      }
    }
    if (card.key === "delay-risk") {
      const hasDelayRisk = approvalDelayRiskPredictionCards.some(
        (riskCard) => riskCard.pendingCount > 0 && riskCard.severity !== "normal"
      );
      if (hasDelayRisk) {
        openPendingRequestSearch();
        jumpToSection("approval-delay-risk-prediction");
        pushMobileFlowFeedback("Approval delay-risk prediction follow-up is opened.");
        return;
      }
    }
    if (card.key === "resubmit-follow-up" && resubmitCandidates.length > 0 && !resubmitFlowReady) {
      openRejectedRequestSearch();
      jumpToSection("request-resubmit");
      pushMobileFlowFeedback("Review rejected requests and complete resubmit validation.");
      return;
    }
    if (card.key === "api-failure-follow-up" && stats.fail > 0) {
      jumpToSection("request-feedback");
      pushMobileFlowFeedback("Review API failure details before retry.");
      return;
    }
    jumpToSection(card.targetSectionId);
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
        reason: record.notes?.trim() || "No reason provided",
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
        reason: request.decisionReason?.trim() || request.reason?.trim() || "No reason provided",
        summary: `${request.leaveType} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`
      }));

    return [...attendanceCandidates, ...leaveCandidates]
      .sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))
      .slice(0, 12);
  }, [attendance, leaveRequests]);

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
        label: "Pending requests",
        value: `${totalPendingRequestCount}`,
        detail: `Attendance ${attendanceStatusSummary.pending} / Leave ${leaveStatusSummary.pending}`,
        tone: totalPendingRequestCount > 0 ? "pending" : "ok"
      },
      {
        key: "completion",
        label: "Completion rate",
        value: `${requestCompletionRatePercent}%`,
        detail: `Approved ${totalApprovedRequestCount} / Action needed ${totalRejectedOrCanceledRequestCount}`,
        tone: requestCompletionRatePercent >= 70 ? "ok" : requestCompletionRatePercent >= 40 ? "pending" : "fail"
      },
      {
        key: "resubmit",
        label: "Resubmit needed",
        value: `${resubmitNeededCount}`,
        detail:
          resubmitNeededCount > 0
            ? `${resubmitNeededCount} rejected or canceled request(s)`
            : "No rejected or canceled request",
        tone: resubmitNeededCount > 0 ? "fail" : "ok"
      },
      {
        key: "api-failures",
        label: "API failures",
        value: `${apiFailureCount}`,
        detail: `Success ${stats.success} / Fail ${stats.fail}`,
        tone: apiFailureCount > 0 ? "fail" : "info"
      }
    ];
  }, [
    attendanceStatusSummary.pending,
    leaveStatusSummary.pending,
    requestCompletionRatePercent,
    totalApprovedRequestCount,
    totalPendingRequestCount,
    totalRejectedOrCanceledRequestCount,
    resubmitCandidates.length,
    stats.fail,
    stats.success
  ]);

  const mobileStatusBadges = useMemo<MobileStatusBadge[]>(() => {
    const failedApiCount = logs.filter((log) => !log.ok).length;
    return [
      {
        key: "pending",
        label: "Pending",
        count: totalPendingRequestCount,
        detail: "Waiting for approval",
        tone: totalPendingRequestCount > 0 ? "pending" : "ok"
      },
      {
        key: "resubmit",
        label: "Resubmit",
        count: resubmitCandidates.length,
        detail: "Rejected or canceled",
        tone: resubmitCandidates.length > 0 ? "fail" : "ok"
      },
      {
        key: "approved",
        label: "Approved",
        count: totalApprovedRequestCount,
        detail: "Handled in current range",
        tone: "ok"
      },
      {
        key: "api-fail",
        label: "API fail",
        count: failedApiCount,
        detail: "Recent API failures",
        tone: failedApiCount > 0 ? "fail" : "info"
      }
    ];
  }, [logs, resubmitCandidates.length, totalApprovedRequestCount, totalPendingRequestCount]);

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
        detail: record.notes?.trim() || "No note",
        pendingHours
      };
    });

    const leaveRows = leaveRequests.map((request) => {
      const at = request.startDate;
      const pendingHours =
        request.state === "PENDING" ? Math.max(0, (requestNowMs - toTimestamp(at)) / 3_600_000) : 0;
      const leaveUnitLabel =
        request.unit === "HOUR" && request.hours !== null
          ? `${request.hours.toFixed(2)}h`
          : request.unit === "HALF_DAY"
            ? "0.5d"
            : `${formatDays(request.days)}d`;
      return {
        key: `leave:${request.id}`,
        channel: "leave" as const,
        requestId: request.id,
        status: request.state,
        at,
        summary: `${request.leaveType} / ${leaveUnitLabel} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`,
        detail: request.reason?.trim() || request.decisionReason?.trim() || "No reason",
        pendingHours
      };
    });

    return [...attendanceRows, ...leaveRows].sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at));
  }, [attendance, leaveRequests, requestNowMs]);

  const filteredRequestSearchRows = useMemo(() => {
    const filtered = requestSearchRows.filter((row) =>
      matchesRequestSearch(requestSearchScope, normalizedRequestSearchQuery, row)
    );

    return sortRequestRowsByOption(filtered, requestSortOption);
  }, [normalizedRequestSearchQuery, requestSearchRows, requestSearchScope, requestSortOption]);

  const approvalWaitPredictionCards = useMemo<ApprovalWaitPredictionCard[]>(() => {
    const pendingRows = requestSearchRows.filter((row) => row.status === "PENDING");

    const toPredictionCard = (
      key: string,
      label: string,
      rows: RequestSearchRow[],
      targetSectionId: string
    ): ApprovalWaitPredictionCard => {
      const pendingCount = rows.length;
      const totalWaitHours = rows.reduce((sum, row) => sum + row.pendingHours, 0);
      const averageWaitHours = pendingCount > 0 ? totalWaitHours / pendingCount : 0;
      const maxWaitHours = pendingCount > 0 ? Math.max(...rows.map((row) => row.pendingHours)) : 0;
      const predictedBreaches = rows.filter((row) => row.pendingHours >= 24).length;
      const severity: RequestBottleneckSeverity =
        maxWaitHours >= 48 || predictedBreaches >= 2
          ? "critical"
          : maxWaitHours >= 24 || predictedBreaches >= 1
            ? "watch"
            : "normal";
      const etaLabel =
        pendingCount === 0
          ? "no pending"
          : maxWaitHours >= 48
            ? "follow-up now"
            : maxWaitHours >= 24
              ? "1-2 business days"
              : maxWaitHours >= 12
                ? "within 24h"
                : "within today";

      return {
        key,
        label,
        severity,
        pendingCount,
        averageWaitHours,
        maxWaitHours,
        predictedBreaches,
        etaLabel,
        detail:
          pendingCount === 0
            ? "현재 승인 대기 요청이 없습니다."
            : `avg ${Math.round(averageWaitHours)}h / max ${Math.round(maxWaitHours)}h / breach-risk ${predictedBreaches}`,
        targetSectionId
      };
    };

    const attendancePending = pendingRows.filter((row) => row.channel === "attendance");
    const leavePending = pendingRows.filter((row) => row.channel === "leave");
    const cards = [
      toPredictionCard("all", "전체 승인 대기", pendingRows, "request-search-sort"),
      toPredictionCard("attendance", "출퇴근 승인 대기", attendancePending, "attendance"),
      toPredictionCard("leave", "휴가 승인 대기", leavePending, "leave")
    ];

    return cards.sort((left, right) => {
      const severityDiff = bottleneckSeverityRank(right.severity) - bottleneckSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.pendingCount - left.pendingCount;
    });
  }, [requestSearchRows]);

  const requestHistorySortAccuracyCards = useMemo<RequestHistorySortAccuracyCard[]>(() => {
    const filteredRows = requestSearchRows.filter((row) =>
      matchesRequestSearch(requestSearchScope, normalizedRequestSearchQuery, row)
    );
    const currentTopRows = sortRequestRowsByOption(filteredRows, requestSortOption);
    const totalCompared = Math.min(8, currentTopRows.length);
    const currentTopKeys = new Set(currentTopRows.slice(0, totalCompared).map((row) => row.key));

    const toAccuracyCard = (
      key: string,
      label: string,
      baselineSortOption: RequestSortOption,
      targetSectionId: string
    ): RequestHistorySortAccuracyCard => {
      if (totalCompared === 0) {
        return {
          key,
          label,
          severity: "normal",
          accuracyScore: 100,
          matchedCount: 0,
          totalCompared: 0,
          detail: "No request history rows in the current filter scope.",
          targetSectionId
        };
      }

      const baselineTopRows = sortRequestRowsByOption(filteredRows, baselineSortOption).slice(0, totalCompared);
      const matchedCount = baselineTopRows.filter((row) => currentTopKeys.has(row.key)).length;
      const accuracyScore = Math.round((matchedCount / totalCompared) * 100);
      const severity: RequestBottleneckSeverity =
        accuracyScore < 50 ? "critical" : accuracyScore < 75 ? "watch" : "normal";

      return {
        key,
        label,
        severity,
        accuracyScore,
        matchedCount,
        totalCompared,
        detail: `Top ${matchedCount}/${totalCompared} rows are aligned with ${label.toLowerCase()}.`,
        targetSectionId
      };
    };

    const cards = [
      toAccuracyCard("pending-first", "Pending-first precision", "pending_first", "request-search-sort"),
      toAccuracyCard("latest-desc", "Latest-first recency", "latest_desc", "request-search-sort"),
      toAccuracyCard("status-cluster", "Status-cluster consistency", "status", "request-search-sort")
    ];

    return cards.sort((left, right) => {
      const severityDiff = bottleneckSeverityRank(right.severity) - bottleneckSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return left.accuracyScore - right.accuracyScore;
    });
  }, [normalizedRequestSearchQuery, requestSearchRows, requestSearchScope, requestSortOption]);

  const approvalDelayRiskPredictionCards = useMemo<ApprovalDelayRiskPredictionCard[]>(() => {
    const pendingRows = requestSearchRows.filter((row) => row.status === "PENDING");

    const toRiskCard = (
      key: string,
      label: string,
      rows: RequestSearchRow[],
      targetSectionId: string
    ): ApprovalDelayRiskPredictionCard => {
      const pendingCount = rows.length;
      const stalledCount = rows.filter((row) => row.pendingHours >= 24).length;
      const criticalCount = rows.filter((row) => row.pendingHours >= 48).length;
      const totalWaitHours = rows.reduce((sum, row) => sum + row.pendingHours, 0);
      const averageWaitHours = pendingCount > 0 ? totalWaitHours / pendingCount : 0;
      const maxWaitHours = pendingCount > 0 ? Math.max(...rows.map((row) => row.pendingHours)) : 0;
      const rawRiskScore = averageWaitHours * 1.2 + maxWaitHours * 0.75 + stalledCount * 14 + criticalCount * 22;
      const riskScore = pendingCount > 0 ? Math.min(100, Math.round(rawRiskScore)) : 0;
      const severity: RequestBottleneckSeverity =
        riskScore >= 80 || criticalCount >= 1 ? "critical" : riskScore >= 45 || stalledCount >= 1 ? "watch" : "normal";
      const etaLabel =
        pendingCount === 0
          ? "stable"
          : severity === "critical"
            ? "act now"
            : severity === "watch"
              ? "within 1 business day"
              : "within today";

      return {
        key,
        label,
        severity,
        pendingCount,
        stalledCount,
        criticalCount,
        averageWaitHours,
        maxWaitHours,
        riskScore,
        etaLabel,
        detail:
          pendingCount === 0
            ? "No pending requests in this channel."
            : `risk ${riskScore} / avg ${Math.round(averageWaitHours)}h / max ${Math.round(maxWaitHours)}h / stalled ${stalledCount}`,
        targetSectionId
      };
    };

    const attendancePending = pendingRows.filter((row) => row.channel === "attendance");
    const leavePending = pendingRows.filter((row) => row.channel === "leave");
    const cards = [
      toRiskCard("all", "Overall delay risk", pendingRows, "request-search-sort"),
      toRiskCard("attendance", "Attendance delay risk", attendancePending, "attendance"),
      toRiskCard("leave", "Leave delay risk", leavePending, "leave")
    ];

    return cards.sort((left, right) => {
      const severityDiff = bottleneckSeverityRank(right.severity) - bottleneckSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      const scoreDiff = right.riskScore - left.riskScore;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return right.pendingCount - left.pendingCount;
    });
  }, [requestSearchRows]);

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
      detail: `${request.leaveType} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)}`
    }));

    return [...attendanceItems, ...leaveItems]
      .sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))
      .slice(0, 12);
  }, [attendance, leaveRequests]);

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

  const requestBottleneckFeedbackCards = useMemo<RequestBottleneckFeedbackCard[]>(() => {
    const cards: RequestBottleneckFeedbackCard[] = [];

    if (totalPendingRequestCount > 0) {
      cards.push({
        key: "pending",
        label: "승인 대기 누적",
        severity: totalPendingRequestCount >= 4 ? "critical" : "watch",
        count: totalPendingRequestCount,
        detail: `출퇴근 ${attendanceStatusSummary.pending}건 / 휴가 ${leaveStatusSummary.pending}건이 승인 대기 중입니다.`,
        targetSectionId: "request-feedback"
      });
    }

    if (!attendancePreSubmitValid || !correctionValidation.isValid) {
      cards.push({
        key: "attendance-validation",
        label: "출퇴근 정정 제출 병목",
        severity: "watch",
        count: attendancePreSubmitChecks.filter((check) => !check.pass).length,
        detail:
          correctionValidation.message ||
          attendanceFirstFailCheck?.detail ||
          "출퇴근 정정 검증 항목을 확인해 주세요.",
        targetSectionId: "attendance"
      });
    }

    if (!leavePreSubmitValid) {
      cards.push({
        key: "leave-validation",
        label: "휴가 신청 제출 병목",
        severity: leaveType === "ANNUAL" ? "critical" : "watch",
        count: leavePreSubmitChecks.filter((check) => !check.pass).length,
        detail: leaveFirstFailCheck?.detail || "휴가 신청 검증 항목을 확인해 주세요.",
        targetSectionId: "leave"
      });
    }

    if (resubmitCandidates.length > 0 && !resubmitFlowReady) {
      cards.push({
        key: "resubmit-flow",
        label: "재제출 흐름 병목",
        severity: "watch",
        count: resubmitCandidates.length,
        detail: resubmitFirstFailCheck?.detail || "재제출 후보 선택/초안 반영 상태를 확인해 주세요.",
        targetSectionId: "request-resubmit"
      });
    }

    if (stats.fail > 0) {
      cards.push({
        key: "api-fail",
        label: "API 실패 병목",
        severity: "critical",
        count: stats.fail,
        detail: latestFailureCauseMessage || "최근 API 실패 응답을 먼저 점검해 주세요.",
        targetSectionId: "request-feedback"
      });
    }

    if (cards.length === 0) {
      cards.push({
        key: "clear",
        label: "현재 병목 없음",
        severity: "normal",
        count: 0,
        detail: "현재 요청 흐름에서 즉시 조치가 필요한 병목이 없습니다.",
        targetSectionId: "self-service-overview"
      });
    }

    return cards
      .slice()
      .sort((left, right) => {
        const severityDiff = bottleneckSeverityRank(right.severity) - bottleneckSeverityRank(left.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return right.count - left.count;
      })
      .slice(0, 5);
  }, [
    attendanceFirstFailCheck,
    attendancePreSubmitChecks,
    attendancePreSubmitValid,
    attendanceStatusSummary.pending,
    correctionValidation.isValid,
    correctionValidation.message,
    latestFailureCauseMessage,
    leaveFirstFailCheck,
    leavePreSubmitChecks,
    leavePreSubmitValid,
    leaveStatusSummary.pending,
    leaveType,
    resubmitCandidates.length,
    resubmitFirstFailCheck,
    resubmitFlowReady,
    stats.fail,
    totalPendingRequestCount
  ]);

  const mobileSubmitGuideCards = useMemo<MobileSubmitGuideCard[]>(() => {
    const attendancePassCount = attendancePreSubmitChecks.filter((check) => check.pass).length;
    const leavePassCount = leavePreSubmitChecks.filter((check) => check.pass).length;
    const resubmitPassCount = resubmitFlowChecks.filter((check) => check.pass).length;
    const attendanceReady =
      attendancePreSubmitValid && correctionValidation.isValid && lastAttendanceId.trim().length > 0;

    return [
      {
        key: "attendance",
        label: "출퇴근 정정 가이드",
        ready: attendanceReady,
        progressLabel: `${attendancePassCount}/${attendancePreSubmitChecks.length} 검증 통과`,
        detail: attendanceReady
          ? "정정 요청 버튼으로 바로 제출할 수 있습니다."
          : correctionValidation.message || attendanceFirstFailCheck?.detail || "정정 입력 보완이 필요합니다.",
        targetSectionId: "attendance",
        ctaLabel: attendanceReady ? "정정 요청으로 이동" : "출퇴근 입력 보완",
        tone: attendanceReady ? "ready" : "fail"
      },
      {
        key: "leave",
        label: "휴가 신청 가이드",
        ready: leavePreSubmitValid,
        progressLabel: `${leavePassCount}/${leavePreSubmitChecks.length} 검증 통과`,
        detail: leavePreSubmitValid
          ? `예상 신청 ${formatDays(estimatedLeaveRequestedDays)}일 기준으로 제출 가능합니다.`
          : leaveFirstFailCheck?.detail || "휴가 신청 입력 보완이 필요합니다.",
        targetSectionId: "leave",
        ctaLabel: leavePreSubmitValid ? "휴가 신청으로 이동" : "휴가 입력 보완",
        tone: leavePreSubmitValid ? "ready" : "fail"
      },
      {
        key: "resubmit",
        label: "재제출 가이드",
        ready: resubmitFlowReady,
        progressLabel: `${resubmitPassCount}/${resubmitFlowChecks.length} 검증 통과`,
        detail: resubmitFlowReady
          ? "초안 반영이 완료되어 재제출 폼으로 이동할 수 있습니다."
          : resubmitCandidates.length > 0
            ? resubmitFirstFailCheck?.detail || "재제출 후보 선택이 필요합니다."
            : "반려/취소된 요청이 없어 재제출 대상이 없습니다.",
        targetSectionId: "request-resubmit",
        ctaLabel: resubmitFlowReady ? "재제출 흐름으로 이동" : "재제출 후보 확인",
        tone: resubmitCandidates.length === 0 ? "pending" : resubmitFlowReady ? "ready" : "fail"
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
    resubmitCandidates.length,
    resubmitFirstFailCheck,
    resubmitFlowChecks,
    resubmitFlowReady
  ]);

  const mobileFollowUpGuideCards = useMemo<MobileFollowUpGuideCard[]>(() => {
    const highestWaitPrediction = approvalWaitPredictionCards[0];
    const hasPendingWaitRisk =
      highestWaitPrediction &&
      highestWaitPrediction.pendingCount > 0 &&
      highestWaitPrediction.severity !== "normal";

    return [
      {
        key: "pending-follow-up",
        label: "승인 대기 후속",
        tone:
          totalPendingRequestCount === 0
            ? "ready"
            : highestWaitPrediction?.severity === "critical"
              ? "fail"
              : "pending",
        detail:
          totalPendingRequestCount === 0
            ? "현재 승인 대기 요청이 없습니다."
            : `${totalPendingRequestCount}건 대기 / 예측 ${highestWaitPrediction?.etaLabel ?? "within 24h"}`,
        ctaLabel: totalPendingRequestCount > 0 ? "대기 요청 보기" : "요청 피드백 보기",
        targetSectionId: totalPendingRequestCount > 0 ? "request-search-sort" : "request-feedback"
      },
      {
        key: "wait-prediction",
        label: "승인 대기 예측 피드백",
        tone: hasPendingWaitRisk
          ? highestWaitPrediction?.severity === "critical"
            ? "fail"
            : "pending"
          : "ready",
        detail: hasPendingWaitRisk
          ? highestWaitPrediction?.detail ?? "승인 대기 예측 신호를 확인해 주세요."
          : "현재 예측상 즉시 후속 조치가 필요한 병목은 없습니다.",
        ctaLabel: "예측 패널 열기",
        targetSectionId: "request-wait-prediction"
      },
      {
        key: "resubmit-follow-up",
        label: "반려/재제출 후속",
        tone: resubmitCandidates.length === 0 ? "ready" : resubmitFlowReady ? "pending" : "fail",
        detail:
          resubmitCandidates.length === 0
            ? "재제출 대상 요청이 없습니다."
            : resubmitFlowReady
              ? "재제출 검증이 완료되어 제출만 남았습니다."
              : resubmitFirstFailCheck?.detail || "재제출 초안 보완이 필요합니다.",
        ctaLabel: resubmitCandidates.length > 0 ? "재제출 흐름 열기" : "모바일 제출 가이드",
        targetSectionId: resubmitCandidates.length > 0 ? "request-resubmit" : "mobile-submit-guide"
      },
      {
        key: "api-failure-follow-up",
        label: "API 실패 후속",
        tone: stats.fail > 0 ? "fail" : "ready",
        detail:
          stats.fail > 0
            ? latestFailureCauseMessage || "최근 API 실패 원인을 확인하고 다시 시도해 주세요."
            : "최근 API 실패가 없습니다.",
        ctaLabel: stats.fail > 0 ? "실패 원인 보기" : "요청 이력 보기",
        targetSectionId: stats.fail > 0 ? "request-feedback" : "request-timeline"
      }
    ];
  }, [
    approvalWaitPredictionCards,
    latestFailureCauseMessage,
    resubmitCandidates.length,
    resubmitFirstFailCheck,
    resubmitFlowReady,
    stats.fail,
    totalPendingRequestCount
  ]);

  const mobileFollowUpRecommendationCards = useMemo<MobileFollowUpRecommendationCard[]>(() => {
    const highestSortAccuracyRisk = requestHistorySortAccuracyCards[0];
    const highestDelayRisk = approvalDelayRiskPredictionCards[0];
    const hasSortAccuracyRisk =
      highestSortAccuracyRisk &&
      highestSortAccuracyRisk.totalCompared > 0 &&
      highestSortAccuracyRisk.severity !== "normal";
    const hasDelayRisk = highestDelayRisk && highestDelayRisk.pendingCount > 0 && highestDelayRisk.severity !== "normal";

    return [
      {
        key: "sort-accuracy",
        label: "Sort accuracy follow-up",
        tone: hasSortAccuracyRisk ? (highestSortAccuracyRisk?.severity === "critical" ? "fail" : "pending") : "ready",
        detail: hasSortAccuracyRisk
          ? highestSortAccuracyRisk?.detail ?? "Review sort accuracy risk cards."
          : "Current sort order is stable for top request history rows.",
        ctaLabel: "Open sort accuracy panel",
        targetSectionId: "request-history-sort-accuracy"
      },
      {
        key: "delay-risk",
        label: "Approval delay risk follow-up",
        tone: hasDelayRisk ? (highestDelayRisk?.severity === "critical" ? "fail" : "pending") : "ready",
        detail: hasDelayRisk
          ? highestDelayRisk?.detail ?? "Review delay risk prediction cards."
          : "No immediate approval delay risk in pending requests.",
        ctaLabel: "Open delay risk panel",
        targetSectionId: "approval-delay-risk-prediction"
      },
      {
        key: "resubmit-follow-up",
        label: "Resubmit follow-up",
        tone: resubmitCandidates.length === 0 ? "ready" : resubmitFlowReady ? "pending" : "fail",
        detail:
          resubmitCandidates.length === 0
            ? "No rejected/canceled requests require resubmission."
            : resubmitFlowReady
              ? "Resubmit flow is ready. Complete final submission."
              : resubmitFirstFailCheck?.detail || "Review resubmit draft and validation.",
        ctaLabel: resubmitCandidates.length > 0 ? "Open resubmit flow" : "Open mobile submit guide",
        targetSectionId: resubmitCandidates.length > 0 ? "request-resubmit" : "mobile-submit-guide"
      },
      {
        key: "api-failure-follow-up",
        label: "API recovery follow-up",
        tone: stats.fail > 0 ? "fail" : "ready",
        detail:
          stats.fail > 0
            ? latestFailureCauseMessage || "Investigate API failure cause and retry."
            : "No recent API failures detected.",
        ctaLabel: stats.fail > 0 ? "Open request feedback" : "Open request timeline",
        targetSectionId: stats.fail > 0 ? "request-feedback" : "request-timeline"
      }
    ];
  }, [
    approvalDelayRiskPredictionCards,
    latestFailureCauseMessage,
    requestHistorySortAccuracyCards,
    resubmitCandidates.length,
    resubmitFirstFailCheck,
    resubmitFlowReady,
    stats.fail
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

        <article className="panel panel-self-service-overview" id="self-service-overview">
          <h2>근태/휴가 통합 요약 카드</h2>
          <p className="small">
            현재 조회 구간의 요청 상태를 한 번에 보고, 재제출 필요 건과 API 실패 신호를 함께 점검합니다.
          </p>
          <div className="integrated-summary-grid" aria-label="employee integrated summary cards">
            {integratedSummaryCards.map((card) => (
              <article key={card.key} className={`integrated-summary-card tone-${card.tone}`}>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.detail}</span>
              </article>
            ))}
          </div>
        </article>

        <article className="panel panel-submit-checklist" id="submit-checklist">
          <h2>정정/휴가 제출 체크리스트 통합</h2>
          <p className="small">
            출퇴근 정정, 휴가 신청, 재제출 흐름의 제출 가능 상태를 한 화면에서 점검합니다.
          </p>
          <div className="submit-checklist-grid" aria-label="integrated submit checklist">
            {integratedSubmitChecklistCards.map((card) => (
              <article key={card.key} className={`submit-checklist-card ${card.ready ? "is-ready" : "is-blocked"}`}>
                <p>{card.label}</p>
                <strong>
                  {card.passCount}/{card.totalCount}
                </strong>
                <span>{card.detail}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  관련 섹션 이동
                </button>
              </article>
            ))}
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
          <div className="request-filter-row">
            <label>
              상태 필터
              <select
                value={requestFeedbackStatusFilter}
                onChange={(event) => setRequestFeedbackStatusFilter(event.target.value as RequestStatusFilter)}
              >
                <option value="all">전체</option>
                <option value="PENDING">대기</option>
                <option value="APPROVED">승인</option>
                <option value="REJECTED">반려</option>
                <option value="CANCELED">취소</option>
              </select>
            </label>
          </div>
          {filteredRequestFeedbackRows.length === 0 ? (
            <p className="small muted" style={{ marginTop: 10 }}>
              현재 필터 조건에서 표시할 요청 피드백이 없습니다.
            </p>
          ) : (
            <ul className="simple-list feedback-row-list" aria-label="요청 상태 피드백">
              {filteredRequestFeedbackRows.map((row) => (
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

        <article className="panel panel-request-search-sort" id="request-search-sort">
          <h2>요청 검색/정렬</h2>
          <p className="small">
            출퇴근/휴가 요청을 통합 목록에서 검색하고, 대기 우선 또는 시간순으로 정렬해 후속 조치 대상을 빠르게 찾습니다.
          </p>
          <div className="request-search-toolbar">
            <label>
              검색 범위
              <select
                value={requestSearchScope}
                onChange={(event) => setRequestSearchScope(event.target.value as RequestSearchScope)}
              >
                <option value="all">전체</option>
                <option value="request_id">요청 ID</option>
                <option value="status">상태</option>
                <option value="content">내용</option>
              </select>
            </label>
            <label className="full">
              검색어
              <input
                value={requestSearchQuery}
                onChange={(event) => setRequestSearchQuery(event.target.value)}
                placeholder="예: pending, REQ-..., 메모/사유"
              />
            </label>
            <label>
              정렬
              <select
                value={requestSortOption}
                onChange={(event) => setRequestSortOption(event.target.value as RequestSortOption)}
              >
                <option value="pending_first">대기 우선</option>
                <option value="latest_desc">최신순</option>
                <option value="oldest_asc">오래된순</option>
                <option value="status">상태순</option>
              </select>
            </label>
            <div className="request-search-actions">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setRequestSearchScope("all");
                  setRequestSearchQuery("");
                  setRequestSortOption("pending_first");
                }}
              >
                필터 초기화
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={openPendingRequestSearch}>
                대기만 보기
              </button>
            </div>
          </div>
          {filteredRequestSearchRows.length === 0 ? (
            <p className="small muted">현재 조건에서 표시할 요청이 없습니다.</p>
          ) : (
            <ul className="request-search-list" aria-label="request search and sort list">
              {filteredRequestSearchRows.slice(0, 24).map((row) => (
                <li key={row.key}>
                  <div className="request-search-head">
                    <strong>
                      [{row.channel}] {row.requestId}
                    </strong>
                    <span className={`feedback-state-pill state-${statusToTone(row.status)}`}>{row.status}</span>
                  </div>
                  <p>{row.summary}</p>
                  <p className="small muted">{row.detail}</p>
                  <div className="request-search-meta">
                    <span className="queue-history-chip">{formatDateTime(row.at)}</span>
                    {row.status === "PENDING" ? (
                      <span className="queue-history-chip">pending {Math.round(row.pendingHours)}h</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel panel-request-bottleneck-feedback" id="request-bottleneck-feedback">
          <h2>요청 병목 구간 피드백</h2>
          <p className="small">
            승인 대기, 제출 검증 실패, API 실패를 병목 우선순위로 정리해 빠르게 처리 순서를 잡습니다.
          </p>
          <ul className="request-bottleneck-list" aria-label="request bottleneck feedback list">
            {requestBottleneckFeedbackCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="request-bottleneck-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">count {card.count}</span>
                </div>
                <p>{card.detail}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  바로 확인
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-request-wait-prediction" id="request-wait-prediction">
          <h2>승인 대기 예측 피드백</h2>
          <p className="small">
            현재 대기 요청의 평균/최대 대기시간을 기반으로 승인 지연 위험을 예측하고, 우선 확인할 화면으로 바로 이동합니다.
          </p>
          <ul className="request-wait-prediction-list" aria-label="request wait prediction feedback list">
            {approvalWaitPredictionCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="request-wait-prediction-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">ETA {card.etaLabel}</span>
                </div>
                <p>{card.detail}</p>
                <div className="request-wait-prediction-meta">
                  <span className="queue-history-chip">pending {card.pendingCount}</span>
                  <span className="queue-history-chip">avg {Math.round(card.averageWaitHours)}h</span>
                  <span className="queue-history-chip">max {Math.round(card.maxWaitHours)}h</span>
                  <span className="queue-history-chip">breach {card.predictedBreaches}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  관련 화면 이동
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-request-history-sort-accuracy" id="request-history-sort-accuracy">
          <h2>요청 이력 정렬 정확도</h2>
          <p className="small">
            현재 정렬 결과의 상단 이력이 기준 정렬 모델과 얼마나 일치하는지 점수로 확인하고 후속 정렬 액션을 결정합니다.
          </p>
          <ul className="request-history-sort-accuracy-list" aria-label="request history sort accuracy feedback list">
            {requestHistorySortAccuracyCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="request-history-sort-accuracy-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">score {card.accuracyScore}</span>
                </div>
                <p>{card.detail}</p>
                <div className="request-history-sort-accuracy-meta">
                  <span className="queue-history-chip">
                    match {card.matchedCount}/{card.totalCompared}
                  </span>
                  <span className="queue-history-chip">severity {card.severity}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  정렬 보드 열기
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-approval-delay-risk-prediction" id="approval-delay-risk-prediction">
          <h2>승인 지연 위험 예측 피드백</h2>
          <p className="small">
            채널별 대기 요청의 지연 위험 점수와 임계치 도달 건수를 확인해 우선 처리 대상을 빠르게 판단합니다.
          </p>
          <ul className="approval-delay-risk-prediction-list" aria-label="approval delay risk prediction feedback list">
            {approvalDelayRiskPredictionCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="approval-delay-risk-prediction-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">risk {card.riskScore}</span>
                </div>
                <p>{card.detail}</p>
                <div className="approval-delay-risk-prediction-meta">
                  <span className="queue-history-chip">pending {card.pendingCount}</span>
                  <span className="queue-history-chip">stalled {card.stalledCount}</span>
                  <span className="queue-history-chip">critical {card.criticalCount}</span>
                  <span className="queue-history-chip">eta {card.etaLabel}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  관련 섹션 이동
                </button>
              </li>
            ))}
          </ul>
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

        <article className="panel panel-mobile-status-badges" id="mobile-status-badges">
          <h2>모바일 상태 알림 배지</h2>
          <p className="small">대기/재제출/승인/API 실패 상태를 배지로 확인하고 필요한 화면으로 바로 이동합니다.</p>
          <ul className="mobile-status-badge-list" aria-label="mobile status badges">
            {mobileStatusBadges.map((badge) => (
              <li key={badge.key} className={`tone-${badge.tone}`}>
                <span>{badge.label}</span>
                <strong>{badge.count}</strong>
                <p>{badge.detail}</p>
              </li>
            ))}
          </ul>
          <div className="mobile-status-actions">
            <button className="btn btn-secondary btn-small" onClick={() => jumpToSection("request-resubmit")}>
              재제출 흐름
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => jumpToSection("request-feedback")}>
              요청 피드백
            </button>
            <button className="btn btn-primary btn-small" onClick={() => void refreshEmployeeSnapshot()}>
              상태 새로고침
            </button>
          </div>
        </article>

        <article className="panel panel-mobile-submit-guide" id="mobile-submit-guide">
          <h2>모바일 제출 가이드</h2>
          <p className="small">
            모바일 기준으로 제출 준비도와 다음 조치를 안내합니다. 가이드 카드에서 바로 해당 입력 화면으로 이동할 수 있습니다.
          </p>
          <ul className="mobile-submit-guide-list" aria-label="mobile submit guide list">
            {mobileSubmitGuideCards.map((card) => (
              <li key={card.key} className={`tone-${card.tone}`}>
                <div className="mobile-submit-guide-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">{card.progressLabel}</span>
                </div>
                <p>{card.detail}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  {card.ctaLabel}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-mobile-follow-up-guide" id="mobile-follow-up-guide">
          <h2>모바일 후속 액션 가이드</h2>
          <p className="small">
            제출 이후 필요한 후속 작업을 모바일 카드로 정리했습니다. 카드별 액션으로 관련 화면으로 바로 이동합니다.
          </p>
          <ul className="mobile-follow-up-guide-list" aria-label="mobile follow-up action guide list">
            {mobileFollowUpGuideCards.map((card) => (
              <li key={card.key} className={`tone-${card.tone}`}>
                <div className="mobile-follow-up-guide-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">{card.tone}</span>
                </div>
                <p>{card.detail}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => runMobileFollowUpAction(card)}
                >
                  {card.ctaLabel}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-mobile-follow-up-recommendation" id="mobile-follow-up-recommendation">
          <h2>모바일 후속 액션 추천</h2>
          <p className="small">
            정렬 정확도와 승인 지연 위험 상태를 반영해 지금 바로 실행할 후속 액션을 우선순위로 추천합니다.
          </p>
          <ul className="mobile-follow-up-recommendation-list" aria-label="mobile follow-up recommendation guide list">
            {mobileFollowUpRecommendationCards.map((card) => (
              <li key={card.key} className={`tone-${card.tone}`}>
                <div className="mobile-follow-up-recommendation-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">{card.tone}</span>
                </div>
                <p>{card.detail}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => runMobileFollowUpRecommendationAction(card)}
                >
                  {card.ctaLabel}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-request-timeline" id="request-timeline">
          <h2>모바일 요청 이력 타임라인</h2>
          <p className="small">최근 요청을 시간순으로 보고 채널/상태 기준으로 빠르게 필터링합니다.</p>
          <div className="timeline-filter-grid">
            <label>
              채널
              <select
                value={timelineChannelFilter}
                onChange={(event) => setTimelineChannelFilter(event.target.value as TimelineChannelFilter)}
              >
                <option value="all">전체</option>
                <option value="attendance">출퇴근</option>
                <option value="leave">휴가</option>
              </select>
            </label>
            <label>
              상태
              <select
                value={timelineStatusFilter}
                onChange={(event) => setTimelineStatusFilter(event.target.value as RequestStatusFilter)}
              >
                <option value="all">전체</option>
                <option value="PENDING">대기</option>
                <option value="APPROVED">승인</option>
                <option value="REJECTED">반려</option>
                <option value="CANCELED">취소</option>
              </select>
            </label>
          </div>
          {filteredMobileRequestTimeline.length === 0 ? (
            <p className="small muted">현재 필터 조건에서 표시할 모바일 요청 이력이 없습니다.</p>
          ) : (
            <ul className="mobile-request-timeline-list" aria-label="모바일 요청 이력 타임라인">
              {filteredMobileRequestTimeline.map((item) => (
                <li key={item.id}>
                  <div className="timeline-head">
                    <strong>{item.channel === "attendance" ? "출퇴근" : "휴가"}</strong>
                    <span className={`feedback-state-pill state-${statusToTone(item.status)}`}>{item.status}</span>
                  </div>
                  <p>{item.detail}</p>
                  <time>{formatDateTime(item.at)}</time>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel panel-request-resubmit" id="request-resubmit">
          <h2>요청 수정/재제출 흐름</h2>
          <p className="small">
            반려/취소된 요청을 선택해 초안을 폼으로 불러오고, 검증 상태를 확인한 뒤 재제출합니다.
          </p>
          <div className="input-grid">
            <label className="full">
              재제출 후보
              <select
                value={selectedResubmitCandidateKey}
                onChange={(event) => setSelectedResubmitCandidateKey(event.target.value)}
              >
                <option value="">최신 후보 자동 선택</option>
                {resubmitCandidates.map((candidate) => (
                  <option key={candidate.key} value={candidate.key}>
                    {candidate.channel === "attendance" ? "출퇴근" : "휴가"} / {candidate.status} / {candidate.recordId}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary btn-small" onClick={applySelectedResubmitCandidate}>
              선택 초안 적용
            </button>
            <button className="btn btn-secondary btn-small" onClick={applyLatestResubmitCandidate}>
              최신 반려 불러오기
            </button>
            <button className="btn btn-secondary btn-small" onClick={clearResubmitSelection}>
              재제출 선택 초기화
            </button>
          </div>
          <div className="pre-submit-check-wrap">
            <p className="small" style={{ margin: "8px 0 0" }}>
              흐름 검증 ({resubmitFlowChecks.filter((check) => check.pass).length}/{resubmitFlowChecks.length} 통과)
            </p>
            <ul className="pre-submit-check-list" aria-label="재제출 흐름 검증">
              {resubmitFlowChecks.map((check) => (
                <li key={check.id} className={check.pass ? "pass" : "fail"}>
                  <strong>{check.pass ? "PASS" : "FAIL"}</strong>
                  <span>{check.label}</span>
                  <p>{check.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          {selectedResubmitCandidate ? (
            <article className="resubmit-detail-card">
              <div className="resubmit-detail-head">
                <strong>
                  {selectedResubmitCandidate.channel === "attendance" ? "출퇴근 재제출" : "휴가 재제출"}
                </strong>
                <span className="feedback-state-pill state-fail">{selectedResubmitCandidate.status}</span>
              </div>
              <p>{selectedResubmitCandidate.summary}</p>
              <p className="small muted">사유: {selectedResubmitCandidate.reason}</p>
              <p className="small muted">ID: {selectedResubmitCandidate.recordId}</p>
            </article>
          ) : (
            <p className="small muted" style={{ marginTop: 10 }}>
              현재 재제출 후보가 없습니다.
            </p>
          )}
          <ul className="resubmit-candidate-list" aria-label="resubmit candidate list">
            {resubmitCandidates.length === 0 ? (
              <li>
                <strong>EMPTY</strong>
                <span className="muted">반려/취소 요청이 없습니다.</span>
              </li>
            ) : (
              resubmitCandidates.map((candidate) => (
                <li key={candidate.key}>
                  <div>
                    <strong>
                      {candidate.channel === "attendance" ? "출퇴근" : "휴가"} / {candidate.recordId}
                    </strong>
                    <p>{candidate.summary}</p>
                    <span className="muted">{candidate.reason}</span>
                  </div>
                  <div className="resubmit-candidate-actions">
                    {candidate.key === lastAppliedResubmitCandidateKey ? (
                      <span className="resubmit-applied-chip">APPLIED</span>
                    ) : null}
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setSelectedResubmitCandidateKey(candidate.key);
                        applyResubmitCandidateToDraft(candidate);
                      }}
                    >
                      초안 적용
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
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
          <div className="pre-submit-check-wrap">
            <p className="small" style={{ margin: "8px 0 0" }}>
              제출 직전 검증 ({attendancePreSubmitChecks.filter((check) => check.pass).length}/
              {attendancePreSubmitChecks.length} 통과)
            </p>
            <ul className="pre-submit-check-list" aria-label="출퇴근 제출 직전 검증">
              {attendancePreSubmitChecks.map((check) => (
                <li key={check.id} className={check.pass ? "pass" : "fail"}>
                  <strong>{check.pass ? "PASS" : "FAIL"}</strong>
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
          <div className="pre-submit-check-wrap">
            <p className="small" style={{ margin: "8px 0 0" }}>
              제출 직전 검증 ({leavePreSubmitChecks.filter((check) => check.pass).length}/{leavePreSubmitChecks.length}
              통과)
            </p>
            <ul className="pre-submit-check-list" aria-label="휴가 제출 직전 검증">
              {leavePreSubmitChecks.map((check) => (
                <li key={check.id} className={check.pass ? "pass" : "fail"}>
                  <strong>{check.pass ? "PASS" : "FAIL"}</strong>
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

