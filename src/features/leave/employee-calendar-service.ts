import type { Actor } from "@/lib/actor";
import { resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  DataAccess,
  LeaveRequestState,
  LeaveRequestUnit,
  LeaveType
} from "@/features/shared/data-access";
import { requireEmployeeWithinTenant } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const EMPLOYEE_LEAVE_STATES: LeaveRequestState[] = ["APPROVED", "PENDING", "REJECTED"];

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

export type ListEmployeeDepartmentLeaveCalendarInput = {
  periodStart: Date;
  periodEnd: Date;
};

type EmployeeCalendarState = "APPROVED" | "PENDING" | "REJECTED";

function toSeoulDayIndex(value: Date) {
  const adjusted = new Date(value.getTime() + SEOUL_OFFSET_MS);
  return Math.floor(Date.UTC(adjusted.getUTCFullYear(), adjusted.getUTCMonth(), adjusted.getUTCDate()) / DAY_MS);
}

function format2(value: number) {
  return String(value).padStart(2, "0");
}

function formatSeoulDate(dayIndex: number) {
  const day = new Date(dayIndex * DAY_MS);
  return `${day.getUTCFullYear()}-${format2(day.getUTCMonth() + 1)}-${format2(day.getUTCDate())}`;
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}

export async function listEmployeeDepartmentLeaveCalendar(
  context: ServiceContext,
  input: ListEmployeeDepartmentLeaveCalendarInput
): Promise<{
  organizationId: string;
  scope: {
    employeeId: string;
    departmentId: string | null;
  };
  period: {
    from: string;
    to: string;
    timezone: "Asia/Seoul";
  };
  summary: {
    dayCount: number;
    entryCount: number;
    approvedEntryCount: number;
    pendingEntryCount: number;
    rejectedEntryCount: number;
    uniqueEmployeeCount: number;
    coworkerCount: number;
  };
  days: Array<{
    date: string;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    entries: Array<{
      requestId: string;
      employeeId: string;
      employeeName: string | null;
      isMine: boolean;
      state: EmployeeCalendarState;
      leaveType: LeaveType;
    }>;
  }>;
  entries: Array<{
    requestId: string;
    employeeId: string;
    employeeName: string | null;
    employeeEmail: string | null;
    departmentId: string | null;
    departmentName: string | null;
    isMine: boolean;
    state: EmployeeCalendarState;
    leaveType: LeaveType;
    unit: LeaveRequestUnit;
    hours: number | null;
    days: number;
    startDate: string;
    endDate: string;
    coveredDates: string[];
  }>;
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);

  const permissions = await resolveActorPermissions(context);
  if (
    !permissions.has(Permissions.leaveRequestListOwn) &&
    !permissions.has(Permissions.leaveRequestListAny)
  ) {
    throw new ServiceError(403, "employee leave calendar read requires own-list permission");
  }

  const actorEmployee = await requireEmployeeWithinTenant(context.dataAccess, actor, actor.id);
  if (!actorEmployee.organizationId) {
    throw new ServiceError(404, "employee organization not found");
  }
  const organizationId = actorEmployee.organizationId;
  const departmentId = actorEmployee.departmentId;

  const [employees, departments, approvedRequests, pendingRequests, rejectedRequests] = await Promise.all([
    context.dataAccess.employees.list({ organizationId }),
    context.dataAccess.departments.list({ organizationId }),
    context.dataAccess.leave.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId,
      state: EMPLOYEE_LEAVE_STATES[0]
    }),
    context.dataAccess.leave.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId,
      state: EMPLOYEE_LEAVE_STATES[1]
    }),
    context.dataAccess.leave.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId,
      state: EMPLOYEE_LEAVE_STATES[2]
    })
  ]);

  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));
  const targetEmployeeIds = new Set(
    employees
      .filter((employee) =>
        departmentId ? employee.departmentId === departmentId : employee.id === actorEmployee.id
      )
      .map((employee) => employee.id)
  );
  targetEmployeeIds.add(actorEmployee.id);

  const allRequests = [...approvedRequests, ...pendingRequests, ...rejectedRequests]
    .filter((request) => targetEmployeeIds.has(request.employeeId))
    .sort((a, b) => {
      const startDiff = a.startDate.getTime() - b.startDate.getTime();
      if (startDiff !== 0) {
        return startDiff;
      }
      return a.employeeId.localeCompare(b.employeeId);
    });

  const periodStartDayIndex = toSeoulDayIndex(input.periodStart);
  const periodEndDayIndex = toSeoulDayIndex(new Date(input.periodEnd.getTime() - 1));

  const dayRows = new Map<
    number,
    {
      approvedCount: number;
      pendingCount: number;
      rejectedCount: number;
      entries: Array<{
        requestId: string;
        employeeId: string;
        employeeName: string | null;
        isMine: boolean;
        state: EmployeeCalendarState;
        leaveType: LeaveType;
      }>;
    }
  >();

  for (let dayIndex = periodStartDayIndex; dayIndex <= periodEndDayIndex; dayIndex += 1) {
    dayRows.set(dayIndex, {
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      entries: []
    });
  }

  const entries = allRequests.map((request) => {
    const employee = employeeById.get(request.employeeId) ?? null;
    const state = request.state as EmployeeCalendarState;
    const requestStartDayIndex = toSeoulDayIndex(request.startDate);
    const requestEndDayIndex = toSeoulDayIndex(request.endDate);
    const coveredStartDayIndex = Math.max(requestStartDayIndex, periodStartDayIndex);
    const coveredEndDayIndex = Math.min(requestEndDayIndex, periodEndDayIndex);

    const coveredDates: string[] = [];
    for (let dayIndex = coveredStartDayIndex; dayIndex <= coveredEndDayIndex; dayIndex += 1) {
      coveredDates.push(formatSeoulDate(dayIndex));
      const row = dayRows.get(dayIndex);
      if (!row) {
        continue;
      }
      if (state === "APPROVED") {
        row.approvedCount += 1;
      } else if (state === "PENDING") {
        row.pendingCount += 1;
      } else {
        row.rejectedCount += 1;
      }
      row.entries.push({
        requestId: request.id,
        employeeId: request.employeeId,
        employeeName: employee?.name ?? null,
        isMine: request.employeeId === actorEmployee.id,
        state,
        leaveType: request.leaveType
      });
    }

    return {
      requestId: request.id,
      employeeId: request.employeeId,
      employeeName: employee?.name ?? null,
      employeeEmail: employee?.email ?? null,
      departmentId: employee?.departmentId ?? null,
      departmentName: employee?.departmentId ? (departmentNameById.get(employee.departmentId) ?? null) : null,
      isMine: request.employeeId === actorEmployee.id,
      state,
      leaveType: request.leaveType,
      unit: request.unit,
      hours: request.hours,
      days: request.days,
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
      coveredDates
    };
  });

  const days = Array.from(dayRows.entries())
    .sort(([left], [right]) => left - right)
    .map(([dayIndex, row]) => ({
      date: formatSeoulDate(dayIndex),
      approvedCount: row.approvedCount,
      pendingCount: row.pendingCount,
      rejectedCount: row.rejectedCount,
      entries: row.entries.sort((left, right) => {
        if (left.isMine !== right.isMine) {
          return left.isMine ? -1 : 1;
        }
        const nameLeft = left.employeeName ?? left.employeeId;
        const nameRight = right.employeeName ?? right.employeeId;
        return nameLeft.localeCompare(nameRight);
      })
    }));

  const uniqueEmployeeIds = new Set(entries.map((entry) => entry.employeeId));
  const approvedEntryCount = entries.filter((entry) => entry.state === "APPROVED").length;
  const pendingEntryCount = entries.filter((entry) => entry.state === "PENDING").length;
  const rejectedEntryCount = entries.filter((entry) => entry.state === "REJECTED").length;
  const coworkerCount = Array.from(uniqueEmployeeIds.values()).filter(
    (employeeId) => employeeId !== actorEmployee.id
  ).length;

  await context.dataAccess.audit.append({
    action: "leave.employee_calendar_read",
    entityType: "LeaveRequest",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: actorEmployee.id,
      departmentId,
      from: input.periodStart.toISOString(),
      to: input.periodEnd.toISOString(),
      entryCount: entries.length,
      approvedEntryCount,
      pendingEntryCount,
      rejectedEntryCount,
      uniqueEmployeeCount: uniqueEmployeeIds.size,
      coworkerCount
    }
  });

  return {
    organizationId,
    scope: {
      employeeId: actorEmployee.id,
      departmentId
    },
    period: {
      from: input.periodStart.toISOString(),
      to: input.periodEnd.toISOString(),
      timezone: "Asia/Seoul"
    },
    summary: {
      dayCount: days.length,
      entryCount: entries.length,
      approvedEntryCount,
      pendingEntryCount,
      rejectedEntryCount,
      uniqueEmployeeCount: uniqueEmployeeIds.size,
      coworkerCount
    },
    days,
    entries
  };
}
