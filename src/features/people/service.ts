import type { Actor } from "@/lib/actor";
import { hasAnyRole } from "@/lib/permissions";
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

function requirePeopleAdmin(actor: Actor | null, action: string) {
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    throw new ServiceError(403, `people ${action} requires admin role`);
  }
}

export async function createOrganization(
  context: ServiceContext,
  input: { name: string }
): Promise<OrganizationEntity> {
  requirePeopleAdmin(context.actor, "create organization");

  const organization = await context.dataAccess.organizations.create({
    name: input.name
  });

  await context.dataAccess.audit.append({
    action: "organization.created",
    entityType: "Organization",
    entityId: organization.id,
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
  requirePeopleAdmin(context.actor, "list organizations");
  return context.dataAccess.organizations.list();
}

export async function getOrganization(
  context: ServiceContext,
  input: { organizationId: string }
): Promise<OrganizationEntity> {
  requirePeopleAdmin(context.actor, "get organization");
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
  requirePeopleAdmin(context.actor, "create employee");

  const existing = await context.dataAccess.employees.findById(input.id);
  if (existing) {
    throw new ServiceError(409, "employee already exists");
  }

  const employee = await context.dataAccess.employees.create({
    id: input.id,
    organizationId: input.organizationId,
    name: input.name,
    email: input.email,
    active: input.active
  });

  await context.dataAccess.audit.append({
    action: "employee.created",
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
  requirePeopleAdmin(context.actor, "list employees");
  return context.dataAccess.employees.list(input);
}

export async function getEmployee(
  context: ServiceContext,
  input: { employeeId: string }
): Promise<EmployeeEntity> {
  requirePeopleAdmin(context.actor, "get employee");
  const employee = await context.dataAccess.employees.findById(input.employeeId);
  if (!employee) {
    throw new ServiceError(404, "employee not found");
  }
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
  requirePeopleAdmin(context.actor, "update employee");

  const existing = await context.dataAccess.employees.findById(input.employeeId);
  if (!existing) {
    throw new ServiceError(404, "employee not found");
  }

  const employee = await context.dataAccess.employees.update(input.employeeId, {
    organizationId: input.organizationId,
    name: input.name,
    email: input.email,
    active: input.active
  });

  await context.dataAccess.audit.append({
    action: "employee.profile.updated",
    entityType: "Employee",
    entityId: employee.id,
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

