import { z } from "zod";

import type { AttendanceRecordEntity, EmployeeEntity } from "@/features/shared/data-access";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";

export const attendanceAnomalyTypes = [
  "LATE_CLOCK_IN",
  "EARLY_CLOCK_OUT",
  "MISSING_CLOCK_OUT",
  "AUTO_CLOSED",
  "OVERTIME"
] as const;

export type AttendanceAnomalyType = (typeof attendanceAnomalyTypes)[number];

const attendanceAnomalyTypeSet = new Set<string>(attendanceAnomalyTypes);

const listAttendanceAnomaliesQuerySchema = z.object({
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  anomalyType: z.enum(attendanceAnomalyTypes).optional(),
  employeeId: z.string().trim().min(1).optional(),
  departmentId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export type ListAttendanceAnomaliesQuery = {
  from: Date;
  to: Date;
  anomalyType?: AttendanceAnomalyType;
  employeeId?: string;
  departmentId?: string;
  limit?: number;
  offset?: number;
};

export type AttendanceAnomalySummary = {
  totalAnomalies: number;
  byType: Record<string, number>;
};

export type ListAttendanceAnomaliesResult = {
  items: AttendanceRecordEntity[];
  total: number;
  summary: AttendanceAnomalySummary;
  employeeById: Map<string, EmployeeEntity>;
};

function normalizeOffsetDateTime(value: string | null) {
  return value ? value.replace(/ /g, "+") : value;
}

function toDate(value: string) {
  return new Date(value);
}

function resolveNormalizedAnomalyType(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized || !attendanceAnomalyTypeSet.has(normalized)) {
    return null;
  }
  return normalized as AttendanceAnomalyType;
}

function buildAnomalySummary(items: AttendanceRecordEntity[]): AttendanceAnomalySummary {
  const byType: Record<string, number> = {};
  for (const item of items) {
    const anomalyType = resolveNormalizedAnomalyType(item.anomalyType);
    if (!anomalyType) {
      continue;
    }
    byType[anomalyType] = (byType[anomalyType] ?? 0) + 1;
  }
  return {
    totalAnomalies: items.length,
    byType
  };
}

function withPagination(
  items: AttendanceRecordEntity[],
  pagination: { limit: number; offset: number } | undefined
) {
  if (!pagination) {
    return items;
  }
  return items.slice(pagination.offset, pagination.offset + pagination.limit);
}

export function parseAttendanceAnomaliesQuery(url: URL) {
  const parsed = listAttendanceAnomaliesQuerySchema.safeParse({
    from: normalizeOffsetDateTime(url.searchParams.get("from")),
    to: normalizeOffsetDateTime(url.searchParams.get("to")),
    anomalyType: url.searchParams.get("anomalyType") ?? undefined,
    employeeId: url.searchParams.get("employeeId") ?? undefined,
    departmentId: url.searchParams.get("departmentId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.flatten()
    };
  }

  const from = toDate(parsed.data.from);
  const to = toDate(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return {
      ok: false as const,
      error: {
        fieldErrors: {
          from: ["from and to must be valid ISO datetime values"]
        }
      }
    };
  }
  if (from.getTime() > to.getTime()) {
    return {
      ok: false as const,
      error: {
        fieldErrors: {
          from: ["from must be less than or equal to to"]
        }
      }
    };
  }

  return {
    ok: true as const,
    query: {
      from,
      to,
      anomalyType: parsed.data.anomalyType,
      employeeId: parsed.data.employeeId,
      departmentId: parsed.data.departmentId,
      limit: parsed.data.limit,
      offset: parsed.data.offset
    } satisfies ListAttendanceAnomaliesQuery
  };
}

export async function listAttendanceAnomalies(input: {
  organizationId: string;
  query: ListAttendanceAnomaliesQuery;
  pagination?: { limit: number; offset: number };
}): Promise<ListAttendanceAnomaliesResult> {
  const dataAccess = getRuntimeDataAccess();
  const [employees, attendanceRecords] = await Promise.all([
    dataAccess.employees.list({ organizationId: input.organizationId }),
    dataAccess.attendance.listInPeriod({
      periodStart: input.query.from,
      periodEnd: input.query.to,
      organizationId: input.organizationId
    })
  ]);

  const employeeById = new Map(
    employees
      .filter((employee) =>
        input.query.departmentId ? employee.departmentId === input.query.departmentId : true
      )
      .map((employee) => [employee.id, employee] as const)
  );

  const filtered = attendanceRecords.filter((record) => {
    if (!employeeById.has(record.employeeId)) {
      return false;
    }
    if (input.query.employeeId && record.employeeId !== input.query.employeeId) {
      return false;
    }
    const anomalyType = resolveNormalizedAnomalyType(record.anomalyType);
    if (!anomalyType) {
      return false;
    }
    if (input.query.anomalyType && anomalyType !== input.query.anomalyType) {
      return false;
    }
    return true;
  });

  return {
    items: withPagination(filtered, input.pagination),
    total: filtered.length,
    summary: buildAnomalySummary(filtered),
    employeeById
  };
}
