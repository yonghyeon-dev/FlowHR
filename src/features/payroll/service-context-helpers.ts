import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import type { Permission } from "@/lib/rbac";
import type { DataAccess } from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";

export type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

export function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

export async function requirePayrollPermission(
  context: ServiceContext,
  permission: Permission,
  action: "preview" | "confirm" | "list"
) {
  await requirePermission(context, permission, `payroll ${action} requires ${permission}`);
}

export async function requireDeductionProfilePermission(
  context: ServiceContext,
  permission: Permission,
  action: "read" | "write"
) {
  await requirePermission(context, permission, `deduction profile ${action} requires ${permission}`);
}
