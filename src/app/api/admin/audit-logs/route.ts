import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

import { listAuditLogs, parseAuditLogListQuery } from "./shared";

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, "admin.audit_logs.unauthorized")
    };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "admin.audit_logs.forbidden", { reason: "admin_required" })
    };
  }

  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, "admin.audit_logs.organization_id_required")
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

  const result = await listAuditLogs({
    organizationId: auth.organizationId,
    query: parsed.query
  });

  return ok({
    items: result.items,
    total: result.total
  });
}
