import { listApprovalStageHistoryQuerySchema } from "@/features/approval/schemas";
import { listApprovalStageHistory } from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function parseOptionalBoolean(value: string | null): boolean | string | undefined {
  if (value === null) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  return value;
}

function parseOptionalLimit(value: string | null): number | string | undefined {
  if (value === null || value.trim().length === 0) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return value;
  }
  return parsed;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listApprovalStageHistoryQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    domain: url.searchParams.get("domain") ?? undefined,
    targetEntityType: url.searchParams.get("targetEntityType") ?? undefined,
    targetEntityId: url.searchParams.get("targetEntityId") ?? undefined,
    allowed: parseOptionalBoolean(url.searchParams.get("allowed")),
    resolution: url.searchParams.get("resolution") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    limit: parseOptionalLimit(url.searchParams.get("limit"))
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const history = await listApprovalStageHistory(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        domain: parsed.data.domain,
        targetEntityType: parsed.data.targetEntityType,
        targetEntityId: parsed.data.targetEntityId,
        allowed: parsed.data.allowed,
        resolution: parsed.data.resolution,
        from: parsed.data.from ? new Date(parsed.data.from) : undefined,
        to: parsed.data.to ? new Date(parsed.data.to) : undefined,
        limit: parsed.data.limit
      }
    );
    return ok({ history });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
