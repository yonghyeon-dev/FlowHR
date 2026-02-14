import { updateEmployeeSchema } from "@/features/people/schemas";
import { getEmployee, updateEmployee } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { employeeId } = await context.params;

  try {
    const employee = await getEmployee(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      { employeeId }
    );
    return ok({ employee });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateEmployeeSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { employeeId } = await context.params;
  try {
    const employee = await updateEmployee(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        employeeId,
        organizationId: parsed.data.organizationId,
        name: parsed.data.name,
        email: parsed.data.email,
        active: parsed.data.active
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

