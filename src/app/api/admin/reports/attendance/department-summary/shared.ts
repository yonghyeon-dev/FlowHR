import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { workedMinutes } from "@/lib/payroll-rules";

const HOURS_PER_MINUTE = 1 / 60;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const departmentAttendanceSummaryQuerySchema = z.object({
  startDate: z.string().trim().regex(DATE_ONLY_PATTERN, "startDate must be YYYY-MM-DD"),
  endDate: z.string().trim().regex(DATE_ONLY_PATTERN, "endDate must be YYYY-MM-DD")
});

export type DepartmentAttendanceSummaryQuery = {
  periodStart: Date;
  periodEnd: Date;
};

export type DepartmentAttendanceSummaryItem = {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  totalWorkHours: number;
  avgWorkHoursPerEmployee: number;
  lateCount: number;
  absentCount: number;
  anomalyCount: number;
  attendanceRate: number;
};

type DepartmentAccumulator = {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  totalWorkMinutes: number;
  lateCount: number;
  absentCount: number;
  anomalyCount: number;
  attendedEmployeeIds: Set<string>;
};

function roundTo2(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
}

function safePercent(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return (numerator / denominator) * 100;
}

function createDepartmentAccumulator(input: {
  departmentId: string;
  departmentName: string;
}): DepartmentAccumulator {
  return {
    departmentId: input.departmentId,
    departmentName: input.departmentName,
    employeeCount: 0,
    totalWorkMinutes: 0,
    lateCount: 0,
    absentCount: 0,
    anomalyCount: 0,
    attendedEmployeeIds: new Set<string>()
  };
}

function toPeriodStartDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toPeriodEndDate(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

function isLateAnomaly(anomalyType: string) {
  return /late/i.test(anomalyType);
}

function isAbsentAnomaly(anomalyType: string) {
  return /(absent|no[\s_-]?show)/i.test(anomalyType);
}

function ensureDepartmentAccumulator(
  accumulators: Map<string, DepartmentAccumulator>,
  input: { departmentId: string; departmentName: string }
) {
  const existing = accumulators.get(input.departmentId);
  if (existing) {
    return existing;
  }
  const created = createDepartmentAccumulator(input);
  accumulators.set(input.departmentId, created);
  return created;
}

export function parseDepartmentAttendanceSummaryQuery(url: URL) {
  const parsed = departmentAttendanceSummaryQuerySchema.safeParse({
    startDate: url.searchParams.get("startDate") ?? "",
    endDate: url.searchParams.get("endDate") ?? ""
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.flatten()
    };
  }

  const periodStart = toPeriodStartDate(parsed.data.startDate);
  const periodEnd = toPeriodEndDate(parsed.data.endDate);

  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    return {
      ok: false as const,
      error: {
        fieldErrors: {
          startDate: ["startDate and endDate must be valid YYYY-MM-DD dates"]
        }
      }
    };
  }

  if (periodStart.getTime() > periodEnd.getTime()) {
    return {
      ok: false as const,
      error: {
        fieldErrors: {
          startDate: ["startDate must be less than or equal to endDate"]
        }
      }
    };
  }

  return {
    ok: true as const,
    query: {
      periodStart,
      periodEnd
    } satisfies DepartmentAttendanceSummaryQuery
  };
}

export async function listDepartmentAttendanceSummary(input: {
  organizationId: string;
  query: DepartmentAttendanceSummaryQuery;
}): Promise<DepartmentAttendanceSummaryItem[]> {
  const dataAccess = getRuntimeDataAccess();
  const [departments, activeEmployees, attendanceRecords] = await Promise.all([
    dataAccess.departments.list({ organizationId: input.organizationId }),
    dataAccess.employees.list({ organizationId: input.organizationId, status: "ACTIVE" }),
    dataAccess.attendance.listInPeriod({
      organizationId: input.organizationId,
      periodStart: input.query.periodStart,
      periodEnd: input.query.periodEnd
    })
  ]);

  const departmentNameById = new Map(
    departments.map((department) => [department.id, department.name] as const)
  );

  const accumulators = new Map<string, DepartmentAccumulator>();

  for (const department of departments) {
    accumulators.set(
      department.id,
      createDepartmentAccumulator({
        departmentId: department.id,
        departmentName: department.name
      })
    );
  }

  const activeEmployeeById = new Map(activeEmployees.map((employee) => [employee.id, employee] as const));

  for (const employee of activeEmployees) {
    if (!employee.departmentId) {
      continue;
    }

    const accumulator = ensureDepartmentAccumulator(accumulators, {
      departmentId: employee.departmentId,
      departmentName: departmentNameById.get(employee.departmentId) ?? employee.departmentId
    });

    accumulator.employeeCount += 1;
  }

  for (const record of attendanceRecords) {
    if (record.state === "REJECTED") {
      continue;
    }

    const employee = activeEmployeeById.get(record.employeeId);
    if (!employee?.departmentId) {
      continue;
    }

    const accumulator = ensureDepartmentAccumulator(accumulators, {
      departmentId: employee.departmentId,
      departmentName: departmentNameById.get(employee.departmentId) ?? employee.departmentId
    });

    const anomalyType = record.anomalyType?.trim() ?? "";
    const absentAnomaly = anomalyType.length > 0 && isAbsentAnomaly(anomalyType);

    if (anomalyType.length > 0) {
      accumulator.anomalyCount += 1;
      if (isLateAnomaly(anomalyType)) {
        accumulator.lateCount += 1;
      }
      if (absentAnomaly) {
        accumulator.absentCount += 1;
      }
    }

    if (record.checkOutAt) {
      accumulator.totalWorkMinutes += workedMinutes(record.checkInAt, record.checkOutAt, record.breakMinutes);
    }

    if (!absentAnomaly) {
      accumulator.attendedEmployeeIds.add(employee.id);
    }
  }

  return Array.from(accumulators.values())
    .sort((left, right) => {
      const byName = left.departmentName.localeCompare(right.departmentName);
      if (byName !== 0) {
        return byName;
      }
      return left.departmentId.localeCompare(right.departmentId);
    })
    .map((department) => {
      const totalWorkHours = roundTo2(department.totalWorkMinutes * HOURS_PER_MINUTE);
      const avgWorkHoursPerEmployee =
        department.employeeCount > 0
          ? roundTo2((department.totalWorkMinutes * HOURS_PER_MINUTE) / department.employeeCount)
          : 0;
      const attendanceRate = roundTo2(
        safePercent(department.attendedEmployeeIds.size, department.employeeCount)
      );

      return {
        departmentId: department.departmentId,
        departmentName: department.departmentName,
        employeeCount: department.employeeCount,
        totalWorkHours,
        avgWorkHoursPerEmployee,
        lateCount: department.lateCount,
        absentCount: department.absentCount,
        anomalyCount: department.anomalyCount,
        attendanceRate
      } satisfies DepartmentAttendanceSummaryItem;
    });
}
