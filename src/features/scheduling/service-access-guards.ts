import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  DataAccess,
  WorkScheduleEntity,
  WorkScheduleTemplateEntity
} from "@/features/shared/data-access";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

export type SchedulingServiceAccessContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

export function requireTemplateTenantScope(context: SchedulingServiceAccessContext) {
  const tenantScope = resolveTenantScope(context.actor);
  if (!tenantScope) {
    throw new ServiceError(400, "template operations require tenant organization scope");
  }
  return tenantScope;
}

export async function requireEditableSchedule(
  context: SchedulingServiceAccessContext,
  scheduleId: string,
  permissionMessage: string
): Promise<WorkScheduleEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const existing = await context.dataAccess.scheduling.findById(scheduleId);
  if (!existing) {
    throw new ServiceError(404, "schedule not found");
  }

  await requireEmployeeWithinTenant(context.dataAccess, context.actor, existing.employeeId);
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, permissionMessage);

  return existing;
}

export async function requireTemplateEntityWithinTenant(
  context: SchedulingServiceAccessContext,
  templateId: string
): Promise<WorkScheduleTemplateEntity> {
  const template = await context.dataAccess.scheduling.findTemplateById(templateId);
  if (!template) {
    throw new ServiceError(404, "schedule template not found");
  }

  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && template.organizationId !== tenantScope) {
    throw new ServiceError(404, "schedule template not found");
  }

  return template;
}
