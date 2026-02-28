import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type { DataAccess } from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

type SchedulingServiceContextLike = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

export function requireSchedulingActor(context: SchedulingServiceContextLike): Actor {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  return actor;
}

export async function requireSchedulingWriteActor(
  context: SchedulingServiceContextLike,
  permissionMessage: string
): Promise<Actor> {
  const actor = requireSchedulingActor(context);
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, permissionMessage);
  return actor;
}

export async function resolveSchedulingWriteActorContext(
  context: SchedulingServiceContextLike,
  permissionMessage: string
) {
  const actor = await requireSchedulingWriteActor(context, permissionMessage);
  return {
    actor,
    tenantScope: resolveSchedulingTenantScope(actor)
  };
}

export function resolveSchedulingTenantScope(actor: Actor) {
  return resolveTenantScope(actor) ?? undefined;
}

export function resolveSchedulingEventPublisher(context: SchedulingServiceContextLike): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}
