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

  async function refreshEmployeeSnapshot() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);

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
          <progress max={100} value={leaveUsageRatePercent} style={{ width: "100%" }} />
          {leaveCalendarRows.length === 0 ? (
            <p className="small" style={{ marginTop: 12 }}>
              이번 조회 구간에 휴가 일정이 없습니다.
            </p>
          ) : (
            <ul className="simple-list" style={{ marginTop: 12 }}>
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

