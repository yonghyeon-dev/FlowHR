import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions, type Permission } from "@/lib/rbac";
import { ensureTenantMatch, resolveTenantScope } from "@/features/shared/tenant-scope";
import type {
  DataAccess,
  DepartmentEntity,
  EmployeeEntity,
  EmployeeStatus,
  OrganizationEntity,
  PositionEntity
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ServiceError } from "@/features/shared/service-error";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isTenancyEnabled } from "@/lib/tenancy";
import {
  resolveDefaultWorkScheduleSeedRange,
  seedDefaultWorkSchedulesForEmployee
} from "@/features/scheduling/default-work-schedule-seed";

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

export type EmployeeProfileHistoryEntry = {
  action: string;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: Date;
};

const EMPLOYEE_PROFILE_HISTORY_ACTIONS = ["employee.created", "employee.profile.updated"] as const;
const EMPLOYEE_STATUS_TRANSITION_ACTION = "employee.status.transitioned";

const ALLOWED_EMPLOYEE_STATUS_TRANSITIONS: Record<EmployeeStatus, readonly EmployeeStatus[]> = {
  ACTIVE: ["ON_LEAVE", "RESIGNED"],
  ON_LEAVE: ["ACTIVE", "RESIGNED"],
  RESIGNED: []
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

async function requirePeoplePermission(context: ServiceContext, permission: Permission, action: string) {
  await requirePermission(context, permission, `people ${action} requires ${permission}`);
}

function normalizeCode(code: string) {
  return code.trim().toLowerCase();
}

function ensureNonEmptyText(value: string | null | undefined, fieldName: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    throw new ServiceError(400, `${fieldName} is required`);
  }
  return normalized;
}

function normalizeNullableId(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function buildDepartmentCodeBase(name: string) {
  const normalized = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : "DEPARTMENT";
}

function buildPositionCodeBase(title: string) {
  const normalized = title
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : "POSITION";
}

function ensureUniqueDepartmentCode(
  existingDepartments: DepartmentEntity[],
  inputCode: string | undefined,
  inputName: string
) {
  const existingCodes = new Set(existingDepartments.map((row) => normalizeCode(row.code)));
  if (inputCode !== undefined) {
    const code = ensureNonEmptyText(inputCode, "code");
    if (existingCodes.has(normalizeCode(code))) {
      throw new ServiceError(409, "department code already exists in organization");
    }
    return code;
  }

  const base = buildDepartmentCodeBase(inputName);
  if (!existingCodes.has(normalizeCode(base))) {
    return base;
  }
  for (let index = 2; index <= 999; index += 1) {
    const candidate = `${base}-${index}`;
    if (!existingCodes.has(normalizeCode(candidate))) {
      return candidate;
    }
  }
  throw new ServiceError(409, "department code already exists in organization");
}

function ensureUniquePositionCode(
  existingPositions: PositionEntity[],
  inputCode: string | undefined,
  inputTitle: string
) {
  const existingCodes = new Set(existingPositions.map((row) => normalizeCode(row.code)));
  if (inputCode !== undefined) {
    const code = ensureNonEmptyText(inputCode, "code");
    if (existingCodes.has(normalizeCode(code))) {
      throw new ServiceError(409, "position code already exists in organization");
    }
    return code;
  }

  const base = buildPositionCodeBase(inputTitle);
  if (!existingCodes.has(normalizeCode(base))) {
    return base;
  }
  for (let index = 2; index <= 999; index += 1) {
    const candidate = `${base}-${index}`;
    if (!existingCodes.has(normalizeCode(candidate))) {
      return candidate;
    }
  }
  throw new ServiceError(409, "position code already exists in organization");
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function mapLegacyActiveToStatus(active: boolean): EmployeeStatus {
  return active ? "ACTIVE" : "ON_LEAVE";
}

function resolveEmployeeStatusValue(input: {
  status?: EmployeeStatus;
  active?: boolean;
  fieldPrefix?: string;
}): EmployeeStatus | undefined {
  if (input.status === undefined && input.active === undefined) {
    return undefined;
  }
  if (input.status !== undefined && input.active !== undefined) {
    const expectedActive = input.status === "ACTIVE";
    if (input.active !== expectedActive) {
      const prefix = input.fieldPrefix ? `${input.fieldPrefix}: ` : "";
      throw new ServiceError(400, `${prefix}active and status conflict`);
    }
    return input.status;
  }
  if (input.status !== undefined) {
    return input.status;
  }
  return mapLegacyActiveToStatus(input.active!);
}

function assertValidEmployeeStatusTransition(current: EmployeeStatus, next: EmployeeStatus) {
  if (current === "RESIGNED") {
    throw new ServiceError(400, "cannot transition from RESIGNED");
  }
  if (current === next) {
    throw new ServiceError(400, `invalid transition: ${current} -> ${next}`);
  }
  if (!ALLOWED_EMPLOYEE_STATUS_TRANSITIONS[current].includes(next)) {
    throw new ServiceError(400, `invalid transition: ${current} -> ${next}`);
  }
}

function isSupabaseUserId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function invalidateEmployeeSessionsIfPossible(employeeId: string) {
  if (!isSupabaseUserId(employeeId)) {
    return { attempted: false as const, success: false as const, reason: "non_supabase_employee_id" };
  }

  try {
    const { error } = await getSupabaseAdmin().auth.admin.signOut(employeeId);
    if (error) {
      return { attempted: true as const, success: false as const, reason: error.message };
    }
    return { attempted: true as const, success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return { attempted: true as const, success: false as const, reason: message };
  }
}

async function seedDefaultSchedulesOnActivation(
  context: ServiceContext,
  employee: EmployeeEntity,
  options?: { fromDate?: string; toDate?: string; baseDate?: Date }
) {
  if (employee.status !== "ACTIVE") {
    return null;
  }
  if (!employee.organizationId) {
    return null;
  }

  const result = await seedDefaultWorkSchedulesForEmployee({
    dataAccess: context.dataAccess,
    employee,
    range:
      options?.fromDate || options?.toDate
        ? {
            fromDate: options?.fromDate,
            toDate: options?.toDate
          }
        : undefined,
    baseDate: options?.baseDate
  });

  await context.dataAccess.audit.append({
    action: "scheduling.schedule.default_seeded",
    entityType: "Employee",
    entityId: employee.id,
    organizationId: employee.organizationId,
    actorRole: context.actor?.role ?? "system",
    actorId: context.actor?.id ?? undefined,
    payload: {
      employeeId: employee.id,
      organizationId: employee.organizationId,
      fromDate: result.fromDate,
      toDate: result.toDate,
      candidateCount: result.candidateCount,
      createdCount: result.createdCount,
      skippedOverlapCount: result.skippedOverlapCount,
      createdScheduleIds: result.createdScheduleIds
    }
  });

  return result;
}

async function requireDepartmentMutationAccess(context: ServiceContext, action: string) {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, action);
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (context.actor.role !== "admin" && context.actor.role !== "system") {
    throw new ServiceError(403, "admin role required");
  }
}

async function requirePositionMutationAccess(context: ServiceContext, action: string) {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, action);
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (context.actor.role !== "admin" && context.actor.role !== "system") {
    throw new ServiceError(403, "admin role required");
  }
}

async function requireEmployeeStatusMutationAccess(context: ServiceContext, action: string) {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, action);
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (context.actor.role !== "admin" && context.actor.role !== "system") {
    throw new ServiceError(403, "admin role required");
  }
}

async function findOrganizationOrThrow(context: ServiceContext, organizationId: string) {
  const organization = await context.dataAccess.organizations.findById(organizationId);
  if (!organization) {
    throw new ServiceError(404, "organization not found");
  }
  return organization;
}

async function findDepartmentWithinScopeOrThrow(
  context: ServiceContext,
  tenantScope: string | null,
  departmentId: string
) {
  const department = await context.dataAccess.departments.findById(departmentId);
  if (!department) {
    throw new ServiceError(404, "department not found");
  }
  ensureTenantMatch(tenantScope, department.organizationId, "department not found");
  return department;
}

async function findEmployeeWithinScopeOrThrow(
  context: ServiceContext,
  tenantScope: string | null,
  employeeId: string
) {
  const employee = await context.dataAccess.employees.findById(employeeId);
  if (!employee) {
    throw new ServiceError(404, "employee not found");
  }
  ensureTenantMatch(tenantScope, employee.organizationId, "employee not found");
  return employee;
}

async function ensureDepartmentParentId(
  context: ServiceContext,
  tenantScope: string | null,
  organizationId: string,
  parentId: string | null,
  currentDepartmentId?: string
) {
  if (parentId === null) {
    return null;
  }

  const parent = await findDepartmentWithinScopeOrThrow(context, tenantScope, parentId);
  if (parent.organizationId !== organizationId) {
    throw new ServiceError(409, "parent department organization mismatch");
  }
  if (currentDepartmentId && parent.id === currentDepartmentId) {
    throw new ServiceError(400, "parent department cannot reference itself");
  }

  if (!currentDepartmentId) {
    return parent.id;
  }

  const visited = new Set<string>();
  let cursorId: string | null = parent.id;
  while (cursorId) {
    if (cursorId === currentDepartmentId) {
      throw new ServiceError(400, "parent department cycle is not allowed");
    }
    if (visited.has(cursorId)) {
      break;
    }
    visited.add(cursorId);
    const cursor = await context.dataAccess.departments.findById(cursorId);
    if (!cursor) {
      break;
    }
    if (cursor.organizationId !== organizationId) {
      break;
    }
    cursorId = cursor.parentId;
  }

  return parent.id;
}

async function ensureDepartmentManagerId(
  context: ServiceContext,
  tenantScope: string | null,
  organizationId: string,
  managerId: string | null
) {
  if (managerId === null) {
    return null;
  }
  const manager = await findEmployeeWithinScopeOrThrow(context, tenantScope, managerId);
  if (manager.organizationId !== organizationId) {
    throw new ServiceError(409, "manager organization mismatch");
  }
  return manager.id;
}

async function findPositionWithinScopeOrThrow(
  context: ServiceContext,
  tenantScope: string | null,
  positionId: string
) {
  const position = await context.dataAccess.positions.findById(positionId);
  if (!position) {
    throw new ServiceError(404, "position not found");
  }
  ensureTenantMatch(tenantScope, position.organizationId, "position not found");
  return position;
}

export async function createOrganization(
  context: ServiceContext,
  input: { name: string }
): Promise<OrganizationEntity> {
  await requirePeoplePermission(context, Permissions.peopleOrganizationsManage, "create organization");
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const tenancyEnabled = isTenancyEnabled();
  const isBootstrapAdmin = tenancyEnabled && context.actor.role === "admin" && !context.actor.organizationId;
  if (tenancyEnabled && context.actor.role !== "system" && !context.actor.organizationId && !isBootstrapAdmin) {
    throw new ServiceError(401, "missing tenant context");
  }

  const tenantScope =
    tenancyEnabled && context.actor.role !== "system" ? context.actor.organizationId ?? null : null;
  if (tenantScope) {
    throw new ServiceError(403, "organization create is restricted to system role");
  }

  const organization = await context.dataAccess.organizations.create({
    name: input.name
  });

  await context.dataAccess.audit.append({
    action: "organization.created",
    entityType: "Organization",
    entityId: organization.id,
    organizationId: organization.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      name: organization.name
    }
  });

  await getEventPublisher(context).publish({
    name: "organization.created.v1",
    occurredAt: new Date().toISOString(),
    entityType: "Organization",
    entityId: organization.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      name: organization.name
    }
  });

  return organization;
}

export async function listOrganizations(context: ServiceContext): Promise<OrganizationEntity[]> {
  await requirePeoplePermission(context, Permissions.peopleOrganizationsManage, "list organizations");
  const tenantScope = resolveTenantScope(context.actor);
  if (!tenantScope) {
    return context.dataAccess.organizations.list();
  }
  const organization = await context.dataAccess.organizations.findById(tenantScope);
  return organization ? [organization] : [];
}

export async function getOrganization(
  context: ServiceContext,
  input: { organizationId: string }
): Promise<OrganizationEntity> {
  await requirePeoplePermission(context, Permissions.peopleOrganizationsManage, "get organization");
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.organizationId !== tenantScope) {
    throw new ServiceError(404, "organization not found");
  }
  const organization = await context.dataAccess.organizations.findById(input.organizationId);
  if (!organization) {
    throw new ServiceError(404, "organization not found");
  }
  return organization;
}

export async function createDepartment(
  context: ServiceContext,
  input: {
    organizationId?: string;
    code?: string;
    name: string;
    active?: boolean;
    parentId?: string | null;
    managerId?: string | null;
  }
): Promise<DepartmentEntity> {
  await requireDepartmentMutationAccess(context, "create department");
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.organizationId && input.organizationId !== tenantScope) {
    throw new ServiceError(403, "cross-tenant department create is not allowed");
  }

  const organizationIdInput = normalizeNullableId(input.organizationId ?? context.actor?.organizationId);
  const organizationId = tenantScope ?? ensureNonEmptyText(organizationIdInput, "organizationId");
  await findOrganizationOrThrow(context, organizationId);

  const name = ensureNonEmptyText(input.name, "name");
  const existing = await context.dataAccess.departments.list({ organizationId });
  const code = ensureUniqueDepartmentCode(existing, input.code, name);
  const parentId = await ensureDepartmentParentId(
    context,
    tenantScope,
    organizationId,
    normalizeNullableId(input.parentId)
  );
  const managerId = await ensureDepartmentManagerId(
    context,
    tenantScope,
    organizationId,
    normalizeNullableId(input.managerId)
  );

  const department = await context.dataAccess.departments.create({
    organizationId,
    code,
    name,
    active: input.active,
    parentId,
    managerId
  });

  await context.dataAccess.audit.append({
    action: "department.created",
    entityType: "Department",
    entityId: department.id,
    organizationId: department.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      code: department.code,
      name: department.name,
      active: department.active,
      parentId: department.parentId,
      managerId: department.managerId
    }
  });

  await getEventPublisher(context).publish({
    name: "department.created.v1",
    occurredAt: new Date().toISOString(),
    entityType: "Department",
    entityId: department.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      organizationId: department.organizationId,
      code: department.code,
      name: department.name,
      active: department.active,
      parentId: department.parentId,
      managerId: department.managerId
    }
  });

  return department;
}

export async function listDepartments(
  context: ServiceContext,
  input: { active?: boolean; organizationId?: string }
): Promise<DepartmentEntity[]> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "list departments");
  const tenantScope = resolveTenantScope(context.actor);
  return context.dataAccess.departments.list({
    active: input.active,
    organizationId: tenantScope ?? input.organizationId
  });
}

export async function getDepartment(
  context: ServiceContext,
  input: { departmentId: string }
): Promise<DepartmentEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "get department");
  const tenantScope = resolveTenantScope(context.actor);
  return await findDepartmentWithinScopeOrThrow(context, tenantScope, input.departmentId);
}

export async function updateDepartment(
  context: ServiceContext,
  input: {
    departmentId: string;
    code?: string;
    name?: string;
    active?: boolean;
    parentId?: string | null;
    managerId?: string | null;
  }
): Promise<DepartmentEntity> {
  await requireDepartmentMutationAccess(context, "update department");
  const tenantScope = resolveTenantScope(context.actor);

  const existing = await findDepartmentWithinScopeOrThrow(context, tenantScope, input.departmentId);
  const nextCode = input.code !== undefined ? ensureNonEmptyText(input.code, "code") : existing.code;
  if (normalizeCode(nextCode) !== normalizeCode(existing.code)) {
    const siblings = await context.dataAccess.departments.list({
      organizationId: existing.organizationId
    });
    if (
      siblings.some(
        (row) => row.id !== existing.id && normalizeCode(row.code) === normalizeCode(nextCode)
      )
    ) {
      throw new ServiceError(409, "department code already exists in organization");
    }
  }

  const nextParentId =
    input.parentId === undefined
      ? undefined
      : await ensureDepartmentParentId(
          context,
          tenantScope,
          existing.organizationId,
          normalizeNullableId(input.parentId),
          existing.id
        );
  const nextManagerId =
    input.managerId === undefined
      ? undefined
      : await ensureDepartmentManagerId(
          context,
          tenantScope,
          existing.organizationId,
          normalizeNullableId(input.managerId)
        );

  const department = await context.dataAccess.departments.update(input.departmentId, {
    code: input.code,
    name: input.name,
    active: input.active,
    parentId: nextParentId,
    managerId: nextManagerId
  });

  await context.dataAccess.audit.append({
    action: "department.updated",
    entityType: "Department",
    entityId: department.id,
    organizationId: department.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      before: {
        code: existing.code,
        name: existing.name,
        active: existing.active,
        parentId: existing.parentId,
        managerId: existing.managerId
      },
      after: {
        code: department.code,
        name: department.name,
        active: department.active,
        parentId: department.parentId,
        managerId: department.managerId
      }
    }
  });

  await getEventPublisher(context).publish({
    name: "department.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "Department",
    entityId: department.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      organizationId: department.organizationId,
      code: department.code,
      name: department.name,
      active: department.active,
      parentId: department.parentId,
      managerId: department.managerId
    }
  });

  return department;
}

export async function deleteDepartment(
  context: ServiceContext,
  input: { departmentId: string }
): Promise<DepartmentEntity> {
  await requireDepartmentMutationAccess(context, "delete department");
  const tenantScope = resolveTenantScope(context.actor);
  const existing = await findDepartmentWithinScopeOrThrow(context, tenantScope, input.departmentId);

  const employees = await context.dataAccess.employees.list({
    organizationId: existing.organizationId
  });
  if (employees.some((employee) => employee.departmentId === existing.id)) {
    throw new ServiceError(400, "Department has assigned employees");
  }

  const department = await context.dataAccess.departments.delete(existing.id);
  await context.dataAccess.audit.append({
    action: "department.deleted",
    entityType: "Department",
    entityId: department.id,
    organizationId: department.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      code: department.code,
      name: department.name,
      active: department.active,
      parentId: department.parentId,
      managerId: department.managerId
    }
  });

  return department;
}

export async function createPosition(
  context: ServiceContext,
  input: {
    organizationId?: string;
    code?: string;
    name?: string;
    title?: string;
    grade?: number | null;
    description?: string | null;
    active?: boolean;
  }
): Promise<PositionEntity> {
  await requirePositionMutationAccess(context, "create position");
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.organizationId && input.organizationId !== tenantScope) {
    throw new ServiceError(403, "cross-tenant position create is not allowed");
  }

  const organizationIdInput = normalizeNullableId(input.organizationId ?? context.actor?.organizationId);
  const organizationId = tenantScope ?? ensureNonEmptyText(organizationIdInput, "organizationId");
  await findOrganizationOrThrow(context, organizationId);

  if (input.title !== undefined && input.name !== undefined) {
    const title = ensureNonEmptyText(input.title, "title");
    const name = ensureNonEmptyText(input.name, "name");
    if (title !== name) {
      throw new ServiceError(400, "title and name must match");
    }
  }

  const title = ensureNonEmptyText(input.title ?? input.name, "title");
  const existing = await context.dataAccess.positions.list({ organizationId });
  const code = ensureUniquePositionCode(existing, input.code, title);
  const grade = input.grade === undefined ? null : input.grade;
  if (grade !== null && !Number.isInteger(grade)) {
    throw new ServiceError(400, "grade must be an integer");
  }
  const description = normalizeNullableText(input.description);

  const position = await context.dataAccess.positions.create({
    organizationId,
    code,
    name: title,
    title,
    grade,
    description,
    active: input.active
  });

  await context.dataAccess.audit.append({
    action: "position.created",
    entityType: "Position",
    entityId: position.id,
    organizationId: position.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      code: position.code,
      name: position.name,
      title: position.title,
      grade: position.grade,
      description: position.description,
      active: position.active
    }
  });

  await getEventPublisher(context).publish({
    name: "position.created.v1",
    occurredAt: new Date().toISOString(),
    entityType: "Position",
    entityId: position.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      organizationId: position.organizationId,
      code: position.code,
      name: position.name,
      title: position.title,
      grade: position.grade,
      description: position.description,
      active: position.active
    }
  });

  return position;
}

export async function listPositions(
  context: ServiceContext,
  input: { active?: boolean; organizationId?: string }
): Promise<PositionEntity[]> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "list positions");
  const tenantScope = resolveTenantScope(context.actor);
  return context.dataAccess.positions.list({
    active: input.active,
    organizationId: tenantScope ?? input.organizationId
  });
}

export async function getPosition(
  context: ServiceContext,
  input: { positionId: string }
): Promise<PositionEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "get position");
  const tenantScope = resolveTenantScope(context.actor);
  return await findPositionWithinScopeOrThrow(context, tenantScope, input.positionId);
}

export async function updatePosition(
  context: ServiceContext,
  input: {
    positionId: string;
    code?: string;
    name?: string;
    title?: string;
    grade?: number | null;
    description?: string | null;
    active?: boolean;
  }
): Promise<PositionEntity> {
  await requirePositionMutationAccess(context, "update position");
  const tenantScope = resolveTenantScope(context.actor);

  const existing = await findPositionWithinScopeOrThrow(context, tenantScope, input.positionId);
  if (input.title !== undefined && input.name !== undefined) {
    const title = ensureNonEmptyText(input.title, "title");
    const name = ensureNonEmptyText(input.name, "name");
    if (title !== name) {
      throw new ServiceError(400, "title and name must match");
    }
  }

  const nextCode = input.code !== undefined ? ensureNonEmptyText(input.code, "code") : existing.code;
  if (normalizeCode(nextCode) !== normalizeCode(existing.code)) {
    const siblings = await context.dataAccess.positions.list({
      organizationId: existing.organizationId
    });
    if (
      siblings.some(
        (row) => row.id !== existing.id && normalizeCode(row.code) === normalizeCode(nextCode)
      )
    ) {
      throw new ServiceError(409, "position code already exists in organization");
    }
  }

  const nextTitle =
    input.title !== undefined
      ? ensureNonEmptyText(input.title, "title")
      : input.name !== undefined
        ? ensureNonEmptyText(input.name, "name")
        : undefined;

  if (input.grade !== undefined && input.grade !== null && !Number.isInteger(input.grade)) {
    throw new ServiceError(400, "grade must be an integer");
  }

  const position = await context.dataAccess.positions.update(input.positionId, {
    code: input.code,
    name: nextTitle,
    title: nextTitle,
    grade: input.grade,
    description: input.description !== undefined ? normalizeNullableText(input.description) : undefined,
    active: input.active
  });

  await context.dataAccess.audit.append({
    action: "position.updated",
    entityType: "Position",
    entityId: position.id,
    organizationId: position.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      before: {
        code: existing.code,
        name: existing.name,
        title: existing.title,
        grade: existing.grade,
        description: existing.description,
        active: existing.active
      },
      after: {
        code: position.code,
        name: position.name,
        title: position.title,
        grade: position.grade,
        description: position.description,
        active: position.active
      }
    }
  });

  await getEventPublisher(context).publish({
    name: "position.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "Position",
    entityId: position.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      organizationId: position.organizationId,
      code: position.code,
      name: position.name,
      title: position.title,
      grade: position.grade,
      description: position.description,
      active: position.active
    }
  });

  return position;
}

export async function deletePosition(
  context: ServiceContext,
  input: { positionId: string }
): Promise<PositionEntity> {
  await requirePositionMutationAccess(context, "delete position");
  const tenantScope = resolveTenantScope(context.actor);
  const existing = await findPositionWithinScopeOrThrow(context, tenantScope, input.positionId);

  const employees = await context.dataAccess.employees.list({
    organizationId: existing.organizationId
  });
  if (employees.some((employee) => employee.positionId === existing.id)) {
    throw new ServiceError(400, "Position has assigned employees");
  }

  const position = await context.dataAccess.positions.delete(existing.id);
  await context.dataAccess.audit.append({
    action: "position.deleted",
    entityType: "Position",
    entityId: position.id,
    organizationId: position.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      code: position.code,
      name: position.name,
      title: position.title,
      grade: position.grade,
      description: position.description,
      active: position.active
    }
  });

  return position;
}

export async function createEmployee(
  context: ServiceContext,
  input: {
    id: string;
    organizationId?: string | null;
    departmentId?: string | null;
    positionId?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string;
    address?: string;
    status?: EmployeeStatus;
    active?: boolean;
  }
): Promise<EmployeeEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "create employee");
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const tenancyEnabled = isTenancyEnabled();
  const isBootstrapAdmin = tenancyEnabled && context.actor.role === "admin" && !context.actor.organizationId;
  if (tenancyEnabled && context.actor.role !== "system" && !context.actor.organizationId && !isBootstrapAdmin) {
    throw new ServiceError(401, "missing tenant context");
  }

  const tenantScope =
    tenancyEnabled && context.actor.role !== "system" ? context.actor.organizationId ?? null : null;
  if (tenantScope && input.organizationId && input.organizationId !== tenantScope) {
    throw new ServiceError(403, "cross-tenant employee create is not allowed");
  }

  const existing = await context.dataAccess.employees.findById(input.id);
  if (existing) {
    throw new ServiceError(409, "employee already exists");
  }

  let organizationId = tenantScope ?? (input.organizationId ?? null);
  if (isBootstrapAdmin && !organizationId) {
    throw new ServiceError(400, "organizationId is required");
  }

  let department: DepartmentEntity | null = null;
  if (input.departmentId) {
    department = await findDepartmentWithinScopeOrThrow(context, tenantScope, input.departmentId);
    if (organizationId && department.organizationId !== organizationId) {
      throw new ServiceError(409, "department organization mismatch");
    }
    if (!organizationId) {
      organizationId = department.organizationId;
    }
  }

  let position: PositionEntity | null = null;
  if (input.positionId) {
    position = await findPositionWithinScopeOrThrow(context, tenantScope, input.positionId);
    if (organizationId && position.organizationId !== organizationId) {
      throw new ServiceError(409, "position organization mismatch");
    }
    if (!organizationId) {
      organizationId = position.organizationId;
    }
  }

  if (
    department &&
    position &&
    department.organizationId !== position.organizationId
  ) {
    throw new ServiceError(409, "department and position must belong to same organization");
  }

  if (organizationId) {
    await findOrganizationOrThrow(context, organizationId);
  }

  const status = resolveEmployeeStatusValue({
    status: input.status,
    active: input.active,
    fieldPrefix: "create employee"
  }) ?? "ACTIVE";

  const employee = await context.dataAccess.employees.create({
    id: input.id,
    organizationId,
    departmentId: input.departmentId ?? null,
    positionId: input.positionId ?? null,
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    status
  });

  if (employee.status === "ACTIVE") {
    await seedDefaultSchedulesOnActivation(context, employee, {
      ...resolveDefaultWorkScheduleSeedRange(employee.createdAt),
      baseDate: employee.createdAt
    });
  }

  await context.dataAccess.audit.append({
    action: "employee.created",
    entityType: "Employee",
    entityId: employee.id,
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      organizationId: employee.organizationId,
      departmentId: employee.departmentId,
      positionId: employee.positionId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      status: employee.status,
      active: employee.active
    }
  });

  await getEventPublisher(context).publish({
    name: "employee.created.v1",
    occurredAt: new Date().toISOString(),
    entityType: "Employee",
    entityId: employee.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      organizationId: employee.organizationId,
      departmentId: employee.departmentId,
      positionId: employee.positionId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      status: employee.status,
      active: employee.active
    }
  });

  return employee;
}

export async function listEmployees(
  context: ServiceContext,
  input: { active?: boolean; status?: EmployeeStatus; organizationId?: string }
): Promise<EmployeeEntity[]> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "list employees");
  const tenantScope = resolveTenantScope(context.actor);
  return context.dataAccess.employees.list({
    active: input.active,
    status: input.status,
    organizationId: tenantScope ?? input.organizationId
  });
}

export async function getEmployee(
  context: ServiceContext,
  input: { employeeId: string }
): Promise<EmployeeEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "get employee");
  const tenantScope = resolveTenantScope(context.actor);
  const employee = await context.dataAccess.employees.findById(input.employeeId);
  if (!employee) {
    throw new ServiceError(404, "employee not found");
  }
  ensureTenantMatch(tenantScope, employee.organizationId, "employee not found");
  return employee;
}

export async function listEmployeeProfileHistory(
  context: ServiceContext,
  input: { employeeId: string; limit?: number }
): Promise<EmployeeProfileHistoryEntry[]> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "list employee history");
  const tenantScope = resolveTenantScope(context.actor);

  const employee = await context.dataAccess.employees.findById(input.employeeId);
  if (!employee) {
    throw new ServiceError(404, "employee not found");
  }
  ensureTenantMatch(tenantScope, employee.organizationId, "employee not found");

  const requestedLimit = input.limit ?? 30;
  const normalizedLimit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 200)
      : 30;

  const historyRows = await context.dataAccess.audit.list({
    actions: [...EMPLOYEE_PROFILE_HISTORY_ACTIONS],
    entityType: "Employee",
    entityId: input.employeeId,
    organizationId: tenantScope ?? undefined,
    limit: 500
  });

  return historyRows
    .slice(-normalizedLimit)
    .reverse()
    .map((row) => ({
      action: row.action,
      actorRole: row.actorRole,
      actorId: row.actorId,
      payload: row.payload,
      createdAt: row.createdAt
    }));
}

export async function updateEmployee(
  context: ServiceContext,
  input: {
    employeeId: string;
    organizationId?: string | null;
    departmentId?: string | null;
    positionId?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string;
    address?: string;
    status?: EmployeeStatus;
    active?: boolean;
  }
): Promise<EmployeeEntity> {
  const isSelfServiceUpdate =
    context.actor?.role === "employee" && context.actor.id === input.employeeId;
  if (!isSelfServiceUpdate) {
    await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "update employee");
  }

  const tenantScope = resolveTenantScope(context.actor);

  const existing = await context.dataAccess.employees.findById(input.employeeId);
  if (!existing) {
    throw new ServiceError(404, "employee not found");
  }
  ensureTenantMatch(tenantScope, existing.organizationId, "employee not found");
  const normalizedStatus = resolveEmployeeStatusValue({
    status: input.status,
    active: input.active,
    fieldPrefix: "update employee"
  });
  let employee: EmployeeEntity;

  if (isSelfServiceUpdate) {
    const hasRestrictedField =
      input.organizationId !== undefined ||
      input.departmentId !== undefined ||
      input.positionId !== undefined ||
      normalizedStatus !== undefined ||
      input.active !== undefined;
    if (hasRestrictedField) {
      throw new ServiceError(403, "employees can only update name, email, phone, and address");
    }

    employee = await context.dataAccess.employees.update(input.employeeId, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address
    });
  } else {
    if (tenantScope && input.organizationId && input.organizationId !== tenantScope) {
      throw new ServiceError(403, "cross-tenant employee update is not allowed");
    }

    let organizationId =
      tenantScope ??
      (input.organizationId !== undefined ? input.organizationId : existing.organizationId);
    const departmentId =
      input.departmentId !== undefined ? input.departmentId : existing.departmentId;
    const positionId =
      input.positionId !== undefined ? input.positionId : existing.positionId;

    let department: DepartmentEntity | null = null;
    if (departmentId) {
      department = await findDepartmentWithinScopeOrThrow(context, tenantScope, departmentId);
      if (organizationId && department.organizationId !== organizationId) {
        throw new ServiceError(409, "department organization mismatch");
      }
      if (!organizationId) {
        organizationId = department.organizationId;
      }
    }

    let position: PositionEntity | null = null;
    if (positionId) {
      position = await findPositionWithinScopeOrThrow(context, tenantScope, positionId);
      if (organizationId && position.organizationId !== organizationId) {
        throw new ServiceError(409, "position organization mismatch");
      }
      if (!organizationId) {
        organizationId = position.organizationId;
      }
    }

    if (
      department &&
      position &&
      department.organizationId !== position.organizationId
    ) {
      throw new ServiceError(409, "department and position must belong to same organization");
    }

    if (organizationId) {
      await findOrganizationOrThrow(context, organizationId);
    }

    employee = await context.dataAccess.employees.update(input.employeeId, {
      organizationId,
      departmentId,
      positionId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      status: normalizedStatus
    });
  }

  if (existing.status !== "ACTIVE" && employee.status === "ACTIVE") {
    await seedDefaultSchedulesOnActivation(context, employee, {
      ...resolveDefaultWorkScheduleSeedRange(employee.updatedAt),
      baseDate: employee.updatedAt
    });
  }

  await context.dataAccess.audit.append({
    action: "employee.profile.updated",
    entityType: "Employee",
    entityId: employee.id,
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      before: {
        organizationId: existing.organizationId,
        departmentId: existing.departmentId,
        positionId: existing.positionId,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        address: existing.address,
        status: existing.status,
        active: existing.active
      },
      after: {
        organizationId: employee.organizationId,
        departmentId: employee.departmentId,
        positionId: employee.positionId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        status: employee.status,
        active: employee.active
      }
    }
  });

  await getEventPublisher(context).publish({
    name: "employee.profile.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "Employee",
    entityId: employee.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      organizationId: employee.organizationId,
      departmentId: employee.departmentId,
      positionId: employee.positionId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      status: employee.status,
      active: employee.active
    }
  });

  return employee;
}

export async function transitionEmployeeStatus(
  context: ServiceContext,
  input: {
    employeeId: string;
    status: EmployeeStatus;
    reason?: string;
    effectiveDate?: string;
  }
): Promise<EmployeeEntity> {
  await requireEmployeeStatusMutationAccess(context, "transition employee status");

  const tenantScope = resolveTenantScope(context.actor);
  const existing = await context.dataAccess.employees.findById(input.employeeId);
  if (!existing) {
    throw new ServiceError(404, "employee not found");
  }
  ensureTenantMatch(tenantScope, existing.organizationId, "employee not found");
  assertValidEmployeeStatusTransition(existing.status, input.status);

  const employee = await context.dataAccess.employees.update(input.employeeId, {
    status: input.status
  });

  if (existing.status !== "ACTIVE" && employee.status === "ACTIVE") {
    const baseDate =
      input.effectiveDate && !Number.isNaN(new Date(input.effectiveDate).getTime())
        ? new Date(input.effectiveDate)
        : employee.updatedAt;
    await seedDefaultSchedulesOnActivation(context, employee, {
      ...resolveDefaultWorkScheduleSeedRange(baseDate),
      baseDate
    });
  }

  const sessionInvalidation =
    input.status === "RESIGNED"
      ? await invalidateEmployeeSessionsIfPossible(employee.id)
      : { attempted: false as const, success: false as const, reason: "not_required" };

  const payload = {
    employeeId: employee.id,
    organizationId: employee.organizationId,
    fromStatus: existing.status,
    toStatus: employee.status,
    reason: input.reason ?? null,
    effectiveDate: input.effectiveDate ?? null,
    sessionInvalidation
  };

  await context.dataAccess.audit.append({
    action: EMPLOYEE_STATUS_TRANSITION_ACTION,
    entityType: "Employee",
    entityId: employee.id,
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });

  await getEventPublisher(context).publish({
    name: "employee.status.transitioned.v1",
    occurredAt: new Date().toISOString(),
    entityType: "Employee",
    entityId: employee.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });

  return employee;
}
