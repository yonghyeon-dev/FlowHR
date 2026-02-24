import type {
  ApiLog,
  AttendanceAggregateDto,
  AttendanceRecordDto,
  EmployeeSummary,
  InviteDeliveryMode,
  InviteResultDto,
  InviteRole,
  LeaveBalanceDto,
  LeaveRequestDto,
  OrganizationSummary,
  PayrollRunDto,
  WorkScheduleDto
} from "@/app/admin/page-types";

export type AdminCallApi = (
  label: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  payload?: Record<string, unknown>,
  options?: { omitOrganizationHeader?: boolean }
) => Promise<{ response: Response; body: unknown }>;

export function buildAdminValidationFailureLog(input: {
  label: string;
  error: string;
  runtimeLocale: string;
}): ApiLog {
  return {
    id: Date.now(),
    label: input.label,
    status: 400,
    ok: false,
    durationMs: 0,
    at: new Date().toLocaleString(input.runtimeLocale),
    body: { error: input.error }
  };
}

export async function listEmployeesFromHelper(input: {
  callApi: AdminCallApi;
  organizationId: string;
  buildQuery: (params: Record<string, string | undefined>) => string;
}): Promise<EmployeeSummary[] | null> {
  const { response, body } = await input.callApi(
    "직원 목록 조회",
    "GET",
    `/api/people/employees${input.buildQuery({
      organizationId: input.organizationId.trim() || undefined
    })}`
  );
  if (!response.ok) {
    return null;
  }
  const parsed = body as { employees?: EmployeeSummary[] };
  return Array.isArray(parsed.employees) ? parsed.employees : [];
}

export async function createEmployeeFromHelper(input: {
  callApi: AdminCallApi;
  employeeId: string;
  organizationId: string;
  employeeName: string;
  employeeEmail: string;
  employeeActive: boolean;
}): Promise<{ createdEmployeeId: string | null; ok: boolean }> {
  const payload = {
    id: input.employeeId.trim(),
    organizationId: input.organizationId.trim() || null,
    name: input.employeeName.trim() || undefined,
    email: input.employeeEmail.trim() || undefined,
    active: input.employeeActive
  };
  const { response, body } = await input.callApi("직원 생성", "POST", "/api/people/employees", payload);
  if (!response.ok) {
    return { createdEmployeeId: null, ok: false };
  }
  const parsed = body as { employee?: { id?: string } };
  return { createdEmployeeId: parsed.employee?.id ?? null, ok: true };
}

export async function createInviteFromHelper(input: {
  callApi: AdminCallApi;
  inviteEmail: string;
  inviteRole: InviteRole;
  inviteDeliveryMode: InviteDeliveryMode;
  organizationId: string;
  inviteActorId: string;
}): Promise<InviteResultDto | null> {
  const email = input.inviteEmail.trim();
  if (!email) {
    return null;
  }

  const payload = {
    email,
    role: input.inviteRole,
    deliveryMode: input.inviteDeliveryMode,
    organizationId: input.organizationId.trim() || undefined,
    actorId: input.inviteActorId.trim() || undefined
  };
  const { response, body } = await input.callApi("직원 초대 생성", "POST", "/api/auth/invites", payload);
  if (!response.ok) {
    return null;
  }

  const parsed = body as { invite?: InviteResultDto };
  return parsed.invite ?? null;
}

export async function listSchedulesFromHelper(input: {
  callApi: AdminCallApi;
  periodStart: string;
  periodEnd: string;
  scheduleEmployeeId: string;
  toIso: (value: string) => string;
  buildQuery: (params: Record<string, string | undefined>) => string;
}): Promise<WorkScheduleDto[] | null> {
  const { response, body } = await input.callApi(
    "근무 일정 조회",
    "GET",
    `/api/scheduling/schedules${input.buildQuery({
      from: input.toIso(input.periodStart),
      to: input.toIso(input.periodEnd),
      employeeId: input.scheduleEmployeeId.trim() || undefined
    })}`
  );
  if (!response.ok) {
    return null;
  }
  const parsed = body as { schedules?: WorkScheduleDto[] };
  return Array.isArray(parsed.schedules) ? parsed.schedules : [];
}

export async function createScheduleFromHelper(input: {
  callApi: AdminCallApi;
  scheduleEmployeeId: string;
  scheduleStartAt: string;
  scheduleEndAt: string;
  scheduleBreakMinutes: string;
  scheduleIsHoliday: boolean;
  scheduleNotes: string;
  toIso: (value: string) => string;
}): Promise<boolean> {
  const breakMinutesRaw = Number(input.scheduleBreakMinutes);
  const payload = {
    employeeId: input.scheduleEmployeeId.trim(),
    startAt: input.toIso(input.scheduleStartAt),
    endAt: input.toIso(input.scheduleEndAt),
    breakMinutes: Math.max(0, Math.trunc(Number.isFinite(breakMinutesRaw) ? breakMinutesRaw : 0)),
    isHoliday: input.scheduleIsHoliday,
    notes: input.scheduleNotes.trim() ? input.scheduleNotes.trim() : undefined
  };

  const { response } = await input.callApi("근무 일정 생성", "POST", "/api/scheduling/schedules", payload);
  return response.ok;
}

export async function deleteScheduleFromHelper(input: {
  callApi: AdminCallApi;
  scheduleId: string;
}): Promise<boolean> {
  const scheduleId = input.scheduleId.trim();
  if (!scheduleId) {
    return false;
  }
  const { response } = await input.callApi(
    "근무 일정 삭제",
    "DELETE",
    `/api/scheduling/schedules/${encodeURIComponent(scheduleId)}`
  );
  return response.ok;
}

export async function listOrganizationsFromHelper(input: {
  callApi: AdminCallApi;
}): Promise<OrganizationSummary[] | null> {
  const { response, body } = await input.callApi(
    "조직 목록 조회",
    "GET",
    "/api/people/organizations",
    undefined,
    {
      omitOrganizationHeader: true
    }
  );
  if (!response.ok) {
    return null;
  }
  const parsed = body as { organizations?: OrganizationSummary[] };
  return Array.isArray(parsed.organizations) ? parsed.organizations : [];
}

export async function createOrganizationFromHelper(input: {
  callApi: AdminCallApi;
  organizationName: string;
}): Promise<string | null> {
  const { response, body } = await input.callApi(
    "조직 생성",
    "POST",
    "/api/people/organizations",
    { name: input.organizationName.trim() },
    { omitOrganizationHeader: true }
  );
  if (!response.ok) {
    return null;
  }
  const parsed = body as { organization?: { id?: string } };
  const createdId = parsed.organization?.id;
  if (typeof createdId !== "string" || createdId.trim().length === 0) {
    return null;
  }
  return createdId.trim();
}

type LeavePolicyPayload = {
  annualGrantDays?: number;
  carryOverCapDays?: number;
  allowHalfDay?: boolean;
  allowHourly?: boolean;
  hourlyIncrementMinutes?: number;
  maxHoursPerRequest?: number;
  minNoticeDays?: number;
  maxConsecutiveDays?: number | null;
};

export async function loadLeavePolicyFromHelper(input: {
  callApi: AdminCallApi;
  organizationId: string;
  buildQuery: (params: Record<string, string | undefined>) => string;
}): Promise<LeavePolicyPayload | null> {
  const orgId = input.organizationId.trim();
  if (!orgId) {
    return null;
  }
  const { response, body } = await input.callApi(
    "휴가 정책 조회",
    "GET",
    `/api/leave/policy${input.buildQuery({ organizationId: orgId })}`
  );
  if (!response.ok) {
    return null;
  }
  const parsed = body as { policy?: LeavePolicyPayload };
  return parsed.policy ?? null;
}

export async function saveLeavePolicyFromHelper(input: {
  callApi: AdminCallApi;
  organizationId: string;
  accrualGrantDays: string;
  accrualCarryCapDays: string;
  leaveAllowHalfDay: boolean;
  leaveAllowHourly: boolean;
  leaveHourlyIncrementMinutes: string;
  leaveMaxHoursPerRequest: string;
  leaveMinNoticeDays: string;
  leaveMaxConsecutiveDays: string;
}): Promise<boolean> {
  const orgId = input.organizationId.trim();
  if (!orgId) {
    return false;
  }

  const annualGrantDays = Number(input.accrualGrantDays.trim());
  const carryOverCapDays = Number(input.accrualCarryCapDays.trim());
  const hourlyIncrementMinutes = Number(input.leaveHourlyIncrementMinutes.trim());
  const maxHoursPerRequest = Number(input.leaveMaxHoursPerRequest.trim());
  const minNoticeDaysRaw = input.leaveMinNoticeDays.trim();
  const minNoticeDays = minNoticeDaysRaw.length > 0 ? Number(minNoticeDaysRaw) : Number.NaN;
  const maxConsecutiveDaysRaw = input.leaveMaxConsecutiveDays.trim();
  const maxConsecutiveDays =
    maxConsecutiveDaysRaw.length > 0 ? Number(maxConsecutiveDaysRaw) : null;

  const payload = {
    organizationId: orgId,
    annualGrantDays,
    carryOverCapDays,
    allowHalfDay: input.leaveAllowHalfDay,
    allowHourly: input.leaveAllowHourly,
    hourlyIncrementMinutes,
    maxHoursPerRequest,
    minNoticeDays: Number.isFinite(minNoticeDays) ? minNoticeDays : undefined,
    maxConsecutiveDays:
      maxConsecutiveDays === null
        ? null
        : Number.isFinite(maxConsecutiveDays)
          ? maxConsecutiveDays
          : undefined
  };
  const { response } = await input.callApi("휴가 정책 저장", "PUT", "/api/leave/policy", payload);
  return response.ok;
}

export async function listAttendanceAggregatesFromHelper(input: {
  callApi: AdminCallApi;
  periodStart: string;
  periodEnd: string;
  aggregateEmployeeId: string;
  employeeIdOverride?: string;
  toIso: (value: string) => string;
  buildQuery: (params: Record<string, string | undefined>) => string;
}): Promise<AttendanceAggregateDto[] | null> {
  const from = input.toIso(input.periodStart);
  const to = input.toIso(input.periodEnd);
  const employeeCandidate = input.employeeIdOverride;
  const employee =
    typeof employeeCandidate === "string" ? employeeCandidate.trim() : input.aggregateEmployeeId.trim();
  const { response, body } = await input.callApi(
    employee ? "근태 집계 조회" : "근태 집계 조회(전체)",
    "GET",
    `/api/attendance/aggregates${input.buildQuery({
      from,
      to,
      employeeId: employee.length > 0 ? employee : undefined
    })}`
  );
  if (!response.ok) {
    return null;
  }
  const parsed = body as { aggregates?: AttendanceAggregateDto[] };
  return Array.isArray(parsed.aggregates) ? parsed.aggregates : [];
}

export async function refreshAdminInboxFromHelper(input: {
  callApi: AdminCallApi;
  periodStart: string;
  periodEnd: string;
  toIso: (value: string) => string;
  buildQuery: (params: Record<string, string | undefined>) => string;
}): Promise<{
  pendingAttendance: AttendanceRecordDto[];
  pendingLeave: LeaveRequestDto[];
  previewedPayroll: PayrollRunDto[];
}> {
  const from = input.toIso(input.periodStart);
  const to = input.toIso(input.periodEnd);

  const [attendanceRes, leaveRes, payrollRes] = await Promise.all([
    input.callApi(
      "승인 대기 출퇴근 조회",
      "GET",
      `/api/attendance/records${input.buildQuery({ from, to, state: "PENDING" })}`
    ),
    input.callApi(
      "승인 대기 휴가 조회",
      "GET",
      `/api/leave/requests${input.buildQuery({ from, to, state: "PENDING" })}`
    ),
    input.callApi(
      "프리뷰 급여 조회",
      "GET",
      `/api/payroll/runs${input.buildQuery({ from, to, state: "PREVIEWED" })}`
    )
  ]);

  const pendingAttendance = attendanceRes.response.ok
    ? Array.isArray((attendanceRes.body as { records?: AttendanceRecordDto[] }).records)
      ? ((attendanceRes.body as { records?: AttendanceRecordDto[] }).records ?? [])
      : []
    : [];
  const pendingLeave = leaveRes.response.ok
    ? Array.isArray((leaveRes.body as { requests?: LeaveRequestDto[] }).requests)
      ? ((leaveRes.body as { requests?: LeaveRequestDto[] }).requests ?? [])
      : []
    : [];
  const previewedPayroll = payrollRes.response.ok
    ? Array.isArray((payrollRes.body as { runs?: PayrollRunDto[] }).runs)
      ? ((payrollRes.body as { runs?: PayrollRunDto[] }).runs ?? [])
      : []
    : [];

  return { pendingAttendance, pendingLeave, previewedPayroll };
}

export async function confirmPayrollFromHelper(input: {
  callApi: AdminCallApi;
  runId: string;
}): Promise<{ ok: boolean; status: number; confirmedRunId: string | null }> {
  const { response, body } = await input.callApi(
    "급여 확정",
    "POST",
    `/api/payroll/runs/${input.runId}/confirm`
  );
  const parsed = body as { run?: { id?: string } };
  return {
    ok: response.ok,
    status: response.status,
    confirmedRunId: parsed.run?.id ?? null
  };
}

export async function settleLeaveAccrualFromHelper(input: {
  callApi: AdminCallApi;
  accrualYear: string;
  accrualGrantDays: string;
  accrualCarryCapDays: string;
  accrualEmployeeId: string;
}): Promise<LeaveBalanceDto | null> {
  const year = Number(input.accrualYear);
  const annualGrantDaysRaw = input.accrualGrantDays.trim();
  const carryOverCapDaysRaw = input.accrualCarryCapDays.trim();
  const annualGrantDays = annualGrantDaysRaw.length > 0 ? Number(annualGrantDaysRaw) : Number.NaN;
  const carryOverCapDays = carryOverCapDaysRaw.length > 0 ? Number(carryOverCapDaysRaw) : Number.NaN;
  const payload = {
    employeeId: input.accrualEmployeeId.trim(),
    year,
    annualGrantDays: Number.isFinite(annualGrantDays) ? annualGrantDays : undefined,
    carryOverCapDays: Number.isFinite(carryOverCapDays) ? carryOverCapDays : undefined
  };
  const { response, body } = await input.callApi(
    "휴가 정산(부여/이월)",
    "POST",
    "/api/leave/accrual/settle",
    payload
  );
  if (!response.ok) {
    return null;
  }
  const parsed = body as { balance?: LeaveBalanceDto };
  return parsed.balance ?? null;
}
