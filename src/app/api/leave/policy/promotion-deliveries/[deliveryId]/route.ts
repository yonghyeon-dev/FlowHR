import {
  leavePromotionDeliveryPathSchema,
  readLeavePromotionDeliveryQuerySchema
} from "@/features/leave/schemas";
import { readLeavePromotionDelivery } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ deliveryId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const url = new URL(request.url);
  const parsedQuery = readLeavePromotionDeliveryQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined
  });
  if (!parsedQuery.success) {
    return fail(400, "invalid query", parsedQuery.error.flatten());
  }

  const parsedPath = leavePromotionDeliveryPathSchema.safeParse(await context.params);
  if (!parsedPath.success) {
    return fail(400, "invalid path", parsedPath.error.flatten());
  }

  try {
    const result = await readLeavePromotionDelivery(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        deliveryId: parsedPath.data.deliveryId,
        organizationId: parsedQuery.data.organizationId
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
