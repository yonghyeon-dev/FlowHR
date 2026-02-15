import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions, type Permission } from "@/lib/rbac";
import { ensureTenantMatch, resolveTenantScope } from "@/features/shared/tenant-scope";
import type { DataAccess, EmployeeEntity, OrganizationEntity } from "@/features/shared/data-access";
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

export async function createEmployee(
  context: ServiceContext,
  input: {
    id: string;
    organizationId?: string | null;
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

  const employee = await context.dataAccess.employees.create({
    id: input.id,
    organizationId: tenantScope ?? input.organizationId,
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

  const employee = await context.dataAccess.employees.update(input.employeeId, {
    organizationId: tenantScope ?? input.organizationId,
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
        name: existing.name,
        email: existing.email,
        active: existing.active
      },
      after: {
        organizationId: employee.organizationId,
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
      name: employee.name,
      email: employee.email,
      active: employee.active
    }
  });

  return employee;
}

