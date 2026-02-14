import { createAttendanceSchema, listAttendanceQuerySchema } from "@/features/attendance/schemas";
import { createAttendanceRecord, listAttendanceRecords } from "@/features/attendance/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // `+09:00` in query params is commonly decoded as a space. Normalize to preserve ISO offsets.
  const normalizeOffset = (value: string | null) => (value ? value.replace(/ /g, "+") : value);
  const parsed = listAttendanceQuerySchema.safeParse({
    from: normalizeOffset(url.searchParams.get("from")),
    to: normalizeOffset(url.searchParams.get("to")),
    employeeId: url.searchParams.get("employeeId") ?? undefined,
    state: url.searchParams.get("state") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const records = await listAttendanceRecords(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        periodStart: new Date(parsed.data.from),
        periodEnd: new Date(parsed.data.to),
        employeeId: parsed.data.employeeId,
        state: parsed.data.state
      }
    );
    return ok({ records });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createAttendanceSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const record = await createAttendanceRecord(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        employeeId: parsed.data.employeeId,
        checkInAt: new Date(parsed.data.checkInAt),
        checkOutAt: parsed.data.checkOutAt ? new Date(parsed.data.checkOutAt) : null,
        breakMinutes: parsed.data.breakMinutes,
        isHoliday: parsed.data.isHoliday,
        notes: parsed.data.notes
      }
    );
    return ok({ record }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
