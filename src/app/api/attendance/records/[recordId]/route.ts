import { updateAttendanceSchema } from "@/features/attendance/schemas";
import { deleteAttendanceRecord, updateAttendanceRecord } from "@/features/attendance/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ recordId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateAttendanceSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { recordId } = await context.params;
  try {
    const record = await updateAttendanceRecord(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      recordId,
      {
        checkInAt: parsed.data.checkInAt ? new Date(parsed.data.checkInAt) : undefined,
        checkOutAt: parsed.data.checkOutAt ? new Date(parsed.data.checkOutAt) : undefined,
        breakMinutes: parsed.data.breakMinutes,
        isHoliday: parsed.data.isHoliday,
        notes: parsed.data.notes,
        capture: parsed.data.capture
          ? {
              channel: parsed.data.capture.channel,
              deviceId: parsed.data.capture.deviceId,
              attestationToken: parsed.data.capture.attestationToken,
              ipAddress: parsed.data.capture.ipAddress,
              latitude: parsed.data.capture.latitude,
              longitude: parsed.data.capture.longitude,
              accuracyMeters: parsed.data.capture.accuracyMeters
            }
          : undefined
      }
    );
    return ok({ record });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { recordId } = await context.params;
  try {
    const record = await deleteAttendanceRecord(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      recordId
    );
    return ok({ record });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
