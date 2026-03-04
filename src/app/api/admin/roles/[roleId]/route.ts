import { updateRole } from "@/features/rbac/admin-service";
import { updateRoleSchema } from "@/features/rbac/schemas";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { fail, ok } from "@/lib/http";

import { requireAdminRole, toAdminActor } from "../shared";

type RouteContext = {
  params: Promise<{ roleId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminRole(request, "admin.roles.update");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateRoleSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { roleId } = await context.params;
  try {
    const role = await updateRole(
      {
        actor: toAdminActor(auth.actor, auth.organizationId),
        dataAccess: getRuntimeDataAccess()
      },
      {
        roleId,
        name: parsed.data.name,
        description: parsed.data.description,
        permissions: parsed.data.permissions
      }
    );
    return ok({ role });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
