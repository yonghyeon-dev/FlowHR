import { workedMinutes } from "@/lib/payroll-rules";
import {
  formatDateOnly,
  formatDateTime,
  formatHoursFromMinutes,
  requireAdmin,
  resolveEmployeeName,
  toCsv,
  toExportFileName
} from "../../../reports/shared";
import { fail } from "@/lib/http";

import { listAttendanceAnomalies, parseAttendanceAnomaliesQuery } from "../shared";

const CSV_COLUMNS = [
  "employeeName",
  "date",
  "clockIn",
  "clockOut",
  "anomalyType",
  "workHours"
] as const;

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.attendance.anomalies.export");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseAttendanceAnomaliesQuery(new URL(request.url));
  if (!parsed.ok) {
    return fail(400, "invalid query", parsed.error);
  }

  const paginationProvided = parsed.query.limit !== undefined || parsed.query.offset !== undefined;
  const result = await listAttendanceAnomalies({
    organizationId: auth.organizationId,
    query: parsed.query,
    pagination: paginationProvided
      ? {
          limit: parsed.query.limit ?? Number.MAX_SAFE_INTEGER,
          offset: parsed.query.offset ?? 0
        }
      : undefined
  });

  const rows = result.items.map((record) => {
    const employee = result.employeeById.get(record.employeeId);
    const totalWorkedMinutes = record.checkOutAt
      ? workedMinutes(record.checkInAt, record.checkOutAt, record.breakMinutes)
      : 0;

    return [
      resolveEmployeeName(employee ?? { id: record.employeeId, name: null }),
      formatDateOnly(record.checkInAt),
      formatDateTime(record.checkInAt),
      formatDateTime(record.checkOutAt),
      record.anomalyType?.trim() ?? "",
      formatHoursFromMinutes(totalWorkedMinutes)
    ];
  });

  const csv = toCsv([...CSV_COLUMNS], rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${toExportFileName("attendance-anomalies-report")}"`
    }
  });
}
