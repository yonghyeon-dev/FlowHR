import { updateWorkScheduleSchema } from "@/features/scheduling/schemas";
import { deleteWorkSchedule, updateWorkSchedule } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ scheduleId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateWorkScheduleSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { scheduleId } = await context.params;
  try {
    const schedule = await updateWorkSchedule(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      scheduleId,
      {
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
        breakMinutes: parsed.data.breakMinutes,
        isHoliday: parsed.data.isHoliday,
        notes: parsed.data.notes
      }
    );
    return ok({ schedule });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { scheduleId } = await context.params;
  try {
    const schedule = await deleteWorkSchedule(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      scheduleId
    );
    return ok({ schedule });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

