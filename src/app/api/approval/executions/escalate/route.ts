import { triggerApprovalExecutionEscalationSchema } from "@/features/approval/schemas";
import { triggerApprovalExecutionEscalation } from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function POST(request: Request) {
  let payload: unknown = {};
  const contentType = request.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      payload = await request.json();
    } catch {
      return fail(400, "invalid JSON body");
    }
  }

  const parsed = triggerApprovalExecutionEscalationSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await triggerApprovalExecutionEscalation(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        domain: parsed.data.domain,
        stalledHoursMin: parsed.data.stalledHoursMin,
        limit: parsed.data.limit,
        asOf: parsed.data.asOf ? new Date(parsed.data.asOf) : undefined,
        dryRun: parsed.data.dryRun,
        notificationChannel: parsed.data.notificationChannel
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
