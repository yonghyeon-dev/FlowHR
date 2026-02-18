import { updateApprovalDelegationSchema } from "@/features/approval/schemas";
import { updateApprovalDelegation } from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ delegationId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { delegationId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateApprovalDelegationSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const delegation = await updateApprovalDelegation(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      delegationId,
      {
        delegateActorId: parsed.data.delegateActorId,
        startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
        reason: parsed.data.reason,
        active: parsed.data.active
      }
    );
    return ok({ delegation });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
