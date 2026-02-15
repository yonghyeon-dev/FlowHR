import type { Actor } from "@/lib/actor";
import type { DataAccess } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";
import { defaultRolePermissions, type Permission } from "@/lib/rbac";

export type PermissionContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isRbacEnabled() {
  return isTruthyFlag(process.env.FLOWHR_RBAC_V1 ?? process.env.RBAC_V1);
}

export async function resolveActorPermissions(context: PermissionContext): Promise<Set<string>> {
  if (!context.actor) {
    return new Set();
  }

  if (isRbacEnabled()) {
    const role = await context.dataAccess.rbac.findRoleById(context.actor.role);
    return new Set(role?.permissions ?? []);
  }

  const fallback = (defaultRolePermissions as Record<string, readonly Permission[]>)[context.actor.role];
  return new Set(fallback ?? []);
}

export async function hasPermission(context: PermissionContext, permission: Permission): Promise<boolean> {
  if (!context.actor) {
    return false;
  }
  const permissions = await resolveActorPermissions(context);
  return permissions.has(permission);
}

export async function requireAnyPermission(
  context: PermissionContext,
  allowed: readonly Permission[],
  message = "insufficient permissions"
) {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  const permissions = await resolveActorPermissions(context);
  for (const permission of allowed) {
    if (permissions.has(permission)) {
      return;
    }
  }
  throw new ServiceError(403, message);
}

export async function requirePermission(
  context: PermissionContext,
  permission: Permission,
  message = "insufficient permissions"
) {
  await requireAnyPermission(context, [permission], message);
}

export async function requireOwnOrAny(
  context: PermissionContext,
  input: {
    own: Permission;
    any: Permission;
    employeeId: string;
    message?: string;
  }
) {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const permissions = await resolveActorPermissions(context);
  if (permissions.has(input.any)) {
    return;
  }
  if (permissions.has(input.own) && context.actor.id === input.employeeId) {
    return;
  }
  throw new ServiceError(403, input.message ?? "insufficient permissions");
}

