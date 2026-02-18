import {
  createApprovalDelegationSchema,
  listApprovalDelegationsQuerySchema
} from "@/features/approval/schemas";
import { createApprovalDelegation, listApprovalDelegations } from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function parseOptionalBoolean(value: string | null): boolean | undefined {
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
  return undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listApprovalDelegationsQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    domain: url.searchParams.get("domain") ?? undefined,
    active: parseOptionalBoolean(url.searchParams.get("active")),
    delegateActorId: url.searchParams.get("delegateActorId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const delegations = await listApprovalDelegations(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      parsed.data
    );
    return ok({ delegations });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createApprovalDelegationSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const delegation = await createApprovalDelegation(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        domain: parsed.data.domain,
        delegatorRole: parsed.data.delegatorRole,
        delegateActorId: parsed.data.delegateActorId,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        reason: parsed.data.reason,
        active: parsed.data.active
      }
    );
    return ok({ delegation }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
