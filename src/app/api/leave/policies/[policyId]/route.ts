import { leavePolicyPathSchema, readLeavePolicyQuerySchema } from "@/features/leave/schemas";
import { deleteLeavePolicy, readLeavePolicy } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ policyId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { policyId } = await context.params;
  const pathParsed = leavePolicyPathSchema.safeParse({ policyId });
  if (!pathParsed.success) {
    return fail(400, "invalid path", pathParsed.error.flatten());
  }

  const url = new URL(request.url);
  const queryParsed = readLeavePolicyQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined
  });
  if (!queryParsed.success) {
    return fail(400, "invalid query", queryParsed.error.flatten());
  }

  try {
    const result = await readLeavePolicy(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: queryParsed.data.organizationId,
        policyId: pathParsed.data.policyId
      }
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { policyId } = await context.params;
  const pathParsed = leavePolicyPathSchema.safeParse({ policyId });
  if (!pathParsed.success) {
    return fail(400, "invalid path", pathParsed.error.flatten());
  }

  const url = new URL(request.url);
  const queryParsed = readLeavePolicyQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined
  });
  if (!queryParsed.success) {
    return fail(400, "invalid query", queryParsed.error.flatten());
  }

  try {
    const result = await deleteLeavePolicy(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        policyId: pathParsed.data.policyId,
        organizationId: queryParsed.data.organizationId
      }
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
