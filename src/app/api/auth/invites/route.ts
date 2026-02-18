import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const allowedInviteRoles = ["admin", "manager", "employee", "payroll_operator"] as const;

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(allowedInviteRoles).optional(),
  organizationId: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  redirectTo: z.string().url().optional()
});

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "missing or invalid actor context");
  }
  if (actor.role !== "admin" && actor.role !== "system") {
    return fail(403, "insufficient permissions");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const actorOrgId = (actor.organizationId ?? "").trim();
  const payloadOrgId = (parsed.data.organizationId ?? "").trim();
  if (actorOrgId && payloadOrgId && actorOrgId !== payloadOrgId) {
    return fail(403, "organization mismatch");
  }
  const organizationId = actorOrgId || payloadOrgId;
  if (!organizationId) {
    return fail(400, "organizationId is required");
  }

  const role = parsed.data.role ?? "employee";
  const email = parsed.data.email.trim().toLowerCase();
  const actorId = parsed.data.actorId?.trim();
  const redirectTo = parsed.data.redirectTo?.trim() || `${new URL(request.url).origin}/login`;

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo }
  });
  if (error || !data) {
    return fail(502, "supabase invite link generation failed", { message: error?.message ?? "unknown error" });
  }

  const existingAppMetadata =
    data.user && typeof data.user === "object" && "app_metadata" in data.user
      ? ((data.user as { app_metadata?: unknown }).app_metadata ?? {})
      : {};

  const nextAppMetadata: Record<string, unknown> = {
    ...(typeof existingAppMetadata === "object" && existingAppMetadata ? existingAppMetadata : {}),
    role,
    organization_id: organizationId
  };

  if (actorId && actorId.length > 0) {
    nextAppMetadata.actor_id = actorId;
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
    app_metadata: nextAppMetadata
  });
  if (updateError) {
    return fail(502, "supabase user metadata update failed", { message: updateError.message });
  }

  // Do not persist action_link; treat as a secret.
  await getRuntimeDataAccess().audit.append({
    action: "auth.invite.generated",
    entityType: "AuthInvite",
    entityId: data.user.id,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      email,
      role,
      actorId: actorId ?? null,
      redirectTo
    }
  });

  return ok(
    {
      invite: {
        userId: data.user.id,
        email,
        role,
        organizationId,
        actorId: actorId ?? null,
        redirectTo,
        actionLink: data.properties.action_link
      }
    },
    201
  );
}
