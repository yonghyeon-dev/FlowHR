import { listAttendanceAggregatesQuerySchema } from "@/features/attendance/schemas";
import { listAttendanceAggregates } from "@/features/attendance/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // `+09:00` in query params is commonly decoded as a space. Normalize to preserve ISO offsets.
  const normalizeOffset = (value: string | null) => (value ? value.replace(/ /g, "+") : value);
  const parsed = listAttendanceAggregatesQuerySchema.safeParse({
    from: normalizeOffset(url.searchParams.get("from")),
    to: normalizeOffset(url.searchParams.get("to")),
    employeeId: url.searchParams.get("employeeId") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const aggregates = await listAttendanceAggregates(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        periodStart: new Date(parsed.data.from),
        periodEnd: new Date(parsed.data.to),
        employeeId: parsed.data.employeeId
      }
    );
    return ok({ aggregates });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

