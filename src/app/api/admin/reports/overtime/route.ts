import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../shared";
import { listOvertimeReport, parseOvertimeReportQuery } from "./shared";

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.reports.overtime");
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

  return ok({
    items: result.items,
    total: result.total,
    period: result.period
  });
}

