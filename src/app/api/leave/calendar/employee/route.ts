import { listEmployeeDepartmentLeaveCalendarQuerySchema } from "@/features/leave/schemas";
import { listEmployeeDepartmentLeaveCalendar } from "@/features/leave/employee-calendar-service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function normalizeOffset(value: string | null) {
  return value ? value.replace(/ /g, "+") : value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listEmployeeDepartmentLeaveCalendarQuerySchema.safeParse({
    from: normalizeOffset(url.searchParams.get("from")),
    to: normalizeOffset(url.searchParams.get("to"))
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await listEmployeeDepartmentLeaveCalendar(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        periodStart: new Date(parsed.data.from),
        periodEnd: new Date(parsed.data.to)
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
