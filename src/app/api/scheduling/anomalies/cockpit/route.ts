import { listScheduleAnomalyCockpitQuerySchema } from "@/features/scheduling/schemas";
import { listScheduleAttendanceAnomalyCockpit } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const normalizeOffset = (value: string | null) => (value ? value.replace(/ /g, "+") : value);
  const parsed = listScheduleAnomalyCockpitQuerySchema.safeParse({
    from: normalizeOffset(url.searchParams.get("from")),
    to: normalizeOffset(url.searchParams.get("to")),
    lateThresholdMinutes: url.searchParams.get("lateThresholdMinutes") ?? undefined,
    topN: url.searchParams.get("topN") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const report = await listScheduleAttendanceAnomalyCockpit(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        periodStart: new Date(parsed.data.from),
        periodEnd: new Date(parsed.data.to),
        lateThresholdMinutes: parsed.data.lateThresholdMinutes,
        topN: parsed.data.topN
      }
    );
    return ok({ report });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
