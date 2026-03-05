import { updateEmployeeStatusSchema } from "@/features/people/schemas";
import { transitionEmployeeStatus } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "missing or invalid actor context");
  }
  if (actor.role !== "admin") {
    return fail(403, "admin role required");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateEmployeeStatusSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { id } = await context.params;

  try {
    const employee = await transitionEmployeeStatus(
      {
        actor,
        dataAccess: getRuntimeDataAccess()
      },
      {
        employeeId: id,
        status: parsed.data.status,
        reason: parsed.data.reason,
        effectiveDate: parsed.data.effectiveDate
      }
    );
    return ok({ employee });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
