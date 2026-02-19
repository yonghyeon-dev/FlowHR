import { listApprovalExecutionsQuerySchema } from "@/features/approval/schemas";
import { listApprovalExecutions } from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

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
  const parsed = listApprovalExecutionsQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    domain: url.searchParams.get("domain") ?? undefined,
    targetEntityType: url.searchParams.get("targetEntityType") ?? undefined,
    targetEntityId: url.searchParams.get("targetEntityId") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    limit: parseOptionalLimit(url.searchParams.get("limit"))
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const executions = await listApprovalExecutions(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        domain: parsed.data.domain,
        targetEntityType: parsed.data.targetEntityType,
        targetEntityId: parsed.data.targetEntityId,
        state: parsed.data.state,
        limit: parsed.data.limit
      }
    );
    return ok({ executions });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
