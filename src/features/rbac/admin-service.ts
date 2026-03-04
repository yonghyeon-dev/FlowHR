import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { upsertRole } from "@/features/rbac/service";
import type {
  DataAccess,
  EmployeeEntity,
  RoleWithPermissionsEntity
} from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

type SupabaseError = {
  message?: string;
};

type SupabaseAdminUser = {
  id: string;
  app_metadata?: unknown;
};

type SupabaseListUsersResponse = {
  data?:
    | {
        users?: SupabaseAdminUser[] | null;
        nextPage?: number | null;
        lastPage?: number | null;
      }
    | null;
  error?: SupabaseError | null;
};

type SupabaseUpdateUserResponse = {
  error?: SupabaseError | null;
};

export type SupabaseAdminRoleClient = {
  auth: {
    admin: {
      listUsers(input?: { page?: number; perPage?: number }): Promise<SupabaseListUsersResponse>;
      updateUserById(
        userId: string,
        attributes: {
          app_metadata: Record<string, unknown>;
        }
      ): Promise<SupabaseUpdateUserResponse>;
    };
  };
};

type RoleAssignmentServiceContext = ServiceContext & {
  supabaseAdmin: SupabaseAdminRoleClient;
};

export type RoleAssignmentSummary = {
  employeeId: string;
  employeeName: string;
  currentRole: string | null;
};

function requireActor(actor: Actor | null): Actor {
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  return actor;
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

function readMetadataString(source: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

function readUserOrganizationId(user: SupabaseAdminUser) {
  const appMetadata = toRecord(user.app_metadata);
  return readMetadataString(appMetadata, ["organization_id", "organizationId"]);
}

function readUserEmployeeId(user: SupabaseAdminUser) {
  const appMetadata = toRecord(user.app_metadata);
  return readMetadataString(appMetadata, ["actor_id", "actorId", "employee_id", "employeeId"]);
}

function readUserRole(user: SupabaseAdminUser) {
  const appMetadata = toRecord(user.app_metadata);
  return readMetadataString(appMetadata, ["role", "user_role"]);
}

function normalizeRoleId(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) {
    throw new ServiceError(400, "role name must contain latin letters or numbers");
  }
  return normalized;
}

function resolveEmployeeName(employee: EmployeeEntity) {
  const name = employee.name?.trim() ?? "";
  return name.length > 0 ? name : employee.id;
}

async function requireRbacManage(context: ServiceContext) {
  await requirePermission(
    context,
    Permissions.rbacManage,
    `rbac manage requires ${Permissions.rbacManage}`
  );
}

async function resolveRoleByName(
  context: ServiceContext,
  input: { roleName: string }
): Promise<RoleWithPermissionsEntity> {
  const roleName = input.roleName.trim();
  if (!roleName) {
    throw new ServiceError(400, "roleName is required");
  }

  const direct = await context.dataAccess.rbac.findRoleById(roleName);
  if (direct) {
    return direct;
  }

  const normalized = roleName.toLowerCase();
  const roles = await context.dataAccess.rbac.listRoles();
  const matches = roles.filter((role) => {
    return role.id.toLowerCase() === normalized || role.name.trim().toLowerCase() === normalized;
  });
  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length > 1) {
    throw new ServiceError(409, "roleName is ambiguous", {
      roleName,
      roleIds: matches.map((role) => role.id)
    });
  }

  throw new ServiceError(404, "role not found", { roleName });
}

async function listAllSupabaseUsers(supabaseAdmin: SupabaseAdminRoleClient) {
  const users: SupabaseAdminUser[] = [];
  const perPage = 200;
  let page = 1;

  for (let guard = 0; guard < 100; guard += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage
    });
    if (error) {
      throw new ServiceError(502, "supabase user listing failed", {
        message: readMessage(error)
      });
    }

    const rows = data?.users ?? [];
    users.push(...rows);

    const nextPage = data?.nextPage;
    if (typeof nextPage === "number" && nextPage > page) {
      page = nextPage;
      continue;
    }

    const lastPage = data?.lastPage;
    if (typeof lastPage === "number" && page < lastPage) {
      page += 1;
      continue;
    }

    if (rows.length >= perPage) {
      page += 1;
      continue;
    }

    break;
  }

  return users;
}

export async function createRole(
  context: ServiceContext,
  input: {
    name: string;
    description?: string | null | undefined;
    permissions: string[];
  }
): Promise<RoleWithPermissionsEntity> {
  await requireRbacManage(context);

  const roleId = normalizeRoleId(input.name);
  const existing = await context.dataAccess.rbac.findRoleById(roleId);
  if (existing) {
    throw new ServiceError(409, "role already exists", { roleId });
  }

  const result = await upsertRole(context, {
    roleId,
    name: input.name.trim(),
    description: input.description === undefined ? null : input.description,
    permissions: input.permissions
  });
  return result.role;
}

export async function updateRole(
  context: ServiceContext,
  input: {
    roleId: string;
    name?: string | undefined;
    description?: string | null | undefined;
    permissions?: string[] | undefined;
  }
): Promise<RoleWithPermissionsEntity> {
  await requireRbacManage(context);

  const roleId = input.roleId.trim();
  if (!roleId) {
    throw new ServiceError(400, "roleId is required");
  }
  if (input.name === undefined && input.description === undefined && input.permissions === undefined) {
    throw new ServiceError(400, "at least one field is required");
  }

  const existing = await context.dataAccess.rbac.findRoleById(roleId);
  if (!existing) {
    throw new ServiceError(404, "role not found");
  }

  const result = await upsertRole(context, {
    roleId,
    name: input.name ?? existing.name,
    description: input.description === undefined ? existing.description : input.description,
    permissions: input.permissions ?? existing.permissions
  });
  return result.role;
}

export async function assignRoleToEmployee(
  context: RoleAssignmentServiceContext,
  input: {
    employeeId: string;
    roleName: string;
  }
): Promise<RoleAssignmentSummary> {
  await requireRbacManage(context);

  const actor = requireActor(context.actor);
  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    throw new ServiceError(400, "organizationId is required");
  }

  const employeeId = input.employeeId.trim();
  if (!employeeId) {
    throw new ServiceError(400, "employeeId is required");
  }

  const employee = await context.dataAccess.employees.findById(employeeId);
  if (!employee || employee.organizationId !== organizationId) {
    throw new ServiceError(404, "employee not found");
  }

  const role = await resolveRoleByName(context, { roleName: input.roleName });
  const users = await listAllSupabaseUsers(context.supabaseAdmin);
  const candidates = users.filter((user) => {
    return readUserOrganizationId(user) === organizationId && readUserEmployeeId(user) === employeeId;
  });
  if (candidates.length === 0) {
    throw new ServiceError(404, "auth user not found for employee", { employeeId });
  }
  if (candidates.length > 1) {
    throw new ServiceError(409, "multiple auth users found for employee", {
      employeeId,
      authUserIds: candidates.map((user) => user.id)
    });
  }

  const targetUser = candidates[0];
  const currentMetadata = toRecord(targetUser.app_metadata);
  const previousRole = readMetadataString(currentMetadata, ["role", "user_role"]);
  const nextMetadata: Record<string, unknown> = {
    ...currentMetadata,
    role: role.id,
    organization_id: organizationId,
    actor_id: employeeId
  };

  const { error } = await context.supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
    app_metadata: nextMetadata
  });
  if (error) {
    throw new ServiceError(502, "supabase user metadata update failed", {
      message: readMessage(error)
    });
  }

  await context.dataAccess.audit.append({
    action: "rbac.role.assigned",
    entityType: "Role",
    entityId: role.id,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId,
      authUserId: targetUser.id,
      previousRole,
      currentRole: role.id
    }
  });

  return {
    employeeId,
    employeeName: resolveEmployeeName(employee),
    currentRole: role.id
  };
}

export async function listRoleAssignments(
  context: RoleAssignmentServiceContext
): Promise<RoleAssignmentSummary[]> {
  await requireRbacManage(context);

  const actor = requireActor(context.actor);
  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    throw new ServiceError(400, "organizationId is required");
  }

  const [employees, users] = await Promise.all([
    context.dataAccess.employees.list({ organizationId }),
    listAllSupabaseUsers(context.supabaseAdmin)
  ]);

  const roleByEmployeeId = new Map<string, string>();
  for (const user of users) {
    if (readUserOrganizationId(user) !== organizationId) {
      continue;
    }
    const employeeId = readUserEmployeeId(user);
    if (!employeeId) {
      continue;
    }
    const role = readUserRole(user);
    if (!role || roleByEmployeeId.has(employeeId)) {
      continue;
    }
    roleByEmployeeId.set(employeeId, role);
  }

  const items = employees.map((employee) => ({
    employeeId: employee.id,
    employeeName: resolveEmployeeName(employee),
    currentRole: roleByEmployeeId.get(employee.id) ?? null
  }));
  items.sort((left, right) => left.employeeId.localeCompare(right.employeeId));
  return items;
}
