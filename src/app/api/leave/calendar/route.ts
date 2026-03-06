import { listLeaveCalendarQuerySchema } from "@/features/leave/schemas";
import { listLeaveCalendar } from "@/features/leave/calendar-service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function normalizeOffset(value: string | null) {
  return value ? value.replace(/ /g, "+") : value;
}

export async function GET(request: Request) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "leave.calendar.unauthorized");
  }

  const url = new URL(request.url);
  const parsed = listLeaveCalendarQuerySchema.safeParse({
    from: normalizeOffset(url.searchParams.get("from")),
    to: normalizeOffset(url.searchParams.get("to")),
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    departmentId: url.searchParams.get("departmentId") ?? undefined,
    includePending: url.searchParams.get("includePending") ?? undefined,
    overlapWarningThreshold: url.searchParams.get("overlapWarningThreshold") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await listLeaveCalendar(
      {
        actor,
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        periodStart: new Date(parsed.data.from),
        periodEnd: new Date(parsed.data.to),
        departmentId: parsed.data.departmentId,
        includePending: parsed.data.includePending,
        overlapWarningThreshold: parsed.data.overlapWarningThreshold
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
