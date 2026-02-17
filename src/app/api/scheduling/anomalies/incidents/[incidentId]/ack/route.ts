import { acknowledgeScheduleAnomalyIncidentSchema } from "@/features/scheduling/schemas";
import { updateScheduleAnomalyIncidentLifecycle } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ incidentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let payload: unknown = {};
  const contentType = request.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      payload = await request.json();
    } catch {
      return fail(400, "invalid JSON body");
    }
  }

  const parsed = acknowledgeScheduleAnomalyIncidentSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { incidentId } = await context.params;
  try {
    const incident = await updateScheduleAnomalyIncidentLifecycle(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        incidentId,
        action: "ACKNOWLEDGE",
        note: parsed.data.note
      }
    );
    return ok({ incident });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
