import { readLeavePolicyQuerySchema, upsertLeavePolicySchema } from "@/features/leave/schemas";
import { readLeavePolicy, upsertLeavePolicy } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = readLeavePolicyQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await readLeavePolicy(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      parsed.data
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = upsertLeavePolicySchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await upsertLeavePolicy(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      parsed.data
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

