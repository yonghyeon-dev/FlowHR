import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { workedMinutes } from "@/lib/payroll-rules";

import { resolveEmployeeName } from "../shared";

const MINUTES_PER_HOUR = 60;
const DAILY_REGULAR_MINUTES = 8 * MINUTES_PER_HOUR;
const WEEKLY_HOUR_LIMIT = 52;
const KOREA_UTC_OFFSET_MS = 9 * 60 * 60 * 1000;

const overtimePeriodSchema = z.enum(["monthly", "quarterly", "yearly"]);

const overtimeBaseQuerySchema = z.object({
  period: overtimePeriodSchema,
  year: z.coerce.number().int().min(2000).max(9999),
  month: z.coerce.number().int().min(1).max(12).optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  departmentId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export type OvertimeReportPeriod = {
  type: "monthly" | "quarterly" | "yearly";
  year: number;
  month?: number;
  quarter?: number;
};

export type OvertimeReportItem = {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  weeklyAverage: number;
  exceededWeeks: number;
};

export type OvertimeReportQuery = {
  period: "monthly" | "quarterly" | "yearly";
  year: number;
  month?: number;
  quarter?: number;
  departmentId?: string;
  limit: number;
  offset: number;
};

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

function minutesToHours(minutes: number) {
  return roundHours(minutes / MINUTES_PER_HOUR);
}

function toKoreanWeekStart(inputDate: Date) {
  const shifted = new Date(inputDate.getTime() + KOREA_UTC_OFFSET_MS);
  const dayOfWeek = shifted.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(shifted.getUTCDate() - daysSinceMonday);
  return new Date(shifted.getTime() - KOREA_UTC_OFFSET_MS);
}

function toKoreanDateOnly(value: Date) {
  return new Date(value.getTime() + KOREA_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

function toMonthPeriodRange(year: number, month: number) {
  return {
    periodStart: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`),
    periodEnd: new Date(
      `${year}-${String(month).padStart(2, "0")}-${String(
        new Date(Date.UTC(year, month, 0)).getUTCDate()
      ).padStart(2, "0")}T23:59:59.999+09:00`
    )
  };
}

function resolvePeriodBoundary(query: OvertimeReportQuery): {
  periodStart: Date;
  periodEnd: Date;
  period: OvertimeReportPeriod;
} {
  if (query.period === "monthly") {
    const month = query.month!;
    const range = toMonthPeriodRange(query.year, month);
    return {
      ...range,
      period: {
        type: "monthly",
        year: query.year,
        month
      }
    };
  }

  if (query.period === "quarterly") {
    const quarter = query.quarter!;
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const startRange = toMonthPeriodRange(query.year, startMonth);
    const endRange = toMonthPeriodRange(query.year, endMonth);
    return {
      periodStart: startRange.periodStart,
      periodEnd: endRange.periodEnd,
      period: {
        type: "quarterly",
        year: query.year,
        quarter
      }
    };
  }

  return {
    periodStart: new Date(`${query.year}-01-01T00:00:00+09:00`),
    periodEnd: new Date(`${query.year}-12-31T23:59:59.999+09:00`),
    period: {
      type: "yearly",
      year: query.year
    }
  };
}

function sortItems(left: OvertimeReportItem, right: OvertimeReportItem) {
  if (left.overtimeHours !== right.overtimeHours) {
    return right.overtimeHours - left.overtimeHours;
  }
  if (left.totalHours !== right.totalHours) {
    return right.totalHours - left.totalHours;
  }
  const byName = left.employeeName.localeCompare(right.employeeName);
  if (byName !== 0) {
    return byName;
  }
  return left.employeeId.localeCompare(right.employeeId);
}

type EmployeeAccumulator = {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  regularMinutes: number;
  overtimeMinutes: number;
  totalMinutes: number;
  weekMinutesByWeekStart: Map<string, number>;
};

function createAccumulator(input: {
  employeeId: string;
  employeeName: string;
  departmentName: string;
}): EmployeeAccumulator {
  return {
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    departmentName: input.departmentName,
    regularMinutes: 0,
    overtimeMinutes: 0,
    totalMinutes: 0,
    weekMinutesByWeekStart: new Map<string, number>()
  };
}

export function parseOvertimeReportQuery(url: URL) {
  const parsed = overtimeBaseQuerySchema.safeParse({
    period: url.searchParams.get("period") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
    month: url.searchParams.get("month") ?? undefined,
    quarter: url.searchParams.get("quarter") ?? undefined,
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

  if (parsed.data.period === "monthly" && parsed.data.month === undefined) {
    return {
      ok: false as const,
      error: {
        fieldErrors: {
          month: ["month is required when period=monthly"]
        }
      }
    };
  }

  if (parsed.data.period === "quarterly" && parsed.data.quarter === undefined) {
    return {
      ok: false as const,
      error: {
        fieldErrors: {
          quarter: ["quarter is required when period=quarterly"]
        }
      }
    };
  }

  const query: OvertimeReportQuery = {
    period: parsed.data.period,
    year: parsed.data.year,
    month: parsed.data.month,
    quarter: parsed.data.quarter,
    departmentId: parsed.data.departmentId,
    limit: parsed.data.limit ?? 50,
    offset: parsed.data.offset ?? 0
  };

  return {
    ok: true as const,
    query
  };
}

export async function listOvertimeReport(input: { organizationId: string; query: OvertimeReportQuery }) {
  const dataAccess = getRuntimeDataAccess();
  const { periodStart, periodEnd, period } = resolvePeriodBoundary(input.query);

  const [employees, departments, attendanceRecords] = await Promise.all([
    dataAccess.employees.list({ organizationId: input.organizationId }),
    dataAccess.departments.list({ organizationId: input.organizationId }),
    dataAccess.attendance.listInPeriod({
      periodStart,
      periodEnd,
      organizationId: input.organizationId
    })
  ]);

  const departmentNameById = new Map(
    departments.map((department) => [department.id, department.name] as const)
  );

  const employeeById = new Map(
    employees
      .filter((employee) =>
        input.query.departmentId ? employee.departmentId === input.query.departmentId : true
      )
      .map((employee) => [employee.id, employee] as const)
  );

  const aggregated = new Map<string, EmployeeAccumulator>();
  for (const record of attendanceRecords) {
    if (!employeeById.has(record.employeeId)) {
      continue;
    }
    if (record.state === "REJECTED") {
      continue;
    }
    if (!record.checkOutAt) {
      continue;
    }

    const employee = employeeById.get(record.employeeId)!;
    const totalWorkedMinutes = workedMinutes(record.checkInAt, record.checkOutAt, record.breakMinutes);
    const regularMinutes = Math.min(totalWorkedMinutes, DAILY_REGULAR_MINUTES);
    const overtimeMinutes = Math.max(0, totalWorkedMinutes - DAILY_REGULAR_MINUTES);

    const existing =
      aggregated.get(record.employeeId) ??
      createAccumulator({
        employeeId: record.employeeId,
        employeeName: resolveEmployeeName(employee),
        departmentName: employee.departmentId ? (departmentNameById.get(employee.departmentId) ?? "") : ""
      });

    existing.regularMinutes += regularMinutes;
    existing.overtimeMinutes += overtimeMinutes;
    existing.totalMinutes += totalWorkedMinutes;

    const weekStart = toKoreanDateOnly(toKoreanWeekStart(record.checkInAt));
    existing.weekMinutesByWeekStart.set(
      weekStart,
      (existing.weekMinutesByWeekStart.get(weekStart) ?? 0) + totalWorkedMinutes
    );

    aggregated.set(record.employeeId, existing);
  }

  const allItems = Array.from(aggregated.values()).map((item) => {
    const weekTotals = Array.from(item.weekMinutesByWeekStart.values());
    const exceededWeeks = weekTotals.filter(
      (totalMinutes) => totalMinutes > WEEKLY_HOUR_LIMIT * MINUTES_PER_HOUR
    ).length;
    const weeklyAverageMinutes =
      weekTotals.length > 0
        ? weekTotals.reduce((sum, totalMinutes) => sum + totalMinutes, 0) / weekTotals.length
        : 0;

    return {
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      departmentName: item.departmentName,
      regularHours: minutesToHours(item.regularMinutes),
      overtimeHours: minutesToHours(item.overtimeMinutes),
      totalHours: minutesToHours(item.totalMinutes),
      weeklyAverage: minutesToHours(weeklyAverageMinutes),
      exceededWeeks
    } satisfies OvertimeReportItem;
  });

  allItems.sort(sortItems);
  const items = allItems.slice(input.query.offset, input.query.offset + input.query.limit);

  return {
    items,
    total: allItems.length,
    period
  };
}

