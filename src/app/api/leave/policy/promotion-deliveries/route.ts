import { listLeavePromotionDeliveriesQuerySchema } from "@/features/leave/schemas";
import { listLeavePromotionDeliveries } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function parseOptionalInteger(value: string | null): number | string | undefined {
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
  const parsed = listLeavePromotionDeliveriesQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    channel: url.searchParams.get("channel") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    retryOfDeliveryId: url.searchParams.get("retryOfDeliveryId") ?? undefined,
    limit: parseOptionalInteger(url.searchParams.get("limit"))
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await listLeavePromotionDeliveries(
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
