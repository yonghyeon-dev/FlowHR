import { assignEmployeeRoleSchema } from "@/features/rbac/schemas";
import { updateEmployeeRoleAssignment } from "@/features/rbac/admin-service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { requireAdminRole, toAdminActor } from "../../../roles/shared";

type RouteContext = {
  params: Promise<{ employeeId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminRole(request, "admin.employees.role.update");
  if (!auth.ok) {
    return auth.response;
  }

  const { employeeId: rawEmployeeId } = await context.params;
  const employeeId = rawEmployeeId.trim();
  if (!employeeId) {
    return fail(400, "employeeId is required");
  }

  if (auth.actor.id.trim() === employeeId) {
    return fail(400, "admin.employees.role.update.self_change_forbidden", {
      reason: "self_role_change_forbidden"
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = assignEmployeeRoleSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const employee = await updateEmployeeRoleAssignment(
      {
        actor: toAdminActor(auth.actor, auth.organizationId),
        dataAccess: getRuntimeDataAccess(),
        supabaseAdmin: getSupabaseAdmin()
      },
      {
        employeeId,
        roleName: parsed.data.role
      }
    );
    return ok(employee);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
