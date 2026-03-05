import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";

import {
  parseOptionalInteger,
  pendingQuerySchema,
  requireAdminOrManager,
  resolveOrganizationId
} from "../shared";

type PendingItem = {
  type: "attendance" | "leave";
  id: string;
  employeeName: string;
  date: string;
  details: Record<string, unknown>;
};

const MIN_DATE = new Date("2000-01-01T00:00:00.000Z");
const MAX_DATE = new Date("2100-01-01T00:00:00.000Z");

function sortPending(left: PendingItem, right: PendingItem) {
  const byDate = new Date(right.date).getTime() - new Date(left.date).getTime();
  if (byDate !== 0) {
    return byDate;
  }
  if (left.type !== right.type) {
    return left.type.localeCompare(right.type);
  }
  return left.id.localeCompare(right.id);
}

export async function GET(request: Request) {
  const auth = await requireAdminOrManager(request, "admin.approvals.pending");
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = pendingQuerySchema.safeParse({
    type: url.searchParams.get("type") ?? undefined,
    limit: parseOptionalInteger(url.searchParams.get("limit")),
    offset: parseOptionalInteger(url.searchParams.get("offset"))
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const organizationId = resolveOrganizationId(auth.actor);
  const employees = await dataAccess.employees.list({
    organizationId
  });
  const employeeNameById = new Map(
    employees.map((employee) => [employee.id, employee.name?.trim() || employee.id] as const)
  );

  const items: PendingItem[] = [];
  const includeAttendance = !parsed.data.type || parsed.data.type === "attendance";
  const includeLeave = !parsed.data.type || parsed.data.type === "leave";

  if (includeAttendance) {
    const attendanceRecords = await dataAccess.attendance.listInPeriod({
      periodStart: MIN_DATE,
      periodEnd: MAX_DATE,
      organizationId,
      state: "PENDING"
    });
    for (const record of attendanceRecords) {
      items.push({
        type: "attendance",
        id: record.id,
        employeeName: employeeNameById.get(record.employeeId) ?? record.employeeId,
        date: record.checkInAt.toISOString(),
        details: {
          employeeId: record.employeeId,
          checkInAt: record.checkInAt.toISOString(),
          checkOutAt: record.checkOutAt?.toISOString() ?? null,
          breakMinutes: record.breakMinutes,
          isHoliday: record.isHoliday,
          notes: record.notes
        }
      });
    }
  }

  if (includeLeave) {
    const leaveRequests = await dataAccess.leave.listInPeriod({
      periodStart: MIN_DATE,
      periodEnd: MAX_DATE,
      organizationId,
      state: "PENDING"
    });
    for (const leaveRequest of leaveRequests) {
      items.push({
        type: "leave",
        id: leaveRequest.id,
        employeeName: employeeNameById.get(leaveRequest.employeeId) ?? leaveRequest.employeeId,
        date: leaveRequest.startDate.toISOString(),
        details: {
          employeeId: leaveRequest.employeeId,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate.toISOString(),
          endDate: leaveRequest.endDate.toISOString(),
          unit: leaveRequest.unit,
          hours: leaveRequest.hours,
          days: leaveRequest.days,
          reason: leaveRequest.reason
        }
      });
    }
  }

  items.sort(sortPending);
  const total = items.length;
  const pagedItems = items.slice(parsed.data.offset, parsed.data.offset + parsed.data.limit);

  return ok({
    items: pagedItems,
    total
  });
}

