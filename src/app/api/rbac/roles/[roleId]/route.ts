import { upsertRoleSchema } from "@/features/rbac/schemas";
import { getRole, upsertRole } from "@/features/rbac/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ roleId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { roleId } = await context.params;

  try {
    const role = await getRole(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      { roleId }
    );
    return ok({ role });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function PUT(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = upsertRoleSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { roleId } = await context.params;
  try {
    const result = await upsertRole(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        roleId,
        name: parsed.data.name,
        description: parsed.data.description,
        permissions: parsed.data.permissions
      }
    );
    return ok({ role: result.role }, result.created ? 201 : 200);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

