import type { Actor } from "@/lib/actor";
import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type { CreateWorkScheduleInput, DataAccess, WorkScheduleEntity } from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

type CreateScheduleInput = {
  employeeId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
};

type ListScheduleInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}

function toCreateInput(input: CreateScheduleInput): CreateWorkScheduleInput {
  return {
    employeeId: input.employeeId,
    startAt: input.startAt,
    endAt: input.endAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes
  };
}

export async function createWorkSchedule(
  context: ServiceContext,
  input: CreateScheduleInput
): Promise<WorkScheduleEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, "schedule assignment requires permission");

  if (input.endAt <= input.startAt) {
    throw new ServiceError(400, "endAt must be after startAt");
  }

  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);

  const overlapping = await context.dataAccess.scheduling.listInPeriod({
    periodStart: input.startAt,
    periodEnd: input.endAt,
    organizationId: employee.organizationId ?? undefined,
    employeeId: input.employeeId
  });
  const strictOverlaps = overlapping.filter((existing) => existing.startAt < input.endAt && existing.endAt > input.startAt);
  if (strictOverlaps.length > 0) {
    throw new ServiceError(409, "overlapping schedule exists", {
      employeeId: input.employeeId,
      overlapCount: strictOverlaps.length,
      overlappingScheduleIds: strictOverlaps.map((schedule) => schedule.id)
    });
  }

  const schedule = await context.dataAccess.scheduling.create(toCreateInput(input));

  await context.dataAccess.audit.append({
    action: "scheduling.schedule.assigned",
    entityType: "WorkSchedule",
    entityId: schedule.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: schedule.employeeId,
      startAt: schedule.startAt.toISOString(),
      endAt: schedule.endAt.toISOString(),
      breakMinutes: schedule.breakMinutes,
      isHoliday: schedule.isHoliday,
      notes: schedule.notes
    }
  });
  await getEventPublisher(context).publish({
    name: "scheduling.schedule.assigned.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkSchedule",
    entityId: schedule.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: schedule.employeeId,
      startAt: schedule.startAt.toISOString(),
      endAt: schedule.endAt.toISOString(),
      breakMinutes: schedule.breakMinutes,
      isHoliday: schedule.isHoliday
    }
  });

  return schedule;
}

export async function listWorkSchedules(
  context: ServiceContext,
  input: ListScheduleInput
): Promise<WorkScheduleEntity[]> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.employeeId) {
    await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  }

  const actor = context.actor;
  let employeeId = input.employeeId;
  const permissions = await resolveActorPermissions(context);

  if (permissions.has(Permissions.schedulingScheduleListAny)) {
    // optional employeeId filter allowed
  } else if (permissions.has(Permissions.schedulingScheduleListByEmployee)) {
    if (!employeeId) {
      throw new ServiceError(400, "employeeId is required for manager schedule list queries");
    }
  } else if (permissions.has(Permissions.schedulingScheduleListOwn)) {
    employeeId = employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own schedules");
    }
  } else {
    throw new ServiceError(403, "schedule list requires permission");
  }

  return await context.dataAccess.scheduling.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId
  });
}

