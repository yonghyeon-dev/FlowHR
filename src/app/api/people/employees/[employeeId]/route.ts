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
  const actor = await readActor(request);
  const isEmployeeSelf = actor?.role === "employee" && actor.id === employeeId;
  if (actor?.role === "employee") {
    if (!isEmployeeSelf) {
      return fail(403, "employees can only update their own profile");
    }
    const hasRestrictedField =
      parsed.data.organizationId !== undefined ||
      parsed.data.departmentId !== undefined ||
      parsed.data.positionId !== undefined ||
      parsed.data.active !== undefined;
    if (hasRestrictedField) {
      return fail(403, "employees can only update name, email, phone, and address");
    }
  }

  try {
    const employee = await updateEmployee(
      {
        actor,
        dataAccess: getRuntimeDataAccess()
      },
      {
        employeeId,
        organizationId: parsed.data.organizationId,
        departmentId: parsed.data.departmentId,
        positionId: parsed.data.positionId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        address: parsed.data.address,
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

