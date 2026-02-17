import { getScheduleAnomalyIncident } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ incidentId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { incidentId } = await context.params;
  try {
    const incident = await getScheduleAnomalyIncident(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      incidentId
    );
    return ok({ incident });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
