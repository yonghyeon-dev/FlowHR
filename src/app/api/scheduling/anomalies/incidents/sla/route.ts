import { listScheduleAnomalyIncidentSlaQuerySchema } from "@/features/scheduling/schemas";
import { listScheduleAnomalyIncidentSla } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listScheduleAnomalyIncidentSlaQuerySchema.safeParse({
    state: url.searchParams.get("state") ?? undefined,
    assigneeId: url.searchParams.get("assigneeId") ?? undefined,
    topN: url.searchParams.get("topN") ?? undefined,
    includeResolved: url.searchParams.get("includeResolved") ?? undefined,
    slaTargetMinutes: url.searchParams.get("slaTargetMinutes") ?? undefined,
    warningMinutes: url.searchParams.get("warningMinutes") ?? undefined,
    asOf: url.searchParams.get("asOf") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await listScheduleAnomalyIncidentSla(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        ...parsed.data,
        asOf: parsed.data.asOf ? new Date(parsed.data.asOf) : undefined
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
