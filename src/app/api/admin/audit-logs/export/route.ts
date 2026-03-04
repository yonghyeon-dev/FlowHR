import { readActor } from "@/lib/actor";
import { fail } from "@/lib/http";

import { listAuditLogs, parseAuditLogListQuery, toAuditLogsCsv } from "../shared";

function toExportFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `audit-logs-${stamp}.csv`;
}

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, "admin.audit_logs.export.unauthorized")
    };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "admin.audit_logs.export.forbidden", { reason: "admin_required" })
    };
  }

  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, "admin.audit_logs.export.organization_id_required")
    };
  }

  return {
    ok: true as const,
    organizationId
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseAuditLogListQuery(new URL(request.url));
  if (!parsed.ok) {
    return fail(400, "invalid query", parsed.error);
  }

  const { items } = await listAuditLogs({
    organizationId: auth.organizationId,
    query: parsed.query
  });
  const csv = toAuditLogsCsv(items);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${toExportFileName()}"`
    }
  });
}
