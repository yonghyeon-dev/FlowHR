import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../../reports/shared";
import { listAttendanceAnomalies, parseAttendanceAnomaliesQuery } from "./shared";

const DEFAULT_LIMIT = 50;

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.attendance.anomalies.list");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseAttendanceAnomaliesQuery(new URL(request.url));
  if (!parsed.ok) {
    return fail(400, "invalid query", parsed.error);
  }

  const result = await listAttendanceAnomalies({
    organizationId: auth.organizationId,
    query: parsed.query,
    pagination: {
      limit: parsed.query.limit ?? DEFAULT_LIMIT,
      offset: parsed.query.offset ?? 0
    }
  });

  return ok({
    items: result.items,
    total: result.total,
    summary: result.summary
  });
}
