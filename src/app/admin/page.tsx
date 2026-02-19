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

type ApprovalActivity = {
  id: number;
  queue: "attendance" | "leave" | "payroll";
  action: string;
  itemId: string;
  ok: boolean;
  status: number;
  at: string;
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

type WorkScheduleDto = {
  id: string;
  employeeId: string;
  startAt: string;
  endAt: string;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
};

type InviteRole = "admin" | "manager" | "employee" | "payroll_operator";

type InviteResultDto = {
  userId: string;
  email: string;
  role: InviteRole;
  organizationId: string;
  actorId: string | null;
  redirectTo: string;
  actionLink: string;
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

function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("employee");
  const [inviteActorId, setInviteActorId] = useState("EMP-1001");
  const [inviteResult, setInviteResult] = useState<InviteResultDto | null>(null);

  const [scheduleEmployeeId, setScheduleEmployeeId] = useState("EMP-1001");
  const [scheduleIsHoliday, setScheduleIsHoliday] = useState(false);
  const [scheduleStartAt, setScheduleStartAt] = useState(() => {
    const now = new Date();
    return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0));
  });
  const [scheduleEndAt, setScheduleEndAt] = useState(() => {
    const now = new Date();
    return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0));
  });
  const [scheduleBreakMinutes, setScheduleBreakMinutes] = useState("60");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);

  const [attendanceRejectReason, setAttendanceRejectReason] = useState("");
  const [leaveRejectReason, setLeaveRejectReason] = useState("");
  const [pendingAttendance, setPendingAttendance] = useState<AttendanceRecordDto[]>([]);
  const [pendingLeave, setPendingLeave] = useState<LeaveRequestDto[]>([]);
  const [previewedPayroll, setPreviewedPayroll] = useState<PayrollRunDto[]>([]);
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<string[]>([]);
  const [selectedLeaveIds, setSelectedLeaveIds] = useState<string[]>([]);

  const [aggregateEmployeeId, setAggregateEmployeeId] = useState("");
  const [aggregates, setAggregates] = useState<AttendanceAggregateDto[]>([]);

  const [accrualEmployeeId, setAccrualEmployeeId] = useState("EMP-1001");
  const [accrualYear, setAccrualYear] = useState(String(new Date().getFullYear()));
  const [accrualGrantDays, setAccrualGrantDays] = useState("15");
  const [accrualCarryCapDays, setAccrualCarryCapDays] = useState("5");
  const [leaveAllowHalfDay, setLeaveAllowHalfDay] = useState(true);
  const [leaveAllowHourly, setLeaveAllowHourly] = useState(true);
  const [leaveHourlyIncrementMinutes, setLeaveHourlyIncrementMinutes] = useState("30");
  const [leaveMaxHoursPerRequest, setLeaveMaxHoursPerRequest] = useState("8");
  const [accrualResult, setAccrualResult] = useState<LeaveBalanceDto | null>(null);

  const [payrollHourlyRateKrw, setPayrollHourlyRateKrw] = useState("12000");
  const [payrollPreviewMode, setPayrollPreviewMode] = useState<"gross" | "statutory_kr_baseline">(
    "gross"
  );
  const [payrollNonTaxableIncomeKrw, setPayrollNonTaxableIncomeKrw] = useState("0");
  const [payrollOtherDeductionsKrw, setPayrollOtherDeductionsKrw] = useState("0");
  const [payrollNationalPensionCapKrw, setPayrollNationalPensionCapKrw] = useState("");
  const [payrollHealthInsuranceCapKrw, setPayrollHealthInsuranceCapKrw] = useState("");
  const [payrollEmploymentInsuranceCapKrw, setPayrollEmploymentInsuranceCapKrw] = useState("");
  const [lastPayrollRunId, setLastPayrollRunId] = useState("");

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [approvalActivities, setApprovalActivities] = useState<ApprovalActivity[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";

  const usesBearerToken = bearerToken.trim().length > 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not configured";

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    if (organizationId.trim()) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    const fail = total - success;
    return { total, success, fail };
  }, [logs]);

  const selectedAttendanceCount = selectedAttendanceIds.length;
  const selectedLeaveCount = selectedLeaveIds.length;

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
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
        headers.authorization = `Bearer ${bearerToken.trim()}`;
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

  function appendApprovalActivity(input: {
    queue: "attendance" | "leave" | "payroll";
    action: string;
    itemId: string;
    ok: boolean;
    status: number;
  }) {
    setApprovalActivities((prev) => [
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        queue: input.queue,
        action: input.action,
        itemId: input.itemId,
        ok: input.ok,
        status: input.status,
        at: new Date().toLocaleString("ko-KR")
      },
      ...prev
    ].slice(0, 30));
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
      setScheduleEmployeeId(parsed.employee.id);
      setInviteActorId(parsed.employee.id);
    }
    await listEmployees();
  }

  async function createInvite() {
    setInviteResult(null);

    const email = inviteEmail.trim();
    if (!email) {
      return;
    }

    const payload = {
      email,
      role: inviteRole,
      organizationId: organizationId.trim() || undefined,
      actorId: inviteActorId.trim() || undefined
    };

    const { response, body } = await callApi("직원 초대 생성", "POST", "/api/auth/invites", payload);
    if (!response.ok) {
      return;
    }

    const parsed = body as { invite?: InviteResultDto };
    if (parsed.invite) {
      setInviteResult(parsed.invite);
    }
  }

  async function listSchedules() {
    const { response, body } = await callApi(
      "근무 일정 조회",
      "GET",
      `/api/scheduling/schedules${buildQuery({
        from: toIso(periodStart),
        to: toIso(periodEnd),
        employeeId: scheduleEmployeeId.trim() || undefined
      })}`
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { schedules?: WorkScheduleDto[] };
    setSchedules(Array.isArray(parsed.schedules) ? parsed.schedules : []);
  }

  async function createSchedule() {
    const breakMinutesRaw = Number(scheduleBreakMinutes);
    const payload = {
      employeeId: scheduleEmployeeId.trim(),
      startAt: toIso(scheduleStartAt),
      endAt: toIso(scheduleEndAt),
      breakMinutes: Math.max(0, Math.trunc(Number.isFinite(breakMinutesRaw) ? breakMinutesRaw : 0)),
      isHoliday: scheduleIsHoliday,
      notes: scheduleNotes.trim() ? scheduleNotes.trim() : undefined
    };

    const { response } = await callApi("근무 일정 생성", "POST", "/api/scheduling/schedules", payload);
    if (!response.ok) {
      return;
    }
    await listSchedules();
  }

  async function deleteSchedule(scheduleId: string) {
    if (!scheduleId.trim()) {
      return;
    }
    const okToDelete = window.confirm(`근무 일정을 삭제할까요?\n\nID: ${scheduleId}`);
    if (!okToDelete) {
      return;
    }

    const { response } = await callApi(
      "근무 일정 삭제",
      "DELETE",
      `/api/scheduling/schedules/${encodeURIComponent(scheduleId)}`
    );
    if (!response.ok) {
      return;
    }
    setSchedules((prev) => prev.filter((item) => item.id !== scheduleId));
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
      setSelectedAttendanceIds((prev) => prev.filter((id) => records.some((record) => record.id === id)));
    }
    if (leaveRes.response.ok) {
      const parsed = leaveRes.body as { requests?: LeaveRequestDto[] };
      const requests = Array.isArray(parsed.requests) ? parsed.requests : [];
      setPendingLeave(requests);
      setSelectedLeaveIds((prev) => prev.filter((id) => requests.some((request) => request.id === id)));
    }
    if (payrollRes.response.ok) {
      const parsed = payrollRes.body as { runs?: PayrollRunDto[] };
      const runs = Array.isArray(parsed.runs) ? parsed.runs : [];
      setPreviewedPayroll(runs);
    }
  }

  function toggleAttendanceSelection(recordId: string, checked: boolean) {
    setSelectedAttendanceIds((prev) => {
      if (checked) {
        return prev.includes(recordId) ? prev : [...prev, recordId];
      }
      return prev.filter((id) => id !== recordId);
    });
  }

  function toggleLeaveSelection(requestId: string, checked: boolean) {
    setSelectedLeaveIds((prev) => {
      if (checked) {
        return prev.includes(requestId) ? prev : [...prev, requestId];
      }
      return prev.filter((id) => id !== requestId);
    });
  }

  function selectAllAttendance() {
    setSelectedAttendanceIds(pendingAttendance.map((record) => record.id));
  }

  function clearAttendanceSelection() {
    setSelectedAttendanceIds([]);
  }

  function selectAllLeave() {
    setSelectedLeaveIds(pendingLeave.map((request) => request.id));
  }

  function clearLeaveSelection() {
    setSelectedLeaveIds([]);
  }

  async function approveAttendance(recordId: string) {
    const { response } = await callApi("출퇴근 승인", "POST", `/api/attendance/records/${recordId}/approve`);
    appendApprovalActivity({
      queue: "attendance",
      action: "승인",
      itemId: recordId,
      ok: response.ok,
      status: response.status
    });
    await refreshInbox();
  }

  async function rejectAttendance(recordId: string) {
    const reason = attendanceRejectReason.trim();
    const payload = reason.length > 0 ? { reason } : undefined;
    const { response } = await callApi("출퇴근 반려", "POST", `/api/attendance/records/${recordId}/reject`, payload);
    appendApprovalActivity({
      queue: "attendance",
      action: "반려",
      itemId: recordId,
      ok: response.ok,
      status: response.status
    });
    await refreshInbox();
  }

  async function approveLeave(requestId: string) {
    const { response } = await callApi("휴가 승인", "POST", `/api/leave/requests/${requestId}/approve`);
    appendApprovalActivity({
      queue: "leave",
      action: "승인",
      itemId: requestId,
      ok: response.ok,
      status: response.status
    });
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
    const { response } = await callApi("휴가 반려", "POST", `/api/leave/requests/${requestId}/reject`, { reason });
    appendApprovalActivity({
      queue: "leave",
      action: "반려",
      itemId: requestId,
      ok: response.ok,
      status: response.status
    });
    await refreshInbox();
  }

  async function approveSelectedAttendance() {
    if (selectedAttendanceIds.length === 0) {
      return;
    }
    const targets = [...selectedAttendanceIds];
    const results = await Promise.all(
      targets.map((recordId) => callApi("출퇴근 승인(일괄)", "POST", `/api/attendance/records/${recordId}/approve`))
    );
    results.forEach(({ response }, index) => {
      appendApprovalActivity({
        queue: "attendance",
        action: "승인(일괄)",
        itemId: targets[index],
        ok: response.ok,
        status: response.status
      });
    });
    await refreshInbox();
  }

  async function rejectSelectedAttendance() {
    if (selectedAttendanceIds.length === 0) {
      return;
    }
    const reason = attendanceRejectReason.trim();
    const payload = reason.length > 0 ? { reason } : undefined;
    const targets = [...selectedAttendanceIds];
    const results = await Promise.all(
      targets.map((recordId) => callApi("출퇴근 반려(일괄)", "POST", `/api/attendance/records/${recordId}/reject`, payload))
    );
    results.forEach(({ response }, index) => {
      appendApprovalActivity({
        queue: "attendance",
        action: "반려(일괄)",
        itemId: targets[index],
        ok: response.ok,
        status: response.status
      });
    });
    await refreshInbox();
  }

  async function approveSelectedLeave() {
    if (selectedLeaveIds.length === 0) {
      return;
    }
    const targets = [...selectedLeaveIds];
    const results = await Promise.all(
      targets.map((requestId) => callApi("휴가 승인(일괄)", "POST", `/api/leave/requests/${requestId}/approve`))
    );
    results.forEach(({ response }, index) => {
      appendApprovalActivity({
        queue: "leave",
        action: "승인(일괄)",
        itemId: targets[index],
        ok: response.ok,
        status: response.status
      });
    });
    await refreshInbox();
  }

  async function rejectSelectedLeave() {
    if (selectedLeaveIds.length === 0) {
      return;
    }
    const reason = leaveRejectReason.trim();
    if (!reason) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "휴가 반려(일괄)",
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
    const targets = [...selectedLeaveIds];
    const results = await Promise.all(
      targets.map((requestId) => callApi("휴가 반려(일괄)", "POST", `/api/leave/requests/${requestId}/reject`, { reason }))
    );
    results.forEach(({ response }, index) => {
      appendApprovalActivity({
        queue: "leave",
        action: "반려(일괄)",
        itemId: targets[index],
        ok: response.ok,
        status: response.status
      });
    });
    await refreshInbox();
  }

  async function confirmPayroll(runId: string) {
    const { response, body } = await callApi("급여 확정", "POST", `/api/payroll/runs/${runId}/confirm`);
    appendApprovalActivity({
      queue: "payroll",
      action: "확정",
      itemId: runId,
      ok: response.ok,
      status: response.status
    });
    if (response.ok) {
      const parsed = body as { run?: { id?: string } };
      if (parsed.run?.id) {
        setLastPayrollRunId(parsed.run.id);
      }
    }
    await refreshInbox();
  }

  async function previewPayroll() {
    const basePayload = {
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

    const statutoryPayload = {
      ...basePayload,
      deductionMode: "statutory_kr_baseline" as const,
      statutory: {
        nonTaxableIncomeKrw: Math.max(0, Number(payrollNonTaxableIncomeKrw) || 0),
        otherDeductionsKrw: Math.max(0, Number(payrollOtherDeductionsKrw) || 0),
        nationalPensionCapKrw:
          payrollNationalPensionCapKrw.trim().length > 0
            ? Math.max(0, Number(payrollNationalPensionCapKrw) || 0)
            : undefined,
        healthInsuranceCapKrw:
          payrollHealthInsuranceCapKrw.trim().length > 0
            ? Math.max(0, Number(payrollHealthInsuranceCapKrw) || 0)
            : undefined,
        employmentInsuranceCapKrw:
          payrollEmploymentInsuranceCapKrw.trim().length > 0
            ? Math.max(0, Number(payrollEmploymentInsuranceCapKrw) || 0)
            : undefined
      }
    };

    const { response, body } = await callApi(
      payrollPreviewMode === "gross" ? "급여 프리뷰 생성(총지급)" : "급여 프리뷰 생성(법정공제)",
      "POST",
      payrollPreviewMode === "gross"
        ? "/api/payroll/runs/preview"
        : "/api/payroll/runs/preview-with-deductions",
      payrollPreviewMode === "gross" ? basePayload : statutoryPayload
    );
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
      policy?: {
        annualGrantDays?: number;
        carryOverCapDays?: number;
        allowHalfDay?: boolean;
        allowHourly?: boolean;
        hourlyIncrementMinutes?: number;
        maxHoursPerRequest?: number;
      };
    };
    if (typeof parsed.policy?.annualGrantDays === "number") {
      setAccrualGrantDays(String(parsed.policy.annualGrantDays));
    }
    if (typeof parsed.policy?.carryOverCapDays === "number") {
      setAccrualCarryCapDays(String(parsed.policy.carryOverCapDays));
    }
    if (typeof parsed.policy?.allowHalfDay === "boolean") {
      setLeaveAllowHalfDay(parsed.policy.allowHalfDay);
    }
    if (typeof parsed.policy?.allowHourly === "boolean") {
      setLeaveAllowHourly(parsed.policy.allowHourly);
    }
    if (typeof parsed.policy?.hourlyIncrementMinutes === "number") {
      setLeaveHourlyIncrementMinutes(String(parsed.policy.hourlyIncrementMinutes));
    }
    if (typeof parsed.policy?.maxHoursPerRequest === "number") {
      setLeaveMaxHoursPerRequest(String(parsed.policy.maxHoursPerRequest));
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
    const hourlyIncrementMinutes = Number(leaveHourlyIncrementMinutes.trim());
    const maxHoursPerRequest = Number(leaveMaxHoursPerRequest.trim());
    const payload = {
      organizationId: orgId,
      annualGrantDays,
      carryOverCapDays,
      allowHalfDay: leaveAllowHalfDay,
      allowHourly: leaveAllowHourly,
      hourlyIncrementMinutes,
      maxHoursPerRequest
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

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          현재 환경은 <strong>production</strong>입니다. API 호출을 위해 로그인 세션(Bearer)이 필요합니다:{" "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

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
              </div>
              {showDevTools ? (
                <p className="small muted" style={{ marginTop: 10 }}>
                  (dev) Runtime Supabase URL: <code>{supabaseUrl}</code>
                </p>
              ) : null}
            </details>
          ) : null}
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
                      setScheduleEmployeeId(employee.id);
                      setInviteActorId(employee.id);
                    }}
                  >
                    이 직원으로 적용
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="panel" id="invites">
          <h2>초대/가입</h2>
          <p className="small">
            직원에게 전달할 초대 링크를 생성합니다. <strong>Actor ID</strong>에 <code>Employee.id</code>를 넣으면 직원 포털이 해당
            직원으로 매핑됩니다.
          </p>
          <div className="input-grid">
            <label className="full">
              초대 이메일
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label>
              역할
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as InviteRole)}>
                <option value="employee">employee</option>
                <option value="manager">manager</option>
                <option value="payroll_operator">payroll_operator</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>
              Actor ID (선택)
              <input
                value={inviteActorId}
                onChange={(event) => setInviteActorId(event.target.value)}
                placeholder="예: EMP-1001"
              />
            </label>
            <label className="full">
              Organization ID
              <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => void createInvite()}
              disabled={!inviteEmail.trim() || !organizationId.trim()}
            >
              초대 링크 생성
            </button>
          </div>
          {inviteResult ? (
            <>
              <p className="small">
                생성됨: <strong>{inviteResult.email}</strong> · role={inviteResult.role} · org={inviteResult.organizationId}
                {inviteResult.actorId ? ` · actor=${inviteResult.actorId}` : ""}
              </p>
              <label className="full" style={{ display: "block", marginTop: 8 }}>
                초대 링크 (action_link)
                <textarea readOnly rows={3} value={inviteResult.actionLink} />
              </label>
              <p className="small muted" style={{ marginTop: 8 }}>
                링크가 `/login`으로 리다이렉트되려면 Supabase Auth의 Redirect URL에 현재 도메인이 허용되어 있어야 합니다.
              </p>
            </>
          ) : (
            <p className="small muted">아직 초대 링크를 생성하지 않았습니다.</p>
          )}
        </article>

        <article className="panel" id="scheduling">
          <h2>근무 일정</h2>
          <p className="small">
            직원별 근무 일정을 생성/조회/삭제합니다. 기간 필터(시작/종료)는 아래 기능들과 동일하게 공유됩니다.
          </p>
          <div className="input-grid">
            <label>
              직원 ID
              <input
                value={scheduleEmployeeId}
                onChange={(event) => setScheduleEmployeeId(event.target.value)}
                placeholder="예: EMP-1001"
              />
            </label>
            <label>
              기간 시작 (조회)
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>
            <label>
              기간 종료 (조회)
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
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
              메모 (선택)
              <input value={scheduleNotes} onChange={(event) => setScheduleNotes(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => void createSchedule()}
              disabled={!scheduleEmployeeId.trim()}
            >
              일정 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listSchedules()}>
              일정 조회
            </button>
          </div>
          {schedules.length === 0 ? (
            <p className="small muted">근무 일정이 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="근무 일정 목록">
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <span>
                    <span className="ok">{schedule.isHoliday ? "HOLIDAY" : "WORK"}</span>{" "}
                    <strong>{schedule.employeeId}</strong>{" "}
                    <span className="muted">
                      {formatDateTime(schedule.startAt)} ~ {formatDateTime(schedule.endAt)} (휴게{" "}
                      {schedule.breakMinutes}분)
                      {schedule.notes ? ` / ${schedule.notes}` : ""}
                    </span>{" "}
                    <time className="muted">{schedule.id}</time>
                  </span>
                  <div className="queue-actions">
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => void deleteSchedule(schedule.id)}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
          <p className="small">
            출퇴근 (PENDING {pendingAttendance.length}건 / 선택 {selectedAttendanceCount}건)
          </p>
          <div className="queue-toolbar">
            <button className="btn btn-secondary btn-small" onClick={selectAllAttendance} disabled={pendingAttendance.length === 0}>
              전체 선택
            </button>
            <button className="btn btn-secondary btn-small" onClick={clearAttendanceSelection} disabled={selectedAttendanceCount === 0}>
              선택 해제
            </button>
            <button className="btn btn-primary btn-small" onClick={() => void approveSelectedAttendance()} disabled={selectedAttendanceCount === 0}>
              선택 승인
            </button>
            <button className="btn btn-danger btn-small" onClick={() => void rejectSelectedAttendance()} disabled={selectedAttendanceCount === 0}>
              선택 반려
            </button>
          </div>
          {pendingAttendance.length === 0 ? (
            <p className="small muted">대기 중인 출퇴근이 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="출퇴근 승인 대기">
              {pendingAttendance.map((record) => (
                <li key={record.id}>
                  <label className="queue-item-main">
                    <input
                      type="checkbox"
                      checked={selectedAttendanceIds.includes(record.id)}
                      onChange={(event) => toggleAttendanceSelection(record.id, event.target.checked)}
                    />
                    <span>
                      <strong>{record.employeeId}</strong>{" "}
                      <span className="muted">
                        {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)} /{" "}
                        {record.breakMinutes}분 / {record.isHoliday ? "휴일" : "평일"}
                      </span>
                    </span>
                  </label>
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
          <p className="small">휴가 (PENDING {pendingLeave.length}건 / 선택 {selectedLeaveCount}건)</p>
          <div className="queue-toolbar">
            <button className="btn btn-secondary btn-small" onClick={selectAllLeave} disabled={pendingLeave.length === 0}>
              전체 선택
            </button>
            <button className="btn btn-secondary btn-small" onClick={clearLeaveSelection} disabled={selectedLeaveCount === 0}>
              선택 해제
            </button>
            <button className="btn btn-primary btn-small" onClick={() => void approveSelectedLeave()} disabled={selectedLeaveCount === 0}>
              선택 승인
            </button>
            <button className="btn btn-danger btn-small" onClick={() => void rejectSelectedLeave()} disabled={selectedLeaveCount === 0}>
              선택 반려
            </button>
          </div>
          {pendingLeave.length === 0 ? (
            <p className="small muted">대기 중인 휴가 요청이 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="휴가 승인 대기">
              {pendingLeave.map((request) => (
                <li key={request.id}>
                  <label className="queue-item-main">
                    <input
                      type="checkbox"
                      checked={selectedLeaveIds.includes(request.id)}
                      onChange={(event) => toggleLeaveSelection(request.id, event.target.checked)}
                    />
                    <span>
                      <strong>{request.employeeId}</strong>{" "}
                      <span className="muted">
                        {request.leaveType} / {formatDateTime(request.startDate)} ~{" "}
                        {formatDateTime(request.endDate)} ({formatDays(request.days)}일
                        {request.unit === "HOUR" && request.hours !== null
                          ? ` / ${request.hours.toFixed(2)}시간`
                          : request.unit === "HALF_DAY"
                            ? " / 반차"
                            : ""}
                        )
                      </span>
                    </span>
                  </label>
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

          <hr className="divider" />
          <div className="actions">
            <p className="small" style={{ margin: 0 }}>
              최근 처리 이력 ({approvalActivities.length}건)
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setApprovalActivities([])}
              disabled={approvalActivities.length === 0}
            >
              이력 초기화
            </button>
          </div>
          {approvalActivities.length === 0 ? (
            <p className="small muted">아직 처리 이력이 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="승인 처리 이력">
              {approvalActivities.map((activity) => (
                <li key={activity.id}>
                  <span>
                    <span className={activity.ok ? "ok" : "fail"}>{activity.ok ? "OK" : "FAIL"}</span>{" "}
                    <strong>[{activity.queue}]</strong> {activity.action} · {activity.itemId}{" "}
                    <span className="muted">
                      ({activity.status} · {activity.at})
                    </span>
                  </span>
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
            <label>
              반차 허용
              <select
                value={leaveAllowHalfDay ? "true" : "false"}
                onChange={(event) => setLeaveAllowHalfDay(event.target.value === "true")}
              >
                <option value="true">허용</option>
                <option value="false">비허용</option>
              </select>
            </label>
            <label>
              시간단위 허용
              <select
                value={leaveAllowHourly ? "true" : "false"}
                onChange={(event) => setLeaveAllowHourly(event.target.value === "true")}
              >
                <option value="true">허용</option>
                <option value="false">비허용</option>
              </select>
            </label>
            <label>
              시간 단위(분)
              <input
                value={leaveHourlyIncrementMinutes}
                onChange={(event) => setLeaveHourlyIncrementMinutes(event.target.value)}
              />
            </label>
            <label>
              1회 최대 시간
              <input
                value={leaveMaxHoursPerRequest}
                onChange={(event) => setLeaveMaxHoursPerRequest(event.target.value)}
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
              결과: 잔여 {formatDays(accrualResult.remainingDays)}일 (부여{" "}
              {formatDays(accrualResult.grantedDays)}일, 사용 {formatDays(accrualResult.usedDays)}일, 이월{" "}
              {formatDays(accrualResult.carryOverDays)}일) / updated{" "}
              {formatDateTime(accrualResult.updatedAt)}
            </p>
          ) : (
            <p className="small muted">정산 결과가 아직 없습니다.</p>
          )}
        </article>

        <article className="panel" id="payroll">
          <h2>급여 프리뷰/확정</h2>
          <p className="small">
            승인된 출퇴근 기반으로 총지급을 산정하거나, 법정공제 기준 프리뷰를 생성할 수 있습니다.
          </p>
          <div className="input-grid">
            <label>
              프리뷰 모드
              <select
                value={payrollPreviewMode}
                onChange={(event) =>
                  setPayrollPreviewMode(event.target.value as "gross" | "statutory_kr_baseline")
                }
              >
                <option value="gross">총지급만</option>
                <option value="statutory_kr_baseline">법정공제(KR baseline)</option>
              </select>
            </label>
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
            {payrollPreviewMode === "statutory_kr_baseline" ? (
              <>
                <label>
                  비과세 소득(KRW)
                  <input
                    type="number"
                    min={0}
                    value={payrollNonTaxableIncomeKrw}
                    onChange={(event) => setPayrollNonTaxableIncomeKrw(event.target.value)}
                  />
                </label>
                <label>
                  기타 공제(KRW)
                  <input
                    type="number"
                    min={0}
                    value={payrollOtherDeductionsKrw}
                    onChange={(event) => setPayrollOtherDeductionsKrw(event.target.value)}
                  />
                </label>
                <label>
                  국민연금 상한(KRW, 선택)
                  <input
                    type="number"
                    min={0}
                    value={payrollNationalPensionCapKrw}
                    onChange={(event) => setPayrollNationalPensionCapKrw(event.target.value)}
                  />
                </label>
                <label>
                  건강보험 상한(KRW, 선택)
                  <input
                    type="number"
                    min={0}
                    value={payrollHealthInsuranceCapKrw}
                    onChange={(event) => setPayrollHealthInsuranceCapKrw(event.target.value)}
                  />
                </label>
                <label>
                  고용보험 상한(KRW, 선택)
                  <input
                    type="number"
                    min={0}
                    value={payrollEmploymentInsuranceCapKrw}
                    onChange={(event) => setPayrollEmploymentInsuranceCapKrw(event.target.value)}
                  />
                </label>
              </>
            ) : null}
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
