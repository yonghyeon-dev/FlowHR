import { listRoleAssignments } from "@/features/rbac/admin-service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { requireAdminRole, toAdminActor } from "../shared";

export async function GET(request: Request) {
  const auth = await requireAdminRole(request, "admin.roles.assignments.list");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const assignments = await listRoleAssignments({
      actor: toAdminActor(auth.actor, auth.organizationId),
      dataAccess: getRuntimeDataAccess(),
      supabaseAdmin: getSupabaseAdmin()
    });
    return ok({ assignments });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
