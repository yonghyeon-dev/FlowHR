import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions, type Permission } from "@/lib/rbac";
import { ensureTenantMatch, resolveTenantScope } from "@/features/shared/tenant-scope";
import type {
  DataAccess,
  DepartmentEntity,
  EmployeeEntity,
  OrganizationEntity,
  PositionEntity
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ServiceError } from "@/features/shared/service-error";

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
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
  const tenantScope = resolveTenantScope(context.actor);
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
    organizationId: string;
    code: string;
    name: string;
    active?: boolean;
  }
): Promise<DepartmentEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "create department");
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.organizationId !== tenantScope) {
    throw new ServiceError(403, "cross-tenant department create is not allowed");
  }

  const organizationId = tenantScope ?? ensureNonEmptyText(input.organizationId, "organizationId");
  await findOrganizationOrThrow(context, organizationId);

  const code = ensureNonEmptyText(input.code, "code");
  const existing = await context.dataAccess.departments.list({ organizationId });
  if (existing.some((row) => normalizeCode(row.code) === normalizeCode(code))) {
    throw new ServiceError(409, "department code already exists in organization");
  }

  const department = await context.dataAccess.departments.create({
    organizationId,
    code,
    name: ensureNonEmptyText(input.name, "name"),
    active: input.active
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
      active: department.active
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
      active: department.active
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
  }
): Promise<DepartmentEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "update department");
  const tenantScope = resolveTenantScope(context.actor);

  const existing = await findDepartmentWithinScopeOrThrow(context, tenantScope, input.departmentId);
  const nextCode = input.code ? ensureNonEmptyText(input.code, "code") : existing.code;
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

  const department = await context.dataAccess.departments.update(input.departmentId, {
    code: input.code,
    name: input.name,
    active: input.active
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
        active: existing.active
      },
      after: {
        code: department.code,
        name: department.name,
        active: department.active
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
      active: department.active
    }
  });

  return department;
}

export async function createPosition(
  context: ServiceContext,
  input: {
    organizationId: string;
    code: string;
    name: string;
    active?: boolean;
  }
): Promise<PositionEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "create position");
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.organizationId !== tenantScope) {
    throw new ServiceError(403, "cross-tenant position create is not allowed");
  }

  const organizationId = tenantScope ?? ensureNonEmptyText(input.organizationId, "organizationId");
  await findOrganizationOrThrow(context, organizationId);

  const code = ensureNonEmptyText(input.code, "code");
  const existing = await context.dataAccess.positions.list({ organizationId });
  if (existing.some((row) => normalizeCode(row.code) === normalizeCode(code))) {
    throw new ServiceError(409, "position code already exists in organization");
  }

  const position = await context.dataAccess.positions.create({
    organizationId,
    code,
    name: ensureNonEmptyText(input.name, "name"),
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
    active?: boolean;
  }
): Promise<PositionEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "update position");
  const tenantScope = resolveTenantScope(context.actor);

  const existing = await findPositionWithinScopeOrThrow(context, tenantScope, input.positionId);
  const nextCode = input.code ? ensureNonEmptyText(input.code, "code") : existing.code;
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

  const position = await context.dataAccess.positions.update(input.positionId, {
    code: input.code,
    name: input.name,
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
        active: existing.active
      },
      after: {
        code: position.code,
        name: position.name,
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
    active?: boolean;
  }
): Promise<EmployeeEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "create employee");
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.organizationId && input.organizationId !== tenantScope) {
    throw new ServiceError(403, "cross-tenant employee create is not allowed");
  }

  const existing = await context.dataAccess.employees.findById(input.id);
  if (existing) {
    throw new ServiceError(409, "employee already exists");
  }

  let organizationId = tenantScope ?? (input.organizationId ?? null);

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

  const employee = await context.dataAccess.employees.create({
    id: input.id,
    organizationId,
    departmentId: input.departmentId ?? null,
    positionId: input.positionId ?? null,
    name: input.name,
    email: input.email,
    active: input.active
  });

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
      active: employee.active
    }
  });

  return employee;
}

export async function listEmployees(
  context: ServiceContext,
  input: { active?: boolean; organizationId?: string }
): Promise<EmployeeEntity[]> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "list employees");
  const tenantScope = resolveTenantScope(context.actor);
  return context.dataAccess.employees.list({
    active: input.active,
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

export async function updateEmployee(
  context: ServiceContext,
  input: {
    employeeId: string;
    organizationId?: string | null;
    departmentId?: string | null;
    positionId?: string | null;
    name?: string | null;
    email?: string | null;
    active?: boolean;
  }
): Promise<EmployeeEntity> {
  await requirePeoplePermission(context, Permissions.peopleEmployeesManage, "update employee");
  const tenantScope = resolveTenantScope(context.actor);

  const existing = await context.dataAccess.employees.findById(input.employeeId);
  if (!existing) {
    throw new ServiceError(404, "employee not found");
  }
  ensureTenantMatch(tenantScope, existing.organizationId, "employee not found");
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

  const employee = await context.dataAccess.employees.update(input.employeeId, {
    organizationId,
    departmentId,
    positionId,
    name: input.name,
    email: input.email,
    active: input.active
  });

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
        active: existing.active
      },
      after: {
        organizationId: employee.organizationId,
        departmentId: employee.departmentId,
        positionId: employee.positionId,
        name: employee.name,
        email: employee.email,
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
      active: employee.active
    }
  });

  return employee;
}
