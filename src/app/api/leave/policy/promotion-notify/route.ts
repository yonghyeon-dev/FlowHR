import { notifyLeavePromotionSchema } from "@/features/leave/schemas";
import { dispatchAnnualLeavePromotionNotice } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = notifyLeavePromotionSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await dispatchAnnualLeavePromotionNotice(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        asOf: parsed.data.asOf ? new Date(parsed.data.asOf) : undefined,
        includeUpcoming: parsed.data.includeUpcoming,
        dryRun: parsed.data.dryRun,
        deliveryChannel: parsed.data.deliveryChannel,
        emailTemplateId: parsed.data.emailTemplateId
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
