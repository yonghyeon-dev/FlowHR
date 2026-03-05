import type {
  AttendanceRecordDto,
  EmployeeDepartmentLeaveCalendarEntryDto,
  LeaveBalanceDto,
  LeaveRequestDto,
  WorkScheduleDto
} from "@/app/employee/page-types";

export type EmployeeCallApi = (
  label: string,
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  payload?: Record<string, unknown>
) => Promise<{ response: Response; body: unknown }>;

export type EmployeeCallApiLabels = {
  attendanceList: string;
  leaveList: string;
  leaveDepartmentCalendar: string;
  scheduleList: string;
  leaveBalance: string;
  createAttendance: string;
  checkOutNow: string;
  requestAttendanceCorrection: string;
  createLeave: string;
  cancelLeave: string;
};

type RefreshEmployeeSnapshotResult = {
  attendance?: AttendanceRecordDto[];
  nextLastAttendanceId?: string;
  nextSelectedCorrectionRecordId?: string;
  leaveRequests?: LeaveRequestDto[];
  departmentLeaveCalendarEntries?: EmployeeDepartmentLeaveCalendarEntryDto[];
  nextLastLeaveRequestId?: string;
  schedules?: WorkScheduleDto[];
  leaveBalance?: LeaveBalanceDto | null;
};

export async function refreshEmployeeSnapshotFromHelper(input: {
  callApi: EmployeeCallApi;
  callApiLabels: EmployeeCallApiLabels;
  fromIso: string;
  toIso: string;
  employeeId: string;
  selectedCorrectionRecordId: string;
  lastAttendanceId: string;
  buildQuery: (params: Record<string, string | undefined>) => string;
}): Promise<RefreshEmployeeSnapshotResult> {
  const resolvedEmployeeId = input.employeeId.trim();
  const [attendanceRes, leaveRes, departmentCalendarRes, scheduleRes, balanceRes] = await Promise.all([
    input.callApi(
      input.callApiLabels.attendanceList,
      "GET",
      `/api/attendance/records${input.buildQuery({ from: input.fromIso, to: input.toIso })}`
    ),
    input.callApi(
      input.callApiLabels.leaveList,
      "GET",
      `/api/leave/requests${input.buildQuery({ from: input.fromIso, to: input.toIso })}`
    ),
    input.callApi(
      input.callApiLabels.leaveDepartmentCalendar,
      "GET",
      `/api/leave/calendar/employee${input.buildQuery({ from: input.fromIso, to: input.toIso })}`
    ),
    input.callApi(
      input.callApiLabels.scheduleList,
      "GET",
      `/api/scheduling/schedules${input.buildQuery({ from: input.fromIso, to: input.toIso })}`
    ),
    resolvedEmployeeId.length > 0
      ? input.callApi(
          input.callApiLabels.leaveBalance,
          "GET",
          `/api/leave/balances/${encodeURIComponent(resolvedEmployeeId)}`
        )
      : Promise.resolve({
          response: new Response(null, { status: 400 }),
          body: null
        })
  ]);

  const result: RefreshEmployeeSnapshotResult = {};
  if (attendanceRes.response.ok) {
    const parsed = attendanceRes.body as { records?: AttendanceRecordDto[] };
    const records = parsed.records ?? [];
    const recentRecords = records.slice().reverse().slice(-10).reverse();
    result.attendance = recentRecords;
    const pending = records.find((record) => record.state === "PENDING");
    if (pending) {
      result.nextLastAttendanceId = pending.id;
      result.nextSelectedCorrectionRecordId = pending.id;
    } else if (
      recentRecords.length > 0 &&
      !input.selectedCorrectionRecordId.trim() &&
      !input.lastAttendanceId.trim()
    ) {
      const latestId = recentRecords[recentRecords.length - 1].id;
      result.nextSelectedCorrectionRecordId = latestId;
      result.nextLastAttendanceId = latestId;
    }
  }

  if (leaveRes.response.ok) {
    const parsed = leaveRes.body as { requests?: LeaveRequestDto[] };
    const requests = parsed.requests ?? [];
    result.leaveRequests = requests.slice().reverse().slice(-10).reverse();
    const pending = requests.find((request) => request.state === "PENDING");
    if (pending) {
      result.nextLastLeaveRequestId = pending.id;
    }
  }

  if (departmentCalendarRes.response.ok) {
    const parsed = departmentCalendarRes.body as { entries?: EmployeeDepartmentLeaveCalendarEntryDto[] };
    result.departmentLeaveCalendarEntries = parsed.entries ?? [];
  }

  if (scheduleRes.response.ok) {
    const parsed = scheduleRes.body as { schedules?: WorkScheduleDto[] };
    const items = parsed.schedules ?? [];
    result.schedules = items.slice().reverse().slice(-10).reverse();
  }

  if (balanceRes.response.ok) {
    const parsed = balanceRes.body as { balance?: LeaveBalanceDto };
    result.leaveBalance = parsed.balance ?? null;
  }

  return result;
}

export async function createAttendanceFromHelper(input: {
  callApi: EmployeeCallApi;
  callApiLabels: EmployeeCallApiLabels;
  employeeId: string;
  checkInAt: string;
  checkOutAt: string;
  breakMinutes: string;
  isHoliday: boolean;
  attendanceNotes: string;
  toIso: (value: string) => string;
  coerceNumber: (value: string, fallback?: number) => number;
}): Promise<{ ok: boolean; createdRecordId: string | null }> {
  const resolvedEmployeeId = input.employeeId.trim();
  if (!resolvedEmployeeId) {
    return { ok: false, createdRecordId: null };
  }
  const { response, body } = await input.callApi(
    input.callApiLabels.createAttendance,
    "POST",
    "/api/attendance/records",
    {
      employeeId: resolvedEmployeeId,
      checkInAt: input.toIso(input.checkInAt),
      checkOutAt: input.checkOutAt ? input.toIso(input.checkOutAt) : undefined,
      breakMinutes: Math.max(0, Math.trunc(input.coerceNumber(input.breakMinutes))),
      isHoliday: input.isHoliday,
      notes: input.attendanceNotes.trim().length > 0 ? input.attendanceNotes.trim() : undefined
    }
  );

  if (!response.ok) {
    return { ok: false, createdRecordId: null };
  }
  const parsed = body as { record?: { id?: string } };
  return {
    ok: true,
    createdRecordId: parsed.record?.id ?? null
  };
}

export async function checkOutNowFromHelper(input: {
  callApi: EmployeeCallApi;
  callApiLabels: EmployeeCallApiLabels;
  lastAttendanceId: string;
}): Promise<boolean> {
  if (!input.lastAttendanceId.trim()) {
    return false;
  }
  const nowIso = new Date().toISOString();
  const { response } = await input.callApi(
    input.callApiLabels.checkOutNow,
    "PATCH",
    `/api/attendance/records/${input.lastAttendanceId.trim()}`,
    {
      checkOutAt: nowIso
    }
  );
  return response.ok;
}

export async function requestAttendanceCorrectionFromHelper(input: {
  callApi: EmployeeCallApi;
  callApiLabels: EmployeeCallApiLabels;
  lastAttendanceId: string;
  checkInAt: string;
  checkOutAt: string;
  breakMinutes: string;
  isHoliday: boolean;
  attendanceNotes: string;
  correctionRequestNote: string;
  toIso: (value: string) => string;
  coerceNumber: (value: string, fallback?: number) => number;
}): Promise<boolean> {
  if (!input.lastAttendanceId.trim()) {
    return false;
  }
  const { response } = await input.callApi(
    input.callApiLabels.requestAttendanceCorrection,
    "PATCH",
    `/api/attendance/records/${input.lastAttendanceId.trim()}`,
    {
      checkInAt: input.toIso(input.checkInAt),
      checkOutAt: input.checkOutAt ? input.toIso(input.checkOutAt) : undefined,
      breakMinutes: Math.max(0, Math.trunc(input.coerceNumber(input.breakMinutes))),
      isHoliday: input.isHoliday,
      notes:
        input.attendanceNotes.trim().length > 0
          ? input.attendanceNotes.trim()
          : input.correctionRequestNote
    }
  );
  return response.ok;
}

export async function createLeaveFromHelper(input: {
  callApi: EmployeeCallApi;
  callApiLabels: EmployeeCallApiLabels;
  employeeId: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID";
  leaveUnit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  leaveStartDate: string;
  leaveEndDate: string;
  leaveHours: string;
  leaveReason: string;
  toIso: (value: string) => string;
  coerceNumber: (value: string, fallback?: number) => number;
}): Promise<{ ok: boolean; requestId: string | null }> {
  const resolvedEmployeeId = input.employeeId.trim();
  if (!resolvedEmployeeId) {
    return { ok: false, requestId: null };
  }
  const { response, body } = await input.callApi(
    input.callApiLabels.createLeave,
    "POST",
    "/api/leave/requests",
    {
      employeeId: resolvedEmployeeId,
      leaveType: input.leaveType,
      startDate: input.toIso(input.leaveStartDate),
      endDate: input.toIso(input.leaveEndDate),
      unit: input.leaveUnit,
      hours: input.leaveUnit === "HOUR" ? Math.max(0, input.coerceNumber(input.leaveHours)) : undefined,
      reason: input.leaveReason.trim().length > 0 ? input.leaveReason.trim() : undefined
    }
  );

  if (!response.ok) {
    return { ok: false, requestId: null };
  }
  const parsed = body as { request?: { id?: string } };
  return {
    ok: true,
    requestId: parsed.request?.id ?? null
  };
}

export async function cancelLeaveFromHelper(input: {
  callApi: EmployeeCallApi;
  callApiLabels: EmployeeCallApiLabels;
  lastLeaveRequestId: string;
  cancelReason: string;
}): Promise<boolean> {
  if (!input.lastLeaveRequestId.trim()) {
    return false;
  }
  const { response } = await input.callApi(
    input.callApiLabels.cancelLeave,
    "POST",
    `/api/leave/requests/${input.lastLeaveRequestId.trim()}/cancel`,
    {
      reason: input.cancelReason.trim().length > 0 ? input.cancelReason.trim() : undefined
    }
  );
  return response.ok;
}
