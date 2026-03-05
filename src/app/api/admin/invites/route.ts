import { listAuthInvites } from "@/features/auth/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { requireAdminRole, toAdminActor } from "../roles/shared";

export async function GET(request: Request) {
  const auth = await requireAdminRole(request, "admin.invites.list");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const invites = await listAuthInvites(
      {
        actor: toAdminActor(auth.actor, auth.organizationId),
        dataAccess: getRuntimeDataAccess(),
        supabaseAdmin: getSupabaseAdmin()
      },
      {
        organizationId: auth.organizationId,
        role: "employee",
        limit: 500
      }
    );

    return ok(
      invites.map((invite) => ({
        id: invite.userId,
        email: invite.email,
        name: invite.name,
        status: "pending" as const,
        invitedAt: invite.createdAt.toISOString()
      }))
    );
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
