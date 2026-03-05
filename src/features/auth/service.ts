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
          data?: Record<string, unknown>;
        };
      }): Promise<GenerateLinkResponse>;
      inviteUserByEmail(
        email: string,
        options?: {
          redirectTo?: string;
          data?: Record<string, unknown>;
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
  name?: string;
  departmentId?: string;
  positionId?: string;
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
  invitedAt: Date;
};

export type ListAuthInvitesInput = {
  organizationId?: string;
  role?: InviteRole;
  limit?: number;
};

export type AuthInviteHistoryEntry = {
  userId: string;
  email: string;
  name: string | null;
  role: InviteRole;
  organizationId: string;
  actorId: string | null;
  departmentId: string | null;
  positionId: string | null;
  deliveryMode: InviteDeliveryMode;
  createdAt: Date;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  supabaseAdmin: SupabaseAdminAuthClient;
};

const AUTH_INVITE_AUDIT_ACTION = "auth.invite.generated";

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

function isInviteConflictError(error: SupabaseError | null | undefined) {
  const message = readMessage(error).toLowerCase();
  return (
    message.includes("already") ||
    message.includes("exists") ||
    message.includes("registered") ||
    message.includes("taken") ||
    message.includes("duplicate")
  );
}

function readOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}

function normalizeInviteRole(value: unknown): InviteRole | null {
  if (typeof value !== "string") {
    return null;
  }
  return inviteRoles.includes(value as InviteRole) ? (value as InviteRole) : null;
}

function normalizeInviteDeliveryMode(value: unknown): InviteDeliveryMode {
  if (typeof value !== "string") {
    return "link";
  }
  return inviteDeliveryModes.includes(value as InviteDeliveryMode)
    ? (value as InviteDeliveryMode)
    : "link";
}

function normalizeInviteListLimit(limit: number | undefined) {
  if (!Number.isInteger(limit) || !limit || limit <= 0) {
    return 100;
  }
  return Math.min(limit, 500);
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
  const name = input.name?.trim() || null;
  const departmentId = input.departmentId?.trim() || null;
  const positionId = input.positionId?.trim() || null;
  const redirectTo = input.redirectTo.trim();
  const deliveryMode = input.deliveryMode ?? "link";
  const invitedAt = new Date();

  const userMetadata: Record<string, unknown> = {
    organizationId,
    organization_id: organizationId,
    role
  };
  if (name) {
    userMetadata.name = name;
  }
  if (departmentId) {
    userMetadata.departmentId = departmentId;
  }
  if (positionId) {
    userMetadata.positionId = positionId;
  }

  let userId = "";
  let existingAppMetadata: Record<string, unknown> = {};
  let actionLink: string | null = null;

  if (deliveryMode === "link") {
    const { data, error } = await context.supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo,
        data: userMetadata
      }
    });
    if (error || !data?.user) {
      if (isInviteConflictError(error)) {
        throw new ServiceError(409, "invite already exists", {
          message: readMessage(error)
        });
      }
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
      redirectTo,
      data: userMetadata
    });
    if (error || !data?.user) {
      if (isInviteConflictError(error)) {
        throw new ServiceError(409, "invite already exists", {
          message: readMessage(error)
        });
      }
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
      name,
      role,
      actorId,
      departmentId,
      positionId,
      redirectTo,
      deliveryMode,
      hasActionLink: actionLink !== null,
      invitedAt: invitedAt.toISOString()
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
    actionLink,
    invitedAt
  };
}

export async function listAuthInvites(
  context: ServiceContext,
  input: ListAuthInvitesInput
): Promise<AuthInviteHistoryEntry[]> {
  const actor = requireActor(context.actor);
  ensureInvitePermission(actor);

  const actorOrgId = (actor.organizationId ?? "").trim();
  const requestedOrgId = (input.organizationId ?? "").trim();
  if (actorOrgId && requestedOrgId && actorOrgId !== requestedOrgId) {
    throw new ServiceError(403, "organization mismatch");
  }

  const organizationId = actorOrgId || requestedOrgId;
  if (!organizationId) {
    throw new ServiceError(400, "organizationId is required");
  }

  const limit = normalizeInviteListLimit(input.limit);
  const rows = await context.dataAccess.audit.list({
    actions: [AUTH_INVITE_AUDIT_ACTION],
    entityType: "AuthInvite",
    organizationId,
    limit: 5000
  });

  const invites: AuthInviteHistoryEntry[] = [];
  for (const row of rows) {
    const payload = toRecord(row.payload);
    const role = normalizeInviteRole(payload.role);
    if (!role) {
      continue;
    }
    if (input.role && role !== input.role) {
      continue;
    }

    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!email) {
      continue;
    }

    invites.push({
      userId: row.entityId ?? "",
      email,
      name: readOptionalTrimmedString(payload.name),
      role,
      organizationId,
      actorId: typeof payload.actorId === "string" ? payload.actorId : null,
      departmentId: readOptionalTrimmedString(payload.departmentId),
      positionId: readOptionalTrimmedString(payload.positionId),
      deliveryMode: normalizeInviteDeliveryMode(payload.deliveryMode),
      createdAt: row.createdAt
    });
  }

  invites.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  return invites.slice(0, limit);
}
