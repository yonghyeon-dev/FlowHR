import { previewLeavePromotionQuerySchema } from "@/features/leave/schemas";
import { previewAnnualLeavePromotion } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = previewLeavePromotionQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    asOf: url.searchParams.get("asOf") ?? undefined,
    includeUpcoming: url.searchParams.get("includeUpcoming") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await previewAnnualLeavePromotion(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        asOf: parsed.data.asOf ? new Date(parsed.data.asOf) : undefined,
        includeUpcoming: parsed.data.includeUpcoming
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
