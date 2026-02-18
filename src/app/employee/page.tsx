"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

  const [leaveType, setLeaveType] = useState<"ANNUAL" | "SICK" | "UNPAID">("ANNUAL");
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
  const usesBearerToken = accessToken.trim().length > 0;
  const newestLog = logs[0];

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
        headers.authorization = `Bearer ${accessToken.trim()}`;
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
      setAttendance(records.slice().reverse().slice(-10).reverse());
      const pending = records.find((record) => record.state === "PENDING");
      if (pending) {
        setLastAttendanceId(pending.id);
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
    return `잔여 ${leaveBalance.remainingDays}일 (부여 ${leaveBalance.grantedDays}일, 사용 ${leaveBalance.usedDays}일)`;
  }, [leaveBalance]);

  return (
    <main className="console-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR Employee</p>
        <h1>직원 셀프서비스 (출퇴근 · 휴가)</h1>
        <p className="hero-copy">
          셀프서비스 목표: 휴가 신청/정정 요청을 90초 내 완료할 수 있는 UX를 만든다.
        </p>
        <div className="hero-meta">
          <span>
            Runtime Supabase URL <code>{supabaseUrl}</code>
          </span>
          <span>Auth Mode {usesBearerToken ? "Bearer Token" : "Dev Header"}</span>
          <span>API 성공률 {stats.successRate}%</span>
          <Link className="btn btn-secondary" href="/">
            커맨드 센터
          </Link>
          <Link className="btn btn-secondary" href="/ops/mvp-console">
            검증 콘솔
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>내 계정 컨텍스트</h2>
          <p className="small">
            employee 권한은 <strong>본인 데이터</strong>만 처리할 수 있습니다. (payload의 employeeId는 actor
            id와 동일해야 합니다.)
          </p>
          <div className="input-grid">
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
            <label className="full">
              Bearer Access Token (선택)
              <textarea
                rows={3}
                placeholder="비어 있으면 x-actor-* 헤더 모드가 사용됩니다."
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
              />
            </label>
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
              <input type="datetime-local" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void refreshEmployeeSnapshot()}>
              내 데이터 새로고침
            </button>
          </div>
        </article>

        <article className="panel">
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
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createAttendance()}>
              출퇴근 기록 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void checkOutNow()} disabled={!lastAttendanceId}>
              퇴근 처리(지금)
            </button>
            <button className="btn btn-secondary" onClick={() => void requestAttendanceCorrection()} disabled={!lastAttendanceId}>
              출퇴근 정정(요청)
            </button>
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
                  <time>{record.id}</time>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="panel">
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
              시작일
              <input type="datetime-local" value={leaveStartDate} onChange={(event) => setLeaveStartDate(event.target.value)} />
            </label>
            <label>
              종료일
              <input type="datetime-local" value={leaveEndDate} onChange={(event) => setLeaveEndDate(event.target.value)} />
            </label>
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
                    {request.leaveType} / {formatDateTime(request.startDate)} ~ {formatDateTime(request.endDate)} ({request.days}일)
                  </span>
                  <time>{request.id}</time>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="panel">
          <h2>근무 일정</h2>
          <div className="actions">
            <Link className="btn btn-secondary" href="/ops/scheduling-cockpit">
              스케줄링 Cockpit
            </Link>
          </div>
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
      </section>
    </main>
  );
}

