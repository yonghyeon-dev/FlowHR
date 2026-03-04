import { assignRoleToEmployee } from "@/features/rbac/admin-service";
import { assignRoleSchema } from "@/features/rbac/schemas";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { requireAdminRole, toAdminActor } from "../shared";

export async function POST(request: Request) {
  const auth = await requireAdminRole(request, "admin.roles.assign");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = assignRoleSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const assignment = await assignRoleToEmployee(
      {
        actor: toAdminActor(auth.actor, auth.organizationId),
        dataAccess: getRuntimeDataAccess(),
        supabaseAdmin: getSupabaseAdmin()
      },
      {
        employeeId: parsed.data.employeeId,
        roleName: parsed.data.roleName
      }
    );

    return ok({ assignment });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
