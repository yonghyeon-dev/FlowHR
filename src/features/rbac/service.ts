import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type { DataAccess, RoleWithPermissionsEntity } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

const allowedPermissions = new Set<string>(Object.values(Permissions));

function normalizePermissions(input: readonly string[]) {
  const unique = new Set<string>();
  for (const value of input) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    unique.add(trimmed);
  }
  const permissions = Array.from(unique);
  permissions.sort((a, b) => a.localeCompare(b));
  return permissions;
}

function validatePermissions(permissions: readonly string[]) {
  const unknown = permissions.filter((permission) => !allowedPermissions.has(permission));
  if (unknown.length === 0) {
    return;
  }
  throw new ServiceError(400, "unknown permissions", { unknown });
}

async function requireRbacManage(context: ServiceContext) {
  await requirePermission(
    context,
    Permissions.rbacManage,
    `rbac manage requires ${Permissions.rbacManage}`
  );
}

export async function listRoles(context: ServiceContext): Promise<RoleWithPermissionsEntity[]> {
  await requireRbacManage(context);
  return await context.dataAccess.rbac.listRoles();
}

export async function getRole(
  context: ServiceContext,
  input: { roleId: string }
): Promise<RoleWithPermissionsEntity> {
  await requireRbacManage(context);
  const roleId = input.roleId.trim();
  if (!roleId) {
    throw new ServiceError(400, "roleId is required");
  }
  const role = await context.dataAccess.rbac.findRoleById(roleId);
  if (!role) {
    throw new ServiceError(404, "role not found");
  }
  return role;
}

export async function upsertRole(
  context: ServiceContext,
  input: {
    roleId: string;
    name?: string | undefined;
    description?: string | null | undefined;
    permissions: string[];
  }
): Promise<{ role: RoleWithPermissionsEntity; created: boolean }> {
  await requireRbacManage(context);

  const roleId = input.roleId.trim();
  if (!roleId) {
    throw new ServiceError(400, "roleId is required");
  }

  const existing = await context.dataAccess.rbac.findRoleById(roleId);
  const permissions = normalizePermissions(input.permissions ?? []);
  validatePermissions(permissions);

  const role = await context.dataAccess.rbac.upsertRole({
    id: roleId,
    name: (input.name ?? roleId).trim() || roleId,
    description: input.description === undefined ? null : input.description,
    permissions
  });

  await context.dataAccess.audit.append({
    action: "rbac.role.upserted",
    entityType: "Role",
    entityId: role.id,
    organizationId: context.actor!.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      created: existing === null,
      permissions
    }
  });

  return {
    role,
    created: existing === null
  };
}

