import { listScheduleRotationFairnessSchema } from "@/features/scheduling/schemas";
import { applyWorkScheduleRotationFairness } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = listScheduleRotationFairnessSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await applyWorkScheduleRotationFairness(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        fromDate: parsed.data.fromDate,
        toDate: parsed.data.toDate,
        templateIds: parsed.data.templateIds,
        employeeIds: parsed.data.employeeIds
      }
    );
    return ok({ result }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
