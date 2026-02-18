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

type EmployeeSummary = {
  id: string;
  organizationId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
};

type OrganizationSummary = {
  id: string;
  name: string;
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
  decisionReason: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
};

type PayrollRunDto = {
  id: string;
  organizationId: string | null;
  employeeId: string | null;
  periodStart: string;
  periodEnd: string;
  state: "PREVIEWED" | "CONFIRMED";
  grossPayKrw: number;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  sourceRecordCount: number;
  confirmedAt: string | null;
  confirmedBy: string | null;
};

type AttendanceAggregateDto = {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    payable: number;
  };
  totals: {
    regular: number;
    overtime: number;
    night: number;
    holiday: number;
  };
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

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

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

function toIso(value: string) {
  return new Date(value).toISOString();
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

function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")}원`;
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

function minutesToHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

export default function AdminDashboardPage() {
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);

  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [organizationName, setOrganizationName] = useState("FlowHR Demo Org");
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);

  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeActive, setEmployeeActive] = useState(true);

  const [attendanceRejectReason, setAttendanceRejectReason] = useState("");
  const [leaveRejectReason, setLeaveRejectReason] = useState("");
  const [pendingAttendance, setPendingAttendance] = useState<AttendanceRecordDto[]>([]);
  const [pendingLeave, setPendingLeave] = useState<LeaveRequestDto[]>([]);
  const [previewedPayroll, setPreviewedPayroll] = useState<PayrollRunDto[]>([]);

  const [aggregateEmployeeId, setAggregateEmployeeId] = useState("");
  const [aggregates, setAggregates] = useState<AttendanceAggregateDto[]>([]);

  const [accrualEmployeeId, setAccrualEmployeeId] = useState("EMP-1001");
  const [accrualYear, setAccrualYear] = useState(String(new Date().getFullYear()));
  const [accrualGrantDays, setAccrualGrantDays] = useState("15");
  const [accrualCarryCapDays, setAccrualCarryCapDays] = useState("5");
  const [accrualResult, setAccrualResult] = useState<LeaveBalanceDto | null>(null);

  const [payrollHourlyRateKrw, setPayrollHourlyRateKrw] = useState("12000");
  const [lastPayrollRunId, setLastPayrollRunId] = useState("");

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const usesBearerToken = accessToken.trim().length > 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not configured";

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    const fail = total - success;
    return { total, success, fail };
  }, [logs]);

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PATCH" | "PUT",
    path: string,
    payload?: Record<string, unknown>,
    options?: { omitOrganizationHeader?: boolean }
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
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (!options?.omitOrganizationHeader && organizationId.trim().length > 0) {
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

  async function listEmployees() {
    const { response, body } = await callApi(
      "직원 목록 조회",
      "GET",
      `/api/people/employees${buildQuery({
        organizationId: organizationId.trim() || undefined
      })}`
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { employees?: EmployeeSummary[] };
    setEmployees(Array.isArray(parsed.employees) ? parsed.employees : []);
  }

  async function createEmployee() {
    const payload = {
      id: employeeId.trim(),
      organizationId: organizationId.trim() || null,
      name: employeeName.trim() || undefined,
      email: employeeEmail.trim() || undefined,
      active: employeeActive
    };
    const { response, body } = await callApi("직원 생성", "POST", "/api/people/employees", payload);
    if (!response.ok) {
      return;
    }
    const parsed = body as { employee?: { id?: string } };
    if (parsed.employee?.id) {
      setEmployeeId(parsed.employee.id);
      setAccrualEmployeeId(parsed.employee.id);
    }
    await listEmployees();
  }

  async function listOrganizations() {
    const { response, body } = await callApi("조직 목록 조회", "GET", "/api/people/organizations", undefined, {
      omitOrganizationHeader: true
    });
    if (!response.ok) {
      return;
    }
    const parsed = body as { organizations?: OrganizationSummary[] };
    setOrganizations(Array.isArray(parsed.organizations) ? parsed.organizations : []);
  }

  async function createOrganization() {
    const name = organizationName.trim();
    if (!name) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "조직 생성",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "조직 이름이 필요합니다." }
        },
        ...prev
      ]);
      return;
    }

    const { response, body } = await callApi(
      "조직 생성",
      "POST",
      "/api/people/organizations",
      { name },
      { omitOrganizationHeader: true }
    );
    if (!response.ok) {
      return;
    }

    const parsed = body as { organization?: { id?: string } };
    const createdId = parsed.organization?.id;
    if (typeof createdId === "string" && createdId.trim().length > 0) {
      setOrganizationId(createdId);
    }

    await listOrganizations();
  }

  async function refreshInbox() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);

    const [attendanceRes, leaveRes, payrollRes] = await Promise.all([
      callApi(
        "승인 대기 출퇴근 조회",
        "GET",
        `/api/attendance/records${buildQuery({ from, to, state: "PENDING" })}`
      ),
      callApi(
        "승인 대기 휴가 조회",
        "GET",
        `/api/leave/requests${buildQuery({ from, to, state: "PENDING" })}`
      ),
      callApi(
        "프리뷰 급여 조회",
        "GET",
        `/api/payroll/runs${buildQuery({ from, to, state: "PREVIEWED" })}`
      )
    ]);

    if (attendanceRes.response.ok) {
      const parsed = attendanceRes.body as { records?: AttendanceRecordDto[] };
      const records = Array.isArray(parsed.records) ? parsed.records : [];
      setPendingAttendance(records);
    }
    if (leaveRes.response.ok) {
      const parsed = leaveRes.body as { requests?: LeaveRequestDto[] };
      const requests = Array.isArray(parsed.requests) ? parsed.requests : [];
      setPendingLeave(requests);
    }
    if (payrollRes.response.ok) {
      const parsed = payrollRes.body as { runs?: PayrollRunDto[] };
      const runs = Array.isArray(parsed.runs) ? parsed.runs : [];
      setPreviewedPayroll(runs);
    }
  }

  async function approveAttendance(recordId: string) {
    await callApi("출퇴근 승인", "POST", `/api/attendance/records/${recordId}/approve`);
    await refreshInbox();
  }

  async function rejectAttendance(recordId: string) {
    const reason = attendanceRejectReason.trim();
    const payload = reason.length > 0 ? { reason } : undefined;
    await callApi("출퇴근 반려", "POST", `/api/attendance/records/${recordId}/reject`, payload);
    await refreshInbox();
  }

  async function approveLeave(requestId: string) {
    await callApi("휴가 승인", "POST", `/api/leave/requests/${requestId}/approve`);
    await refreshInbox();
  }

  async function rejectLeave(requestId: string) {
    const reason = leaveRejectReason.trim();
    if (!reason) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "휴가 반려",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "반려 사유는 필수입니다." }
        },
        ...prev
      ]);
      return;
    }
    await callApi("휴가 반려", "POST", `/api/leave/requests/${requestId}/reject`, { reason });
    await refreshInbox();
  }

  async function confirmPayroll(runId: string) {
    const { response, body } = await callApi("급여 확정", "POST", `/api/payroll/runs/${runId}/confirm`);
    if (response.ok) {
      const parsed = body as { run?: { id?: string } };
      if (parsed.run?.id) {
        setLastPayrollRunId(parsed.run.id);
      }
    }
    await refreshInbox();
  }

  async function previewPayroll() {
    const payload = {
      periodStart: toIso(periodStart),
      periodEnd: toIso(periodEnd),
      employeeId: employeeId.trim() || undefined,
      hourlyRateKrw: Number(payrollHourlyRateKrw),
      multipliers: {
        overtime: 1.5,
        night: 1.5,
        holiday: 1.5
      }
    };
    const { response, body } = await callApi("급여 프리뷰 생성", "POST", "/api/payroll/runs/preview", payload);
    if (!response.ok) {
      return;
    }
    const parsed = body as { run?: { id?: string } };
    if (parsed.run?.id) {
      setLastPayrollRunId(parsed.run.id);
    }
    await refreshInbox();
  }

  async function settleLeaveAccrual() {
    const year = Number(accrualYear);
    const annualGrantDaysRaw = accrualGrantDays.trim();
    const carryOverCapDaysRaw = accrualCarryCapDays.trim();
    const annualGrantDays = annualGrantDaysRaw.length > 0 ? Number(annualGrantDaysRaw) : Number.NaN;
    const carryOverCapDays = carryOverCapDaysRaw.length > 0 ? Number(carryOverCapDaysRaw) : Number.NaN;
    const payload = {
      employeeId: accrualEmployeeId.trim(),
      year,
      annualGrantDays: Number.isFinite(annualGrantDays) ? annualGrantDays : undefined,
      carryOverCapDays: Number.isFinite(carryOverCapDays) ? carryOverCapDays : undefined
    };
    const { response, body } = await callApi("휴가 정산(부여/이월)", "POST", "/api/leave/accrual/settle", payload);
    if (!response.ok) {
      return;
    }
    const parsed = body as { balance?: LeaveBalanceDto };
    setAccrualResult(parsed.balance ?? null);
  }

  async function loadLeavePolicy() {
    const orgId = organizationId.trim();
    if (!orgId) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "휴가 정책 조회",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "Organization ID가 필요합니다." }
        },
        ...prev
      ]);
      return;
    }

    const { response, body } = await callApi(
      "휴가 정책 조회",
      "GET",
      `/api/leave/policy${buildQuery({ organizationId: orgId })}`
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as {
      policy?: { annualGrantDays?: number; carryOverCapDays?: number };
    };
    if (typeof parsed.policy?.annualGrantDays === "number") {
      setAccrualGrantDays(String(parsed.policy.annualGrantDays));
    }
    if (typeof parsed.policy?.carryOverCapDays === "number") {
      setAccrualCarryCapDays(String(parsed.policy.carryOverCapDays));
    }
  }

  async function saveLeavePolicy() {
    const orgId = organizationId.trim();
    if (!orgId) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "휴가 정책 저장",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "Organization ID가 필요합니다." }
        },
        ...prev
      ]);
      return;
    }

    const annualGrantDays = Number(accrualGrantDays.trim());
    const carryOverCapDays = Number(accrualCarryCapDays.trim());
    const payload = {
      organizationId: orgId,
      annualGrantDays,
      carryOverCapDays
    };
    await callApi("휴가 정책 저장", "PUT", "/api/leave/policy", payload);
  }

  async function listAttendanceAggregates(options?: { employeeId?: string }) {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const employeeCandidate = options?.employeeId;
    const employee =
      typeof employeeCandidate === "string" ? employeeCandidate.trim() : aggregateEmployeeId.trim();
    const { response, body } = await callApi(
      employee ? "근태 집계 조회" : "근태 집계 조회(전체)",
      "GET",
      `/api/attendance/aggregates${buildQuery({
        from,
        to,
        employeeId: employee.length > 0 ? employee : undefined
      })}`
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { aggregates?: AttendanceAggregateDto[] };
    setAggregates(Array.isArray(parsed.aggregates) ? parsed.aggregates : []);
  }

  function clearLogs() {
    setLogs([]);
  }

  async function refreshDashboard() {
    await Promise.all([refreshInbox(), listAttendanceAggregates()]);
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">관리자 대시보드</h1>
          <p className="page-subtitle">
            직원/조직 온보딩부터 승인 대기함 처리, 근태 집계 확인, 급여 프리뷰/확정까지 한 화면에서 처리합니다.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => void refreshDashboard()}>
            대시보드 새로고침
          </button>
          <Link className="btn btn-secondary" href="/employee">
            직원 포털
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
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

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>출퇴근 승인 대기</p>
          <strong>{pendingAttendance.length}</strong>
        </article>
        <article className="kpi-card">
          <p>휴가 승인 대기</p>
          <strong>{pendingLeave.length}</strong>
        </article>
        <article className="kpi-card">
          <p>급여 프리뷰</p>
          <strong>{previewedPayroll.length}</strong>
        </article>
        <article className="kpi-card">
          <p>API 호출</p>
          <strong>
            {stats.total} (OK {stats.success} / FAIL {stats.fail})
          </strong>
        </article>
        <article className="kpi-card">
          <p>최근 실행</p>
          <strong>{pendingLabel ?? "-"}</strong>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel" id="onboarding">
          <h2>조직 온보딩</h2>
          <p className="small">
            조직(테넌트)을 먼저 만들고 선택해야 직원/근태/휴가/급여 흐름을 정상 검증할 수 있습니다. 이 패널의 조직
            생성/목록 조회 호출은 tenantScope 제한을 피하기 위해 Dev Header 모드에서{" "}
            <code>x-actor-organization-id</code> 헤더를 생략합니다.
          </p>
          <p className="small">
            현재 선택된 Organization ID: <code>{organizationId.trim() || "-"}</code>
          </p>

          <div className="input-grid">
            <label className="full">
              새 조직 이름
              <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createOrganization()} disabled={!organizationName.trim()}>
              조직 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listOrganizations()}>
              조직 목록 조회
            </button>
          </div>

          {organizations.length === 0 ? (
            <p className="small muted">조직 목록을 아직 불러오지 않았습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="조직 목록">
              {organizations.map((org) => (
                <li key={org.id}>
                  <span>
                    <strong>{org.id}</strong>{" "}
                    <span className="muted">
                      {org.name}
                      {organizationId.trim() === org.id ? " (선택됨)" : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setOrganizationId(org.id)}
                  >
                    이 조직 사용
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel" id="devtools">
          <h2>인증/컨텍스트 (개발/검증용)</h2>
          <p className="small">
            로컬 개발에서는 Dev Header(x-actor-*) 모드로 빠르게 검증하고, 스테이징/프로덕션에서는 Supabase Auth의
            Bearer 토큰으로 동작합니다.
          </p>
          <details className="details">
            <summary>
              설정 열기 <small>(기본은 숨김)</small>
            </summary>
            <div className="input-grid" style={{ marginTop: 12 }}>
              <label>
                Organization ID
                <input
                  value={organizationId}
                  placeholder="예: ORG-00001"
                  onChange={(event) => setOrganizationId(event.target.value)}
                />
              </label>
              <label>
                Admin Actor ID
                <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
              </label>
              <label className="full">
                Bearer Access Token (선택)
                <textarea
                  rows={3}
                  placeholder="비어 있으면 Dev Header 모드가 사용됩니다."
                  value={accessToken}
                  onChange={(event) => setAccessToken(event.target.value)}
                />
              </label>
            </div>
            {showDevTools ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                (dev) Runtime Supabase URL: <code>{supabaseUrl}</code>
              </p>
            ) : null}
          </details>
        </article>

        <article className="panel" id="people">
          <h2>직원 관리</h2>
          <p className="small">
            출퇴근/휴가/급여는 Employee 마스터가 있어야 동작합니다. 먼저 직원부터 생성하세요.
          </p>
          <div className="input-grid">
            <label>
              직원 ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              이름 (선택)
              <input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} />
            </label>
            <label>
              이메일 (선택)
              <input value={employeeEmail} onChange={(event) => setEmployeeEmail(event.target.value)} />
            </label>
            <label>
              활성
              <select
                value={employeeActive ? "yes" : "no"}
                onChange={(event) => setEmployeeActive(event.target.value === "yes")}
              >
                <option value="yes">예</option>
                <option value="no">아니오</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => void createEmployee()}
              disabled={!employeeId.trim() || !organizationId.trim()}
            >
              직원 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listEmployees()}>
              직원 목록 조회
            </button>
          </div>
          {employees.length > 0 ? (
            <ul className="simple-list" aria-label="직원 목록">
              {employees.map((employee) => (
                <li key={employee.id}>
                  <span>
                    <strong>{employee.id}</strong>{" "}
                    <span className="muted">
                      {employee.active ? "활성" : "비활성"} / {employee.organizationId ?? "-"}
                      {employee.name ? ` / ${employee.name}` : ""}
                      {employee.email ? ` / ${employee.email}` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setEmployeeId(employee.id);
                      setAccrualEmployeeId(employee.id);
                      setAggregateEmployeeId(employee.id);
                    }}
                  >
                    이 직원으로 적용
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="panel" id="approvals">
          <h2>승인 대기함</h2>
          <div className="input-grid">
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
              출퇴근 반려 사유 (선택)
              <input
                value={attendanceRejectReason}
                onChange={(event) => setAttendanceRejectReason(event.target.value)}
                placeholder="사유 없이 반려할 수 없게 하고 싶으면 정책에서 필수로 변경하세요."
              />
            </label>
            <label className="full">
              휴가 반려 사유 (필수)
              <input
                value={leaveRejectReason}
                onChange={(event) => setLeaveRejectReason(event.target.value)}
                placeholder="예: 근무 일정 충돌"
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void refreshInbox()}>
              대기함 새로고침
            </button>
          </div>

          <hr className="divider" />
          <p className="small">출퇴근 (PENDING {pendingAttendance.length}건)</p>
          {pendingAttendance.length === 0 ? (
            <p className="small muted">대기 중인 출퇴근이 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="출퇴근 승인 대기">
              {pendingAttendance.map((record) => (
                <li key={record.id}>
                  <span>
                    <strong>{record.employeeId}</strong>{" "}
                    <span className="muted">
                      {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)} /{" "}
                      {record.breakMinutes}분 / {record.isHoliday ? "휴일" : "평일"}
                    </span>
                  </span>
                  <div className="queue-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => void approveAttendance(record.id)}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => void rejectAttendance(record.id)}
                    >
                      반려
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <hr className="divider" />
          <p className="small">휴가 (PENDING {pendingLeave.length}건)</p>
          {pendingLeave.length === 0 ? (
            <p className="small muted">대기 중인 휴가 요청이 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="휴가 승인 대기">
              {pendingLeave.map((request) => (
                <li key={request.id}>
                  <span>
                    <strong>{request.employeeId}</strong>{" "}
                    <span className="muted">
                      {request.leaveType} / {formatDateTime(request.startDate)} ~{" "}
                      {formatDateTime(request.endDate)} ({request.days}일)
                    </span>
                  </span>
                  <div className="queue-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => void approveLeave(request.id)}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => void rejectLeave(request.id)}
                    >
                      반려
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <hr className="divider" />
          <p className="small">급여 (PREVIEWED {previewedPayroll.length}건)</p>
          {previewedPayroll.length === 0 ? (
            <p className="small muted">확정 대기 중인 급여 프리뷰가 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="급여 프리뷰">
              {previewedPayroll.map((run) => (
                <li key={run.id}>
                  <span>
                    <strong>{run.employeeId ?? "-"}</strong>{" "}
                    <span className="muted">
                      {formatDateTime(run.periodStart)} ~ {formatDateTime(run.periodEnd)} / 총지급{" "}
                      {formatKrw(run.grossPayKrw)}
                    </span>
                  </span>
                  <div className="queue-actions">
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => void confirmPayroll(run.id)}
                    >
                      확정
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel" id="aggregates">
          <h2>근태 집계</h2>
          <div className="input-grid">
            <label>
              직원 ID (선택)
              <input
                value={aggregateEmployeeId}
                onChange={(event) => setAggregateEmployeeId(event.target.value)}
                placeholder="비우면 전체"
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void listAttendanceAggregates()}>
              집계 조회
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setAggregateEmployeeId("");
                void listAttendanceAggregates({ employeeId: "" });
              }}
            >
              전체 집계
            </button>
          </div>
          {aggregates.length > 0 ? (
            <ul className="simple-list" aria-label="근태 집계 결과">
              {aggregates.map((aggregate) => (
                <li key={aggregate.employeeId}>
                  <span>
                    <strong>{aggregate.employeeId}</strong>{" "}
                    <span className="muted">
                      승인 {aggregate.counts.approved} / 대기 {aggregate.counts.pending} / 반려{" "}
                      {aggregate.counts.rejected} / 급여반영 {aggregate.counts.payable}
                      {" · "}정규 {minutesToHours(aggregate.totals.regular)} / 연장{" "}
                      {minutesToHours(aggregate.totals.overtime)} / 야간{" "}
                      {minutesToHours(aggregate.totals.night)} / 휴일{" "}
                      {minutesToHours(aggregate.totals.holiday)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setAggregateEmployeeId(aggregate.employeeId);
                      setEmployeeId(aggregate.employeeId);
                      setAccrualEmployeeId(aggregate.employeeId);
                    }}
                  >
                    이 직원으로 적용
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">집계 데이터가 없습니다.</p>
          )}
        </article>

        <article className="panel" id="leave-policy">
          <h2>휴가 정책/정산 (연차 부여/이월)</h2>
          <p className="small">
            조직 단위 휴가 정책(연간 부여/이월 상한)을 저장하고, 정산 시 부여/이월 값을 비워두면 정책 기본값이 적용됩니다.
          </p>
          <div className="input-grid">
            <label>
              직원 ID
              <input
                value={accrualEmployeeId}
                onChange={(event) => setAccrualEmployeeId(event.target.value)}
              />
            </label>
            <label>
              연도
              <input value={accrualYear} onChange={(event) => setAccrualYear(event.target.value)} />
            </label>
            <label>
              연차 부여일
              <input
                value={accrualGrantDays}
                onChange={(event) => setAccrualGrantDays(event.target.value)}
              />
            </label>
            <label>
              이월 상한일
              <input
                value={accrualCarryCapDays}
                onChange={(event) => setAccrualCarryCapDays(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void loadLeavePolicy()} disabled={!organizationId.trim()}>
              정책 불러오기
            </button>
            <button className="btn btn-secondary" onClick={() => void saveLeavePolicy()} disabled={!organizationId.trim()}>
              정책 저장
            </button>
            <button className="btn btn-primary" onClick={() => void settleLeaveAccrual()}>
              정산 실행
            </button>
          </div>
          {accrualResult ? (
            <p className="small">
              결과: 잔여 {accrualResult.remainingDays}일 (부여 {accrualResult.grantedDays}일, 사용{" "}
              {accrualResult.usedDays}일, 이월 {accrualResult.carryOverDays}일) / updated{" "}
              {formatDateTime(accrualResult.updatedAt)}
            </p>
          ) : (
            <p className="small muted">정산 결과가 아직 없습니다.</p>
          )}
        </article>

        <article className="panel" id="payroll">
          <h2>급여 프리뷰/확정</h2>
          <p className="small">승인된 출퇴근 기반으로 총지급을 산정하고, 확정된 급여는 직원 명세서에서 조회합니다.</p>
          <div className="input-grid">
            <label>
              대상 직원 ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              시급 (KRW)
              <input
                type="number"
                min={1}
                value={payrollHourlyRateKrw}
                onChange={(event) => setPayrollHourlyRateKrw(event.target.value)}
              />
            </label>
            <label className="full">
              최근 Run ID
              <input
                value={lastPayrollRunId}
                onChange={(event) => setLastPayrollRunId(event.target.value)}
                placeholder="확정 버튼용"
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void previewPayroll()}>
              프리뷰 생성
            </button>
            <button
              className="btn btn-danger"
              onClick={() => void confirmPayroll(lastPayrollRunId)}
              disabled={!lastPayrollRunId.trim()}
            >
              Run 확정
            </button>
          </div>
        </article>

        {showDevTools ? (
          <article className="panel">
            <h2>디버그 로그</h2>
            <p className="small">
              개발 모드에서만 노출됩니다. PR/배포 환경에서는 사용자 경험 화면을 우선합니다.
            </p>
            <div className="actions">
              <button className="btn btn-secondary" onClick={clearLogs}>
                로그 초기화
              </button>
            </div>
            {logs.length === 0 ? (
              <p className="small muted">아직 호출 이력이 없습니다.</p>
            ) : (
              <ul className="simple-list" aria-label="API 호출 로그">
                {logs.slice(0, 12).map((log) => (
                  <li key={log.id}>
                    <span>
                      <span className={log.ok ? "ok" : "fail"}>
                        {log.ok ? "OK" : "FAIL"} {log.status}
                      </span>{" "}
                      <strong>{log.label}</strong>{" "}
                      <span className="muted">
                        {log.durationMs}ms · {log.at}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ) : null}
      </section>
    </main>
  );
}
