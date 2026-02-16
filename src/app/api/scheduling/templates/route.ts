import { createWorkScheduleTemplateSchema } from "@/features/scheduling/schemas";
import { createWorkScheduleTemplate, listWorkScheduleTemplates } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const templates = await listWorkScheduleTemplates({
      actor: await readActor(request),
      dataAccess: getRuntimeDataAccess()
    });
    return ok({ templates });
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

  const parsed = createWorkScheduleTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const template = await createWorkScheduleTemplate(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        name: parsed.data.name,
        startMinute: parsed.data.startMinute,
        endMinute: parsed.data.endMinute,
        breakMinutes: parsed.data.breakMinutes,
        isHoliday: parsed.data.isHoliday,
        weekdays: parsed.data.weekdays,
        notes: parsed.data.notes
      }
    );
    return ok({ template }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

