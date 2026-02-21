import type { Actor } from "@/lib/actor";
import { resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  DataAccess,
  LeaveRequestState,
  LeaveRequestUnit,
  LeaveType
} from "@/features/shared/data-access";
import { ensureTenantMatch, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_OVERLAP_WARNING_THRESHOLD = 100;

export type ListLeaveCalendarInput = {
  organizationId?: string;
  periodStart: Date;
  periodEnd: Date;
  departmentId?: string;
  includePending?: boolean;
  overlapWarningThreshold?: number;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

type DayEmployeeState = "APPROVED" | "PENDING";

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

function resolveTargetOrganizationId(actor: Actor | null, inputOrganizationId?: string) {
  const candidate = (inputOrganizationId ?? actor?.organizationId ?? "").trim();
  if (!candidate) {
    throw new ServiceError(400, "organizationId is required");
  }
  return candidate;
}

function ensureTenantAccess(actor: Actor | null, organizationId: string) {
  const tenantScope = resolveTenantScope(actor);
  ensureTenantMatch(tenantScope, organizationId, "organization not found");
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}

function ensureValidOverlapWarningThreshold(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > MAX_OVERLAP_WARNING_THRESHOLD) {
    throw new ServiceError(
      400,
      `overlapWarningThreshold must be an integer between 1 and ${MAX_OVERLAP_WARNING_THRESHOLD}`
    );
  }
}

export async function listLeaveCalendar(
  context: ServiceContext,
  input: ListLeaveCalendarInput
): Promise<{
  organizationId: string;
  period: {
    from: string;
    to: string;
    timezone: "Asia/Seoul";
  };
  filters: {
    departmentId: string | null;
    includePending: boolean;
    overlapWarningThreshold: number;
  };
  summary: {
    dayCount: number;
    approvedEntryCount: number;
    pendingEntryCount: number;
    warningDayCount: number;
    uniqueEmployeeCount: number;
  };
  days: Array<{
    date: string;
    approvedCount: number;
    pendingCount: number;
    warning: boolean;
    employees: Array<{
      employeeId: string;
      name: string | null;
      departmentName: string | null;
      states: DayEmployeeState[];
    }>;
  }>;
  entries: Array<{
    requestId: string;
    employeeId: string;
    employeeName: string | null;
    employeeEmail: string | null;
    departmentId: string | null;
    departmentName: string | null;
    state: DayEmployeeState;
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

  const permissions = await resolveActorPermissions(context);
  if (!permissions.has(Permissions.leaveRequestListAny)) {
    throw new ServiceError(403, "leave calendar read requires list-any permission");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);

  const organizationId = resolveTargetOrganizationId(actor, input.organizationId);
  ensureTenantAccess(actor, organizationId);

  const includePending = input.includePending ?? false;
  const overlapWarningThreshold = input.overlapWarningThreshold ?? 2;
  ensureValidOverlapWarningThreshold(overlapWarningThreshold);

  const departmentId = input.departmentId?.trim() ? input.departmentId.trim() : null;

  const [employees, departments] = await Promise.all([
    context.dataAccess.employees.list({ organizationId }),
    context.dataAccess.departments.list({ organizationId })
  ]);

  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

  const targetEmployeeIds = new Set(
    employees
      .filter((employee) => (departmentId ? employee.departmentId === departmentId : true))
      .map((employee) => employee.id)
  );

  const approvedRequests = await context.dataAccess.leave.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId,
    state: "APPROVED"
  });

  const pendingRequests = includePending
    ? await context.dataAccess.leave.listInPeriod({
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        organizationId,
        state: "PENDING"
      })
    : [];

  const requestRows = [...approvedRequests, ...pendingRequests]
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

  const dayRowsByIndex = new Map<
    number,
    {
      approvedEmployeeIds: Set<string>;
      pendingEmployeeIds: Set<string>;
      employeeStates: Map<string, Set<DayEmployeeState>>;
    }
  >();

  for (let dayIndex = periodStartDayIndex; dayIndex <= periodEndDayIndex; dayIndex += 1) {
    dayRowsByIndex.set(dayIndex, {
      approvedEmployeeIds: new Set(),
      pendingEmployeeIds: new Set(),
      employeeStates: new Map()
    });
  }

  const uniqueEmployeeIds = new Set<string>();

  const entries = requestRows.map((request) => {
    const employee = employeeById.get(request.employeeId) ?? null;
    const state = request.state as LeaveRequestState;
    if (state !== "APPROVED" && state !== "PENDING") {
      throw new ServiceError(500, "leave calendar includes unsupported request state");
    }

    const requestStartDayIndex = toSeoulDayIndex(request.startDate);
    const requestEndDayIndex = toSeoulDayIndex(request.endDate);
    const coveredStartDayIndex = Math.max(requestStartDayIndex, periodStartDayIndex);
    const coveredEndDayIndex = Math.min(requestEndDayIndex, periodEndDayIndex);

    const coveredDates: string[] = [];
    for (let dayIndex = coveredStartDayIndex; dayIndex <= coveredEndDayIndex; dayIndex += 1) {
      coveredDates.push(formatSeoulDate(dayIndex));

      const dayRow = dayRowsByIndex.get(dayIndex);
      if (!dayRow) {
        continue;
      }

      if (state === "APPROVED") {
        dayRow.approvedEmployeeIds.add(request.employeeId);
      } else {
        dayRow.pendingEmployeeIds.add(request.employeeId);
      }

      const existingStates = dayRow.employeeStates.get(request.employeeId) ?? new Set<DayEmployeeState>();
      existingStates.add(state);
      dayRow.employeeStates.set(request.employeeId, existingStates);
    }

    uniqueEmployeeIds.add(request.employeeId);

    return {
      requestId: request.id,
      employeeId: request.employeeId,
      employeeName: employee?.name ?? null,
      employeeEmail: employee?.email ?? null,
      departmentId: employee?.departmentId ?? null,
      departmentName: employee?.departmentId ? (departmentNameById.get(employee.departmentId) ?? null) : null,
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

  const days = Array.from(dayRowsByIndex.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayIndex, dayRow]) => {
      const approvedCount = dayRow.approvedEmployeeIds.size;
      const pendingCount = dayRow.pendingEmployeeIds.size;
      const occupancyCount = includePending ? approvedCount + pendingCount : approvedCount;
      const warning = occupancyCount >= overlapWarningThreshold;

      const employeesForDay = Array.from(dayRow.employeeStates.entries())
        .map(([employeeId, states]) => {
          const employee = employeeById.get(employeeId) ?? null;
          const departmentName = employee?.departmentId
            ? (departmentNameById.get(employee.departmentId) ?? null)
            : null;
          return {
            employeeId,
            name: employee?.name ?? null,
            departmentName,
            states: Array.from(states.values()).sort() as DayEmployeeState[]
          };
        })
        .sort((a, b) => a.employeeId.localeCompare(b.employeeId));

      return {
        date: formatSeoulDate(dayIndex),
        approvedCount,
        pendingCount,
        warning,
        employees: employeesForDay
      };
    });

  const approvedEntryCount = entries.filter((entry) => entry.state === "APPROVED").length;
  const pendingEntryCount = entries.filter((entry) => entry.state === "PENDING").length;
  const warningDayCount = days.filter((day) => day.warning).length;

  await context.dataAccess.audit.append({
    action: "leave.calendar_read",
    entityType: "LeaveRequest",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      from: input.periodStart.toISOString(),
      to: input.periodEnd.toISOString(),
      departmentId,
      includePending,
      overlapWarningThreshold,
      approvedEntryCount,
      pendingEntryCount,
      warningDayCount,
      uniqueEmployeeCount: uniqueEmployeeIds.size
    }
  });

  return {
    organizationId,
    period: {
      from: input.periodStart.toISOString(),
      to: input.periodEnd.toISOString(),
      timezone: "Asia/Seoul"
    },
    filters: {
      departmentId,
      includePending,
      overlapWarningThreshold
    },
    summary: {
      dayCount: days.length,
      approvedEntryCount,
      pendingEntryCount,
      warningDayCount,
      uniqueEmployeeCount: uniqueEmployeeIds.size
    },
    days,
    entries
  };
}
