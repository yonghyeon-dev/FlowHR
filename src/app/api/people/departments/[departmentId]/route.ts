import { updateDepartmentSchema } from "@/features/people/schemas";
import { deleteDepartment, getDepartment, updateDepartment } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ departmentId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { departmentId } = await context.params;

  try {
    const department = await getDepartment(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      { departmentId }
    );
    return ok({ department });
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

  const parsed = updateDepartmentSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { departmentId } = await context.params;
  try {
    const department = await updateDepartment(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        departmentId,
        code: parsed.data.code,
        name: parsed.data.name,
        active: parsed.data.active,
        parentId: parsed.data.parentId,
        managerId: parsed.data.managerId
      }
    );
    return ok({ department });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { departmentId } = await context.params;

  try {
    const department = await deleteDepartment(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      { departmentId }
    );
    return ok({ department });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
