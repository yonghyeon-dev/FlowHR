import { assignScheduleRotationOptimizeSchema } from "@/features/scheduling/schemas";
import { optimizeWorkScheduleRotation } from "@/features/scheduling/service";
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

  const parsed = assignScheduleRotationOptimizeSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await optimizeWorkScheduleRotation(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        employeeId: parsed.data.employeeId,
        fromDate: parsed.data.fromDate,
        toDate: parsed.data.toDate,
        templateIds: parsed.data.templateIds,
        apply: parsed.data.apply
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
