import { createRoleSchema } from "@/features/rbac/schemas";
import { createRole } from "@/features/rbac/admin-service";
import { listRoles } from "@/features/rbac/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { fail, ok } from "@/lib/http";

import { requireAdminRole, toAdminActor } from "./shared";

export async function GET(request: Request) {
  const auth = await requireAdminRole(request, "admin.roles.list");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const roles = await listRoles({
      actor: toAdminActor(auth.actor, auth.organizationId),
      dataAccess: getRuntimeDataAccess()
    });
    return ok({ roles });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminRole(request, "admin.roles.create");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createRoleSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const role = await createRole(
      {
        actor: toAdminActor(auth.actor, auth.organizationId),
        dataAccess: getRuntimeDataAccess()
      },
      {
        name: parsed.data.name,
        description: parsed.data.description,
        permissions: parsed.data.permissions
      }
    );
    return ok({ role }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
