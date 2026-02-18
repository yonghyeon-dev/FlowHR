"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ActorRole = "admin" | "manager" | "employee" | "payroll_operator" | "system";
type AttendanceListState = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type LeaveListState = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
type PayrollListState = "ALL" | "PREVIEWED" | "CONFIRMED";

type ActorContext = {
  role: ActorRole;
  id: string;
};

type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
  body: unknown;
};

type QueueSnapshot = {
  pendingAttendance: number;
  pendingLeave: number;
  pendingPayroll: number;
  refreshedAt: string | null;
};

type OrganizationSummary = {
  id: string;
  name: string;
};

type EmployeeSummary = {
  id: string;
  organizationId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
};

function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function firstDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
}

function lastDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0));
}

function defaultWorkScheduleStartLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0));
}

function defaultWorkScheduleEndLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0));
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

function readArrayCount(body: unknown, key: string) {
  if (!body || typeof body !== "object") {
    return 0;
  }
  const value = (body as Record<string, unknown>)[key];
  return Array.isArray(value) ? value.length : 0;
}

export default function HomePage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [employeeActorId, setEmployeeActorId] = useState("EMP-1001");
  const [managerActorId, setManagerActorId] = useState("MGR-1001");
  const [payrollActorId, setPayrollActorId] = useState("PAY-1001");
  const [adminActorId, setAdminActorId] = useState("ADM-1001");
  const [systemActorId, setSystemActorId] = useState("SYS-1001");

  const [peopleOrganizationName, setPeopleOrganizationName] = useState("FlowHR Demo Org");
  const [peopleOrganizations, setPeopleOrganizations] = useState<OrganizationSummary[]>([]);

  const [peopleEmployeeId, setPeopleEmployeeId] = useState("EMP-1001");
  const [peopleEmployeeName, setPeopleEmployeeName] = useState("");
  const [peopleEmployeeEmail, setPeopleEmployeeEmail] = useState("");
  const [peopleEmployeeActive, setPeopleEmployeeActive] = useState(true);
  const [peopleEmployees, setPeopleEmployees] = useState<EmployeeSummary[]>([]);
  const [peopleEmployeeActiveFilter, setPeopleEmployeeActiveFilter] = useState<
    "ALL" | "true" | "false"
  >("ALL");

  const [attendanceEmployeeId, setAttendanceEmployeeId] = useState("EMP-1001");
  const [checkInAt, setCheckInAt] = useState(firstDayOfMonthLocal());
  const [checkOutAt, setCheckOutAt] = useState(lastDayOfMonthLocal());
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [isHoliday, setIsHoliday] = useState(false);
  const [lastAttendanceId, setLastAttendanceId] = useState("");

  const [scheduleEmployeeId, setScheduleEmployeeId] = useState("EMP-1001");
  const [scheduleStartAt, setScheduleStartAt] = useState(defaultWorkScheduleStartLocal());
  const [scheduleEndAt, setScheduleEndAt] = useState(defaultWorkScheduleEndLocal());
  const [scheduleBreakMinutes, setScheduleBreakMinutes] = useState("60");
  const [scheduleIsHoliday, setScheduleIsHoliday] = useState(false);
  const [scheduleNotes, setScheduleNotes] = useState("");

  const [payrollEmployeeId, setPayrollEmployeeId] = useState("EMP-1001");
  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());
  const [hourlyRateKrw, setHourlyRateKrw] = useState("12000");
  const [lastPayrollRunId, setLastPayrollRunId] = useState("");

  const [leaveEmployeeId, setLeaveEmployeeId] = useState("EMP-1001");
  const [leaveType, setLeaveType] = useState<"ANNUAL" | "SICK" | "UNPAID">("ANNUAL");
  const [leaveStartDate, setLeaveStartDate] = useState(firstDayOfMonthLocal());
  const [leaveEndDate, setLeaveEndDate] = useState(firstDayOfMonthLocal());
  const [leaveReason, setLeaveReason] = useState("MVP manual verification");
  const [lastLeaveRequestId, setLastLeaveRequestId] = useState("");

  const [attendanceListState, setAttendanceListState] = useState<AttendanceListState>("ALL");
  const [leaveListState, setLeaveListState] = useState<LeaveListState>("ALL");
  const [payrollListState, setPayrollListState] = useState<PayrollListState>("ALL");

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [queueSnapshot, setQueueSnapshot] = useState<QueueSnapshot>({
    pendingAttendance: 0,
    pendingLeave: 0,
    pendingPayroll: 0,
    refreshedAt: null
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not configured";
  const usesBearerToken = accessToken.trim().length > 0;
  const newestLog = logs[0];

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PUT" | "PATCH",
    path: string,
    actor: ActorContext,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }

      if (usesBearerToken) {
        headers.authorization = `Bearer ${accessToken.trim()}`;
      } else {
        headers["x-actor-role"] = actor.role;
        headers["x-actor-id"] = actor.id;
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

      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          status: response.status,
          ok: response.ok,
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

  function applyTenantOrganization(nextOrgId: string) {
    const normalized = nextOrgId.trim();
    if (!normalized) {
      return;
    }
    setOrganizationId(normalized);
  }

  function applyEmployeeDefaults(nextEmployeeId: string) {
    const normalized = nextEmployeeId.trim();
    if (!normalized) {
      return;
    }
    setEmployeeActorId(normalized);
    setAttendanceEmployeeId(normalized);
    setScheduleEmployeeId(normalized);
    setPayrollEmployeeId(normalized);
    setLeaveEmployeeId(normalized);
  }

  async function listPeopleOrganizations() {
    const { response, body } = await callApi(
      "People: 조직 목록 조회",
      "GET",
      "/api/people/organizations",
      { role: "system", id: systemActorId }
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { organizations?: OrganizationSummary[] };
    const organizations = Array.isArray(parsed.organizations) ? parsed.organizations : [];
    setPeopleOrganizations(organizations);
    if (organizationId.trim().length === 0 && organizations.length > 0) {
      applyTenantOrganization(organizations[0]!.id);
    }
  }

  async function createPeopleOrganization() {
    const name = peopleOrganizationName.trim();
    if (!name) {
      return;
    }
    const { response, body } = await callApi(
      "People: 조직 생성",
      "POST",
      "/api/people/organizations",
      { role: "system", id: systemActorId },
      { name }
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { organization?: { id?: string } };
    const createdOrgId = parsed.organization?.id;
    if (typeof createdOrgId === "string") {
      applyTenantOrganization(createdOrgId);
    }
    await listPeopleOrganizations();
  }

  async function listPeopleEmployees() {
    const query = buildQuery({
      active: peopleEmployeeActiveFilter === "ALL" ? undefined : peopleEmployeeActiveFilter,
      organizationId: organizationId.trim().length > 0 ? organizationId.trim() : undefined
    });

    const { response, body } = await callApi(
      "People: 직원 목록 조회",
      "GET",
      `/api/people/employees${query}`,
      { role: "system", id: systemActorId }
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { employees?: EmployeeSummary[] };
    setPeopleEmployees(Array.isArray(parsed.employees) ? parsed.employees : []);
  }

  async function createPeopleEmployee() {
    const id = peopleEmployeeId.trim();
    const orgId = organizationId.trim();
    if (!id || !orgId) {
      return;
    }

    const payload: Record<string, unknown> = {
      id,
      organizationId: orgId,
      active: peopleEmployeeActive
    };

    const name = peopleEmployeeName.trim();
    if (name.length > 0) {
      payload.name = name;
    }

    const email = peopleEmployeeEmail.trim();
    if (email.length > 0) {
      payload.email = email;
    }

    const { response } = await callApi(
      "People: 직원 생성",
      "POST",
      "/api/people/employees",
      { role: "system", id: systemActorId },
      payload
    );
    if (!response.ok) {
      return;
    }

    // 사내 도구의 기본 입력값을 방금 만든 직원 기준으로 맞춰둡니다.
    applyEmployeeDefaults(id);

    await listPeopleEmployees();
  }

  async function createAttendance() {
    const { response, body } = await callApi(
      "출퇴근 기록 생성",
      "POST",
      "/api/attendance/records",
      { role: "employee", id: employeeActorId },
      {
        employeeId: attendanceEmployeeId,
        checkInAt: toIso(checkInAt),
        checkOutAt: checkOutAt ? toIso(checkOutAt) : null,
        breakMinutes: Math.max(0, Math.trunc(coerceNumber(breakMinutes))),
        isHoliday
      }
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { record?: { id?: string } };
    if (parsed.record?.id) {
      setLastAttendanceId(parsed.record.id);
    }
  }

  async function approveAttendance() {
    if (!lastAttendanceId.trim()) {
      return;
    }
    await callApi(
      "출퇴근 승인",
      "POST",
      `/api/attendance/records/${lastAttendanceId}/approve`,
      { role: "manager", id: managerActorId }
    );
  }

  async function createLeaveRequest() {
    const { response, body } = await callApi(
      "휴가 요청 생성",
      "POST",
      "/api/leave/requests",
      { role: "employee", id: employeeActorId },
      {
        employeeId: leaveEmployeeId,
        leaveType,
        startDate: toIso(leaveStartDate),
        endDate: toIso(leaveEndDate),
        reason: leaveReason
      }
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { request?: { id?: string } };
    if (parsed.request?.id) {
      setLastLeaveRequestId(parsed.request.id);
    }
  }

  async function approveLeaveRequest() {
    if (!lastLeaveRequestId.trim()) {
      return;
    }
    await callApi(
      "휴가 승인",
      "POST",
      `/api/leave/requests/${lastLeaveRequestId}/approve`,
      { role: "manager", id: managerActorId }
    );
  }

  async function previewPayroll() {
    const { response, body } = await callApi(
      "급여 프리뷰",
      "POST",
      "/api/payroll/runs/preview",
      { role: "payroll_operator", id: payrollActorId },
      {
        periodStart: toIso(periodStart),
        periodEnd: toIso(periodEnd),
        employeeId: payrollEmployeeId,
        hourlyRateKrw: Math.max(1, Math.trunc(coerceNumber(hourlyRateKrw, 10000)))
      }
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { run?: { id?: string } };
    if (parsed.run?.id) {
      setLastPayrollRunId(parsed.run.id);
    }
  }

  async function confirmPayrollRun() {
    if (!lastPayrollRunId.trim()) {
      return;
    }
    await callApi(
      "급여 확정",
      "POST",
      `/api/payroll/runs/${lastPayrollRunId}/confirm`,
      { role: "payroll_operator", id: payrollActorId }
    );
  }

  async function createWorkSchedule() {
    await callApi(
      "근무 일정 생성",
      "POST",
      "/api/scheduling/schedules",
      { role: "manager", id: managerActorId },
      {
        employeeId: scheduleEmployeeId,
        startAt: toIso(scheduleStartAt),
        endAt: toIso(scheduleEndAt),
        breakMinutes: Math.max(0, Math.trunc(coerceNumber(scheduleBreakMinutes))),
        isHoliday: scheduleIsHoliday,
        notes: scheduleNotes.trim().length > 0 ? scheduleNotes.trim() : undefined
      }
    );
  }

  async function listAttendanceRecords(state = attendanceListState) {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const { body } = await callApi(
      "출퇴근 기록 조회",
      "GET",
      `/api/attendance/records${buildQuery({
        from,
        to,
        employeeId: attendanceEmployeeId,
        state: state === "ALL" ? undefined : state
      })}`,
      { role: "payroll_operator", id: payrollActorId }
    );
    return readArrayCount(body, "records");
  }

  async function listLeaveRequests(state = leaveListState) {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const { body } = await callApi(
      "휴가 요청 조회",
      "GET",
      `/api/leave/requests${buildQuery({
        from,
        to,
        employeeId: leaveEmployeeId,
        state: state === "ALL" ? undefined : state
      })}`,
      { role: "payroll_operator", id: payrollActorId }
    );
    return readArrayCount(body, "requests");
  }

  async function listPayrollRuns(state = payrollListState) {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const { body } = await callApi(
      "급여 Run 조회",
      "GET",
      `/api/payroll/runs${buildQuery({
        from,
        to,
        employeeId: payrollEmployeeId,
        state: state === "ALL" ? undefined : state
      })}`,
      { role: "payroll_operator", id: payrollActorId }
    );
    return readArrayCount(body, "runs");
  }

  async function listAttendanceAggregates() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    await callApi(
      "근태 집계 조회",
      "GET",
      `/api/attendance/aggregates${buildQuery({
        from,
        to,
        employeeId: attendanceEmployeeId
      })}`,
      { role: "payroll_operator", id: payrollActorId }
    );
  }

  async function listWorkSchedules() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    await callApi(
      "근무 일정 조회",
      "GET",
      `/api/scheduling/schedules${buildQuery({
        from,
        to,
        employeeId: scheduleEmployeeId
      })}`,
      { role: "payroll_operator", id: payrollActorId }
    );
  }

  async function refreshPriorityQueue() {
    const [attendanceCount, leaveCount, payrollCount] = await Promise.all([
      listAttendanceRecords("PENDING"),
      listLeaveRequests("PENDING"),
      listPayrollRuns("PREVIEWED")
    ]);

    setQueueSnapshot({
      pendingAttendance: attendanceCount,
      pendingLeave: leaveCount,
      pendingPayroll: payrollCount,
      refreshedAt: new Date().toLocaleString("ko-KR")
    });
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

  const priorityMessage = useMemo(() => {
    const totalPending =
      queueSnapshot.pendingAttendance + queueSnapshot.pendingLeave + queueSnapshot.pendingPayroll;
    if (totalPending === 0) {
      return "긴급 처리 항목이 없습니다. 모니터링 상태를 유지하세요.";
    }
    if (queueSnapshot.pendingAttendance > 0) {
      return `출퇴근 미승인 ${queueSnapshot.pendingAttendance}건이 우선입니다.`;
    }
    if (queueSnapshot.pendingLeave > 0) {
      return `휴가 미승인 ${queueSnapshot.pendingLeave}건 확인이 필요합니다.`;
    }
    return `급여 미확정 ${queueSnapshot.pendingPayroll}건을 확인하세요.`;
  }, [queueSnapshot]);

  return (
    <main className="console-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR Command Center</p>
        <h1>Shift/Flex 상위호환을 위한 운영 우선순위 콘솔</h1>
        <p className="hero-copy">
          먼저 처리해야 할 업무를 상단에 배치하고, 핵심 지표를 실시간으로 확인하는 관리자 중심 화면입니다.
        </p>
        <div className="hero-meta">
          <span>
            Runtime Supabase URL <code>{supabaseUrl}</code>
          </span>
          <span>Auth Mode {usesBearerToken ? "Bearer Token" : "Dev Header"}</span>
          <span>KPI 목표: 관리자 조치 median 3분 이내</span>
          <Link className="btn btn-secondary" href="/ops/scheduling-cockpit">
            스케줄링 Cockpit
          </Link>
          <Link className="btn btn-secondary" href="/ops/mvp-console">
            검증 콘솔
          </Link>
          <Link className="btn btn-secondary" href="/employee">
            직원 셀프서비스
          </Link>
        </div>
      </section>

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>출퇴근 미승인</p>
          <strong>{queueSnapshot.pendingAttendance}</strong>
        </article>
        <article className="kpi-card">
          <p>휴가 미승인</p>
          <strong>{queueSnapshot.pendingLeave}</strong>
        </article>
        <article className="kpi-card">
          <p>급여 미확정</p>
          <strong>{queueSnapshot.pendingPayroll}</strong>
        </article>
        <article className="kpi-card">
          <p>API 성공률</p>
          <strong>{stats.successRate}%</strong>
        </article>
        <article className="kpi-card">
          <p>최근 큐 갱신</p>
          <strong>{queueSnapshot.refreshedAt ?? "-"}</strong>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>우선 조치 큐</h2>
          <p className="small">{priorityMessage}</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void refreshPriorityQueue()}>
              우선순위 큐 새로고침
            </button>
            <button className="btn btn-secondary" onClick={() => void listAttendanceRecords("PENDING")}>
              출퇴근 미승인 조회
            </button>
            <button className="btn btn-secondary" onClick={() => void listLeaveRequests("PENDING")}>
              휴가 미승인 조회
            </button>
            <button className="btn btn-secondary" onClick={() => void listPayrollRuns("PREVIEWED")}>
              급여 미확정 조회
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>요청 컨텍스트</h2>
          <div className="input-grid">
            <label>
              Organization ID (Tenant)
              <input
                value={organizationId}
                placeholder="예: ORG-00001"
                onChange={(event) => setOrganizationId(event.target.value)}
              />
            </label>
            <label>
              Employee Actor ID
              <input
                value={employeeActorId}
                onChange={(event) => setEmployeeActorId(event.target.value)}
              />
            </label>
            <label>
              Manager Actor ID
              <input
                value={managerActorId}
                onChange={(event) => setManagerActorId(event.target.value)}
              />
            </label>
            <label>
              Payroll Actor ID
              <input
                value={payrollActorId}
                onChange={(event) => setPayrollActorId(event.target.value)}
              />
            </label>
            <label>
              Admin Actor ID
              <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
            </label>
            <label>
              System Actor ID
              <input
                value={systemActorId}
                onChange={(event) => setSystemActorId(event.target.value)}
              />
            </label>
          </div>
          <label className="token-field">
            Bearer Access Token (선택)
            <textarea
              rows={3}
              placeholder="비어 있으면 x-actor-* 헤더 모드가 사용됩니다."
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
            />
          </label>
        </article>

        <article className="panel">
          <h2>조직/직원 온보딩 (People)</h2>
          <p className="small">
            조직/직원이 없으면 출퇴근, 휴가, 급여 API가 <code>employee not found</code>로 막힙니다. 먼저
            마스터 데이터를 생성하세요.
          </p>
          <p className="small">
            현재 테넌트(Organization ID): <code>{organizationId.trim() || "-"}</code>
          </p>

          <div className="input-grid">
            <label className="full">
              새 조직 이름 (system 전용)
              <input
                value={peopleOrganizationName}
                onChange={(event) => setPeopleOrganizationName(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createPeopleOrganization()}>
              조직 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listPeopleOrganizations()}>
              조직 목록 조회
            </button>
          </div>

          {peopleOrganizations.length > 0 ? (
            <ul className="simple-list" aria-label="조직 목록">
              {peopleOrganizations.map((org) => (
                <li key={org.id}>
                  <span>
                    <strong>{org.id}</strong> <span className="muted">{org.name}</span>
                  </span>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => applyTenantOrganization(org.id)}
                  >
                    테넌트로 사용
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <hr className="divider" />

          <div className="input-grid">
            <label>
              직원 ID
              <input value={peopleEmployeeId} onChange={(event) => setPeopleEmployeeId(event.target.value)} />
            </label>
            <label>
              이름 (선택)
              <input
                value={peopleEmployeeName}
                onChange={(event) => setPeopleEmployeeName(event.target.value)}
              />
            </label>
            <label>
              이메일 (선택)
              <input
                value={peopleEmployeeEmail}
                onChange={(event) => setPeopleEmployeeEmail(event.target.value)}
              />
            </label>
            <label>
              활성
              <select
                value={peopleEmployeeActive ? "yes" : "no"}
                onChange={(event) => setPeopleEmployeeActive(event.target.value === "yes")}
              >
                <option value="yes">예</option>
                <option value="no">아니오</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => void createPeopleEmployee()}
              disabled={!organizationId.trim() || !peopleEmployeeId.trim()}
            >
              직원 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listPeopleEmployees()}>
              직원 목록 조회
            </button>
          </div>

          <div className="input-grid">
            <label>
              직원 활성 필터
              <select
                value={peopleEmployeeActiveFilter}
                onChange={(event) =>
                  setPeopleEmployeeActiveFilter(event.target.value as "ALL" | "true" | "false")
                }
              >
                <option value="ALL">ALL</option>
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </label>
          </div>

          {peopleEmployees.length > 0 ? (
            <ul className="simple-list" aria-label="직원 목록">
              {peopleEmployees.map((employee) => (
                <li key={employee.id}>
                  <span>
                    <strong>{employee.id}</strong>{" "}
                    <span className="muted">
                      {employee.organizationId ?? "-"} / {employee.active ? "활성" : "비활성"}
                    </span>
                    {employee.name ? ` / ${employee.name}` : ""}
                    {employee.email ? ` / ${employee.email}` : ""}
                  </span>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => applyEmployeeDefaults(employee.id)}
                  >
                    이 직원으로 적용
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="panel">
          <h2>출퇴근 처리</h2>
          <div className="input-grid">
            <label>
              직원 ID
              <input
                value={attendanceEmployeeId}
                onChange={(event) => setAttendanceEmployeeId(event.target.value)}
              />
            </label>
            <label>
              휴일 근무
              <select
                value={isHoliday ? "yes" : "no"}
                onChange={(event) => setIsHoliday(event.target.value === "yes")}
              >
                <option value="no">아니오</option>
                <option value="yes">예</option>
              </select>
            </label>
            <label>
              출근 시각
              <input
                type="datetime-local"
                value={checkInAt}
                onChange={(event) => setCheckInAt(event.target.value)}
              />
            </label>
            <label>
              퇴근 시각
              <input
                type="datetime-local"
                value={checkOutAt}
                onChange={(event) => setCheckOutAt(event.target.value)}
              />
            </label>
            <label>
              휴게 분
              <input
                type="number"
                min={0}
                value={breakMinutes}
                onChange={(event) => setBreakMinutes(event.target.value)}
              />
            </label>
            <label>
              최근 기록 ID
              <input
                value={lastAttendanceId}
                onChange={(event) => setLastAttendanceId(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createAttendance()}>
              기록 생성
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void approveAttendance()}
              disabled={!lastAttendanceId}
            >
              기록 승인
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>휴가 처리</h2>
          <div className="input-grid">
            <label>
              직원 ID
              <input value={leaveEmployeeId} onChange={(event) => setLeaveEmployeeId(event.target.value)} />
            </label>
            <label>
              휴가 유형
              <select
                value={leaveType}
                onChange={(event) => setLeaveType(event.target.value as "ANNUAL" | "SICK" | "UNPAID")}
              >
                <option value="ANNUAL">ANNUAL</option>
                <option value="SICK">SICK</option>
                <option value="UNPAID">UNPAID</option>
              </select>
            </label>
            <label>
              시작일
              <input
                type="datetime-local"
                value={leaveStartDate}
                onChange={(event) => setLeaveStartDate(event.target.value)}
              />
            </label>
            <label>
              종료일
              <input
                type="datetime-local"
                value={leaveEndDate}
                onChange={(event) => setLeaveEndDate(event.target.value)}
              />
            </label>
            <label className="full">
              사유
              <input value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)} />
            </label>
            <label className="full">
              최근 휴가 요청 ID
              <input
                value={lastLeaveRequestId}
                onChange={(event) => setLastLeaveRequestId(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createLeaveRequest()}>
              요청 생성
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void approveLeaveRequest()}
              disabled={!lastLeaveRequestId}
            >
              요청 승인
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>급여 처리</h2>
          <div className="input-grid">
            <label>
              직원 ID
              <input
                value={payrollEmployeeId}
                onChange={(event) => setPayrollEmployeeId(event.target.value)}
              />
            </label>
            <label>
              시급 (KRW)
              <input
                type="number"
                min={1}
                value={hourlyRateKrw}
                onChange={(event) => setHourlyRateKrw(event.target.value)}
              />
            </label>
            <label>
              기간 시작
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>
            <label>
              기간 종료
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </label>
            <label className="full">
              최근 급여 Run ID
              <input
                value={lastPayrollRunId}
                onChange={(event) => setLastPayrollRunId(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void previewPayroll()}>
              급여 프리뷰
            </button>
            <button
              className="btn btn-danger"
              onClick={() => void confirmPayrollRun()}
              disabled={!lastPayrollRunId}
            >
              급여 확정
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>근무 일정</h2>
          <div className="input-grid">
            <label>
              직원 ID
              <input value={scheduleEmployeeId} onChange={(event) => setScheduleEmployeeId(event.target.value)} />
            </label>
            <label>
              휴일 근무
              <select
                value={scheduleIsHoliday ? "yes" : "no"}
                onChange={(event) => setScheduleIsHoliday(event.target.value === "yes")}
              >
                <option value="no">아니오</option>
                <option value="yes">예</option>
              </select>
            </label>
            <label>
              시작 시각
              <input
                type="datetime-local"
                value={scheduleStartAt}
                onChange={(event) => setScheduleStartAt(event.target.value)}
              />
            </label>
            <label>
              종료 시각
              <input
                type="datetime-local"
                value={scheduleEndAt}
                onChange={(event) => setScheduleEndAt(event.target.value)}
              />
            </label>
            <label>
              휴게 분
              <input
                type="number"
                min={0}
                value={scheduleBreakMinutes}
                onChange={(event) => setScheduleBreakMinutes(event.target.value)}
              />
            </label>
            <label>
              메모
              <input value={scheduleNotes} onChange={(event) => setScheduleNotes(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createWorkSchedule()}>
              일정 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listWorkSchedules()}>
              일정 조회
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>조회 액션</h2>
          <div className="input-grid">
            <label>
              출퇴근 상태
              <select
                value={attendanceListState}
                onChange={(event) => setAttendanceListState(event.target.value as AttendanceListState)}
              >
                <option value="ALL">ALL</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </label>
            <label>
              휴가 상태
              <select
                value={leaveListState}
                onChange={(event) => setLeaveListState(event.target.value as LeaveListState)}
              >
                <option value="ALL">ALL</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELED">CANCELED</option>
              </select>
            </label>
            <label>
              급여 상태
              <select
                value={payrollListState}
                onChange={(event) => setPayrollListState(event.target.value as PayrollListState)}
              >
                <option value="ALL">ALL</option>
                <option value="PREVIEWED">PREVIEWED</option>
                <option value="CONFIRMED">CONFIRMED</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void listAttendanceRecords()}>
              출퇴근 기록 조회
            </button>
            <button className="btn btn-secondary" onClick={() => void listAttendanceAggregates()}>
              근태 집계 조회
            </button>
            <button className="btn btn-secondary" onClick={() => void listLeaveRequests()}>
              휴가 요청 조회
            </button>
            <button className="btn btn-secondary" onClick={() => void listPayrollRuns()}>
              급여 Run 조회
            </button>
          </div>
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
                <span>{log.label}</span>
                <time>{log.at}</time>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
