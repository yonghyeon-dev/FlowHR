import { derivePayableMinutes, workedMinutes } from "@/lib/payroll-rules";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail } from "@/lib/http";

import {
  formatDateOnly,
  formatDateTime,
  formatHoursFromMinutes,
  parseReportRangeQuery,
  requireAdmin,
  resolveEmployeeName,
  toCsv,
  toExportFileName
} from "../../shared";

const CSV_COLUMNS = [
  "employeeName",
  "date",
  "clockIn",
  "clockOut",
  "workHours",
  "overtime",
  "anomalyType"
] as const;

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.reports.attendance.export");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseReportRangeQuery(new URL(request.url), { includeDepartmentId: true });
  if (!parsed.ok) {
    return fail(400, "invalid query", parsed.error);
  }

  const dataAccess = getRuntimeDataAccess();
  const employees = await dataAccess.employees.list({ organizationId: auth.organizationId });
  const employeeById = new Map(
    employees
      .filter((employee) =>
        parsed.query.departmentId ? employee.departmentId === parsed.query.departmentId : true
      )
      .map((employee) => [employee.id, employee] as const)
  );

  const attendanceRecords = await dataAccess.attendance.listInPeriod({
    periodStart: parsed.query.from,
    periodEnd: parsed.query.to,
    organizationId: auth.organizationId
  });

  const rows = attendanceRecords
    .filter((record) => employeeById.has(record.employeeId))
    .map((record) => {
      const employee = employeeById.get(record.employeeId)!;
      const totalWorkedMinutes = record.checkOutAt
        ? workedMinutes(record.checkInAt, record.checkOutAt, record.breakMinutes)
        : 0;
      const payable = record.checkOutAt
        ? derivePayableMinutes(record.checkInAt, record.checkOutAt, record.breakMinutes, record.isHoliday)
        : { regular: 0, overtime: 0, night: 0, holiday: 0 };
      return [
        resolveEmployeeName(employee),
        formatDateOnly(record.checkInAt),
        formatDateTime(record.checkInAt),
        formatDateTime(record.checkOutAt),
        formatHoursFromMinutes(totalWorkedMinutes),
        formatHoursFromMinutes(payable.overtime),
        record.anomalyType ?? ""
      ];
    });

  const csv = toCsv([...CSV_COLUMNS], rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${toExportFileName("attendance-report")}"`
    }
  });
}

