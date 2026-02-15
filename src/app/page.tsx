"use client";

import { useMemo, useState } from "react";

type ActorRole = "admin" | "manager" | "employee" | "payroll_operator" | "system";

type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
  body: unknown;
};

type ActorContext = {
  role: ActorRole;
  id: string;
};

type AttendanceListState = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type LeaveListState = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
type PayrollListState = "ALL" | "PREVIEWED" | "CONFIRMED";

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
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export default function HomePage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [employeeActorId, setEmployeeActorId] = useState("EMP-1001");
  const [managerActorId, setManagerActorId] = useState("MGR-1001");
  const [payrollActorId, setPayrollActorId] = useState("PAY-1001");
  const [adminActorId, setAdminActorId] = useState("ADM-1001");

  const [attendanceEmployeeId, setAttendanceEmployeeId] = useState("EMP-1001");
  const [checkInAt, setCheckInAt] = useState(firstDayOfMonthLocal());
  const [checkOutAt, setCheckOutAt] = useState(lastDayOfMonthLocal());
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [isHoliday, setIsHoliday] = useState(false);
  const [lastAttendanceId, setLastAttendanceId] = useState("");

  const [payrollEmployeeId, setPayrollEmployeeId] = useState("EMP-1001");
  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());
  const [hourlyRateKrw, setHourlyRateKrw] = useState("12000");
  const [withholdingTaxKrw, setWithholdingTaxKrw] = useState("5000");
  const [socialInsuranceKrw, setSocialInsuranceKrw] = useState("3000");
  const [otherDeductionsKrw, setOtherDeductionsKrw] = useState("1000");
  const [lastPayrollRunId, setLastPayrollRunId] = useState("");

  const [profileId, setProfileId] = useState("DP-KR-DEFAULT");
  const [profileName, setProfileName] = useState("Korea Standard Profile");
  const [profileMode, setProfileMode] = useState<"manual" | "profile">("profile");
  const [withholdingRate, setWithholdingRate] = useState("0.03");
  const [socialInsuranceRate, setSocialInsuranceRate] = useState("0.045");
  const [fixedOtherDeductionKrw, setFixedOtherDeductionKrw] = useState("2000");
  const [profileActive, setProfileActive] = useState(true);

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

      const text = await response.text();
      let body: unknown = null;
      if (text.length > 0) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
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

    if (response.ok) {
      const parsed = body as { record?: { id?: string } };
      if (parsed.record?.id) {
        setLastAttendanceId(parsed.record.id);
      }
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

  async function previewPayroll() {
    const { response, body } = await callApi(
      "급여 프리뷰(기본)",
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

    if (response.ok) {
      const parsed = body as { run?: { id?: string } };
      if (parsed.run?.id) {
        setLastPayrollRunId(parsed.run.id);
      }
    }
  }

  async function previewPayrollManualDeductions() {
    const { response, body } = await callApi(
      "급여 프리뷰(수동 공제)",
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      { role: "payroll_operator", id: payrollActorId },
      {
        periodStart: toIso(periodStart),
        periodEnd: toIso(periodEnd),
        employeeId: payrollEmployeeId,
        hourlyRateKrw: Math.max(1, Math.trunc(coerceNumber(hourlyRateKrw, 10000))),
        deductionMode: "manual",
        deductions: {
          withholdingTaxKrw: Math.max(0, Math.trunc(coerceNumber(withholdingTaxKrw))),
          socialInsuranceKrw: Math.max(0, Math.trunc(coerceNumber(socialInsuranceKrw))),
          otherDeductionsKrw: Math.max(0, Math.trunc(coerceNumber(otherDeductionsKrw)))
        }
      }
    );

    if (response.ok) {
      const parsed = body as { run?: { id?: string } };
      if (parsed.run?.id) {
        setLastPayrollRunId(parsed.run.id);
      }
    }
  }

  async function previewPayrollProfileDeductions() {
    const { response, body } = await callApi(
      "급여 프리뷰(프로필 공제)",
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      { role: "payroll_operator", id: payrollActorId },
      {
        periodStart: toIso(periodStart),
        periodEnd: toIso(periodEnd),
        employeeId: payrollEmployeeId,
        hourlyRateKrw: Math.max(1, Math.trunc(coerceNumber(hourlyRateKrw, 10000))),
        deductionMode: "profile",
        profileId
      }
    );

    if (response.ok) {
      const parsed = body as { run?: { id?: string } };
      if (parsed.run?.id) {
        setLastPayrollRunId(parsed.run.id);
      }
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

  async function upsertDeductionProfile() {
    await callApi(
      "공제 프로필 저장",
      "PUT",
      `/api/payroll/deduction-profiles/${profileId}`,
      { role: "admin", id: adminActorId },
      {
        name: profileName,
        mode: profileMode,
        withholdingRate: coerceNumber(withholdingRate),
        socialInsuranceRate: coerceNumber(socialInsuranceRate),
        fixedOtherDeductionKrw: Math.max(0, Math.trunc(coerceNumber(fixedOtherDeductionKrw))),
        active: profileActive
      }
    );
  }

  async function readDeductionProfile() {
    await callApi(
      "공제 프로필 조회",
      "GET",
      `/api/payroll/deduction-profiles/${profileId}`,
      { role: "payroll_operator", id: payrollActorId }
    );
  }

  async function listDeductionProfiles() {
    await callApi("공제 프로필 목록 조회", "GET", "/api/payroll/deduction-profiles", {
      role: "payroll_operator",
      id: payrollActorId
    });
  }

  async function listAttendanceRecords() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    await callApi(
      "출퇴근 기록 조회",
      "GET",
      `/api/attendance/records${buildQuery({
        from,
        to,
        employeeId: attendanceEmployeeId,
        state: attendanceListState === "ALL" ? undefined : attendanceListState
      })}`,
      { role: "payroll_operator", id: payrollActorId }
    );
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

  async function listLeaveRequests() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    await callApi(
      "휴가 요청 조회",
      "GET",
      `/api/leave/requests${buildQuery({
        from,
        to,
        employeeId: leaveEmployeeId,
        state: leaveListState === "ALL" ? undefined : leaveListState
      })}`,
      { role: "payroll_operator", id: payrollActorId }
    );
  }

  async function listPayrollRuns() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    await callApi(
      "급여 Run 조회",
      "GET",
      `/api/payroll/runs${buildQuery({
        from,
        to,
        employeeId: payrollEmployeeId,
        state: payrollListState === "ALL" ? undefined : payrollListState
      })}`,
      { role: "payroll_operator", id: payrollActorId }
    );
  }

  function clearLogs() {
    setLogs([]);
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

    if (response.ok) {
      const parsed = body as { request?: { id?: string } };
      if (parsed.request?.id) {
        setLastLeaveRequestId(parsed.request.id);
      }
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

  async function readLeaveBalance() {
    await callApi(
      "휴가 잔액 조회",
      "GET",
      `/api/leave/balances/${leaveEmployeeId}`,
      { role: "payroll_operator", id: payrollActorId }
    );
  }

  const latestPayload = useMemo(() => {
    if (!newestLog) {
      return "아직 호출 내역이 없습니다.";
    }
    try {
      return JSON.stringify(newestLog.body, null, 2);
    } catch {
      return String(newestLog.body);
    }
  }, [newestLog]);

  return (
    <main className="console-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR MVP Console</p>
        <h1>출퇴근, 휴가, 급여를 한 화면에서 검증합니다.</h1>
        <p className="hero-copy">
          이 콘솔은 API 기반 MVP 동작 확인용입니다. 로컬/스테이징에서는 헤더 기반 액터 모드로,
          프로덕션에서는 Bearer 토큰 기반으로 사용할 수 있습니다.
        </p>
        <div className="hero-meta">
          <span>
            Runtime Supabase URL <code>{supabaseUrl}</code>
          </span>
          <span>Auth Mode {usesBearerToken ? "Bearer Token" : "Dev Header"}</span>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>요청 컨텍스트</h2>
          <div className="input-grid">
            <label>
              Organization ID (Tenant)
              <input
                value={organizationId}
                placeholder="예: ORG-00001 (memory) 또는 cuid (prisma)"
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
          </div>
          <label className="token-field">
            Bearer Access Token (선택)
            <textarea
              rows={3}
              placeholder="토큰이 비어있으면 x-actor-* 헤더 모드로 호출합니다."
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
            />
          </label>
        </article>

        <article className="panel">
          <h2>리스트 조회</h2>
          <p className="small">
            조회 기간은 급여 섹션의 <strong>기간 시작/종료</strong> 값을 사용합니다. 직원 ID는 각
            섹션의 직원 ID 값을 사용합니다.
          </p>
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
            <button className="btn btn-primary" onClick={listAttendanceRecords}>
              출퇴근 조회
            </button>
            <button className="btn btn-secondary" onClick={listAttendanceAggregates}>
              근태 집계 조회
            </button>
            <button className="btn btn-secondary" onClick={listLeaveRequests}>
              휴가 조회
            </button>
            <button className="btn btn-secondary" onClick={listPayrollRuns}>
              급여 Run 조회
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>출퇴근</h2>
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
            <button className="btn btn-primary" onClick={createAttendance}>
              기록 생성
            </button>
            <button className="btn btn-secondary" onClick={approveAttendance} disabled={!lastAttendanceId}>
              기록 승인
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>급여 프리뷰/확정</h2>
          <div className="input-grid">
            <label>
              직원 ID
              <input
                value={payrollEmployeeId}
                onChange={(event) => setPayrollEmployeeId(event.target.value)}
              />
            </label>
            <label>
              시급(KRW)
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
            <label>
              원천세(KRW)
              <input
                type="number"
                min={0}
                value={withholdingTaxKrw}
                onChange={(event) => setWithholdingTaxKrw(event.target.value)}
              />
            </label>
            <label>
              사회보험(KRW)
              <input
                type="number"
                min={0}
                value={socialInsuranceKrw}
                onChange={(event) => setSocialInsuranceKrw(event.target.value)}
              />
            </label>
            <label>
              기타 공제(KRW)
              <input
                type="number"
                min={0}
                value={otherDeductionsKrw}
                onChange={(event) => setOtherDeductionsKrw(event.target.value)}
              />
            </label>
            <label>
              최근 급여 Run ID
              <input
                value={lastPayrollRunId}
                onChange={(event) => setLastPayrollRunId(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={previewPayroll}>
              기본 프리뷰
            </button>
            <button className="btn btn-secondary" onClick={previewPayrollManualDeductions}>
              수동 공제 프리뷰
            </button>
            <button className="btn btn-secondary" onClick={previewPayrollProfileDeductions}>
              프로필 공제 프리뷰
            </button>
            <button className="btn btn-danger" onClick={confirmPayrollRun} disabled={!lastPayrollRunId}>
              급여 확정
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>공제 프로필</h2>
          <div className="input-grid">
            <label>
              Profile ID
              <input value={profileId} onChange={(event) => setProfileId(event.target.value)} />
            </label>
            <label>
              Profile Name
              <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            </label>
            <label>
              모드
              <select
                value={profileMode}
                onChange={(event) => setProfileMode(event.target.value as "manual" | "profile")}
              >
                <option value="profile">profile</option>
                <option value="manual">manual</option>
              </select>
            </label>
            <label>
              활성 상태
              <select
                value={profileActive ? "active" : "inactive"}
                onChange={(event) => setProfileActive(event.target.value === "active")}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label>
              원천세 비율
              <input
                type="number"
                min={0}
                max={1}
                step="0.001"
                value={withholdingRate}
                onChange={(event) => setWithholdingRate(event.target.value)}
              />
            </label>
            <label>
              사회보험 비율
              <input
                type="number"
                min={0}
                max={1}
                step="0.001"
                value={socialInsuranceRate}
                onChange={(event) => setSocialInsuranceRate(event.target.value)}
              />
            </label>
            <label>
              고정 기타 공제(KRW)
              <input
                type="number"
                min={0}
                value={fixedOtherDeductionKrw}
                onChange={(event) => setFixedOtherDeductionKrw(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={upsertDeductionProfile}>
              프로필 저장
            </button>
            <button className="btn btn-secondary" onClick={readDeductionProfile}>
              프로필 조회
            </button>
            <button className="btn btn-secondary" onClick={listDeductionProfiles}>
              프로필 목록
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>휴가 요청/승인</h2>
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
            <button className="btn btn-primary" onClick={createLeaveRequest}>
              휴가 요청
            </button>
            <button className="btn btn-secondary" onClick={approveLeaveRequest} disabled={!lastLeaveRequestId}>
              휴가 승인
            </button>
            <button className="btn btn-secondary" onClick={readLeaveBalance}>
              잔액 조회
            </button>
          </div>
        </article>

        <article className="panel panel-log">
          <h2>API 실행 로그</h2>
          <p className="small">
            최근 호출 결과를 보여줍니다. 현재 실행 중:{" "}
            <strong>{pendingLabel ? pendingLabel : "없음"}</strong>
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
