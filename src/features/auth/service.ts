import type { Actor } from "@/lib/actor";
import type { DataAccess } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

export const inviteRoles = ["admin", "manager", "employee", "payroll_operator"] as const;
export type InviteRole = (typeof inviteRoles)[number];

export const inviteDeliveryModes = ["link", "email"] as const;
export type InviteDeliveryMode = (typeof inviteDeliveryModes)[number];

type SupabaseError = { message?: string };

type SupabaseAuthUser = {
  id: string;
  app_metadata?: unknown;
};

type GenerateLinkResponse = {
  data?:
    | {
        user?: SupabaseAuthUser | null;
        properties?:
          | {
              action_link?: string;
            }
          | null;
      }
    | null;
  error?: SupabaseError | null;
};

type InviteByEmailResponse = {
  data?:
    | {
        user?: SupabaseAuthUser | null;
      }
    | null;
  error?: SupabaseError | null;
};

type UpdateUserResponse = {
  error?: SupabaseError | null;
};

export type SupabaseAdminAuthClient = {
  auth: {
    admin: {
      generateLink(input: {
        type: "invite";
        email: string;
        options?: {
          redirectTo?: string;
        };
      }): Promise<GenerateLinkResponse>;
      inviteUserByEmail(
        email: string,
        options?: {
          redirectTo?: string;
        }
      ): Promise<InviteByEmailResponse>;
      updateUserById(
        userId: string,
        attributes: {
          app_metadata: Record<string, unknown>;
        }
      ): Promise<UpdateUserResponse>;
    };
  };
};

export type CreateAuthInviteInput = {
  email: string;
  role?: InviteRole;
  organizationId?: string;
  actorId?: string;
  redirectTo: string;
  deliveryMode?: InviteDeliveryMode;
};

export type AuthInviteResult = {
  userId: string;
  email: string;
  role: InviteRole;
  organizationId: string;
  actorId: string | null;
  redirectTo: string;
  deliveryMode: InviteDeliveryMode;
  actionLink: string | null;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  supabaseAdmin: SupabaseAdminAuthClient;
};

function requireActor(actor: Actor | null): Actor {
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  return actor;
}

function ensureInvitePermission(actor: Actor) {
  if (actor.role !== "admin" && actor.role !== "system") {
    throw new ServiceError(403, "insufficient permissions");
  }
}

function readMessage(error: SupabaseError | null | undefined) {
  return error?.message ?? "unknown error";
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}

export async function createAuthInvite(
  context: ServiceContext,
  input: CreateAuthInviteInput
): Promise<AuthInviteResult> {
  const actor = requireActor(context.actor);
  ensureInvitePermission(actor);

  const actorOrgId = (actor.organizationId ?? "").trim();
  const payloadOrgId = (input.organizationId ?? "").trim();
  if (actorOrgId && payloadOrgId && actorOrgId !== payloadOrgId) {
    throw new ServiceError(403, "organization mismatch");
  }
  const organizationId = actorOrgId || payloadOrgId;
  if (!organizationId) {
    throw new ServiceError(400, "organizationId is required");
  }

  const email = input.email.trim().toLowerCase();
  const role = input.role ?? "employee";
  const actorId = input.actorId?.trim() || null;
  const redirectTo = input.redirectTo.trim();
  const deliveryMode = input.deliveryMode ?? "link";

  let userId = "";
  let existingAppMetadata: Record<string, unknown> = {};
  let actionLink: string | null = null;

  if (deliveryMode === "link") {
    const { data, error } = await context.supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo }
    });
    if (error || !data?.user) {
      throw new ServiceError(502, "supabase invite link generation failed", {
        message: readMessage(error)
      });
    }
    if (!data.properties?.action_link) {
      throw new ServiceError(502, "supabase invite link generation failed", {
        message: "missing action_link in response"
      });
    }
    userId = data.user.id;
    existingAppMetadata = toRecord(data.user.app_metadata);
    actionLink = data.properties.action_link;
  } else {
    const { data, error } = await context.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo
    });
    if (error || !data?.user) {
      throw new ServiceError(502, "supabase invite email dispatch failed", {
        message: readMessage(error)
      });
    }
    userId = data.user.id;
    existingAppMetadata = toRecord(data.user.app_metadata);
    actionLink = null;
  }

  const nextAppMetadata: Record<string, unknown> = {
    ...existingAppMetadata,
    role,
    organization_id: organizationId
  };
  if (actorId) {
    nextAppMetadata.actor_id = actorId;
  }

  const { error: updateError } = await context.supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: nextAppMetadata
  });
  if (updateError) {
    throw new ServiceError(502, "supabase user metadata update failed", {
      message: readMessage(updateError)
    });
  }

  await context.dataAccess.audit.append({
    action: "auth.invite.generated",
    entityType: "AuthInvite",
    entityId: userId,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      email,
      role,
      actorId,
      redirectTo,
      deliveryMode,
      hasActionLink: actionLink !== null
    }
  });

  await context.dataAccess.audit.append({
    action: "auth.user.claims.updated",
    entityType: "AuthUser",
    entityId: userId,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      role,
      organizationId,
      actorId,
      deliveryMode
    }
  });

  return {
    userId,
    email,
    role,
    organizationId,
    actorId,
    redirectTo,
    deliveryMode,
    actionLink
  };
}
