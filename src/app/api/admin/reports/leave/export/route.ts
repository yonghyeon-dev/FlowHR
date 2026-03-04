import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail } from "@/lib/http";

import {
  formatDateOnly,
  parseReportRangeQuery,
  requireAdmin,
  resolveEmployeeName,
  toCsv,
  toExportFileName
} from "../../shared";

const CSV_COLUMNS = [
  "employeeName",
  "leaveType",
  "startDate",
  "endDate",
  "days",
  "status",
  "reason"
] as const;

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.reports.leave.export");
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

  const leaveRequests = await dataAccess.leave.listInPeriod({
    periodStart: parsed.query.from,
    periodEnd: parsed.query.to,
    organizationId: auth.organizationId
  });

  const rows = leaveRequests
    .filter((requestItem) => employeeById.has(requestItem.employeeId))
    .map((requestItem) => {
      const employee = employeeById.get(requestItem.employeeId)!;
      return [
        resolveEmployeeName(employee),
        requestItem.leaveType,
        formatDateOnly(requestItem.startDate),
        formatDateOnly(requestItem.endDate),
        requestItem.days,
        requestItem.state,
        requestItem.reason ?? ""
      ];
    });

  const csv = toCsv([...CSV_COLUMNS], rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${toExportFileName("leave-report")}"`
    }
  });
}

