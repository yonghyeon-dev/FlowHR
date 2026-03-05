import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../../shared";
import {
  listDepartmentAttendanceSummary,
  parseDepartmentAttendanceSummaryQuery
} from "./shared";

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.reports.attendance.department_summary");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseDepartmentAttendanceSummaryQuery(new URL(request.url));
  if (!parsed.ok) {
    return fail(400, "invalid query", parsed.error);
  }

  const items = await listDepartmentAttendanceSummary({
    organizationId: auth.organizationId,
    query: parsed.query
  });

  return ok(items);
}
