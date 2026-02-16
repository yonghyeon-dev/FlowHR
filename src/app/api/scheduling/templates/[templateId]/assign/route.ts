import { assignScheduleTemplateSchema } from "@/features/scheduling/schemas";
import { assignWorkScheduleFromTemplate } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ templateId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = assignScheduleTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { templateId } = await context.params;
  try {
    const schedule = await assignWorkScheduleFromTemplate(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        templateId,
        employeeId: parsed.data.employeeId,
        date: parsed.data.date
      }
    );
    return ok({ schedule }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

