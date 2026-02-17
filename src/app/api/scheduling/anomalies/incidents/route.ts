import { listScheduleAnomalyIncidentQuerySchema } from "@/features/scheduling/schemas";
import { listScheduleAnomalyIncidents } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listScheduleAnomalyIncidentQuerySchema.safeParse({
    state: url.searchParams.get("state") ?? undefined,
    assigneeId: url.searchParams.get("assigneeId") ?? undefined,
    topN: url.searchParams.get("topN") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await listScheduleAnomalyIncidents(
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
