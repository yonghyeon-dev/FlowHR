import { fail } from "@/lib/http";

import { requireAdmin, toCsv, toExportFileName } from "../../shared";
import { listOvertimeReport, parseOvertimeReportQuery } from "../shared";

const CSV_COLUMNS = [
  "employeeId",
  "employeeName",
  "departmentName",
  "regularHours",
  "overtimeHours",
  "totalHours",
  "weeklyAverage",
  "exceededWeeks"
] as const;

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.reports.overtime.export");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseOvertimeReportQuery(new URL(request.url));
  if (!parsed.ok) {
    return fail(400, "invalid query", parsed.error);
  }

  const result = await listOvertimeReport({
    organizationId: auth.organizationId,
    query: parsed.query
  });

  const rows = result.items.map((item) => [
    item.employeeId,
    item.employeeName,
    item.departmentName,
    item.regularHours.toFixed(2),
    item.overtimeHours.toFixed(2),
    item.totalHours.toFixed(2),
    item.weeklyAverage.toFixed(2),
    item.exceededWeeks
  ]);

  const csv = toCsv([...CSV_COLUMNS], rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${toExportFileName("overtime-report")}"`
    }
  });
}
