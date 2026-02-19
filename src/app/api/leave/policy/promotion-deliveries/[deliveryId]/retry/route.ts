import { leavePromotionDeliveryPathSchema, retryLeavePromotionDeliverySchema } from "@/features/leave/schemas";
import { retryLeavePromotionDelivery } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ deliveryId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsedBody = retryLeavePromotionDeliverySchema.safeParse(payload);
  if (!parsedBody.success) {
    return fail(400, "invalid payload", parsedBody.error.flatten());
  }

  const parsedPath = leavePromotionDeliveryPathSchema.safeParse(await context.params);
  if (!parsedPath.success) {
    return fail(400, "invalid path", parsedPath.error.flatten());
  }

  try {
    const result = await retryLeavePromotionDelivery(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        deliveryId: parsedPath.data.deliveryId,
        organizationId: parsedBody.data.organizationId,
        dryRun: parsedBody.data.dryRun,
        emailTemplateId: parsedBody.data.emailTemplateId,
        recipientEmployeeIds: parsedBody.data.recipientEmployeeIds
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
