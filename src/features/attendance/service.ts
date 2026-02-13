import type { Actor } from "@/lib/actor";
import { canMutateAttendance, hasAnyRole } from "@/lib/permissions";
import type {
  AttendanceRecordEntity,
  DataAccess,
  UpdateAttendanceRecordInput
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ServiceError } from "@/features/shared/service-error";

type CreateAttendanceInput = {
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
};

type UpdateAttendanceInput = {
  checkInAt?: Date;
  checkOutAt?: Date;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

export async function createAttendanceRecord(
  context: ServiceContext,
  input: CreateAttendanceInput
): Promise<AttendanceRecordEntity> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (!canMutateAttendance(context.actor, input.employeeId)) {
    throw new ServiceError(403, "insufficient permissions");
  }

  const record = await context.dataAccess.attendance.create({
    employeeId: input.employeeId,
    checkInAt: input.checkInAt,
    checkOutAt: input.checkOutAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes
  });

  await context.dataAccess.audit.append({
    action: "attendance.recorded",
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      employeeId: record.employeeId
    }
  });
  await getEventPublisher(context).publish({
    name: "attendance.recorded.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      employeeId: record.employeeId
    }
  });

  return record;
}

async function requireEditableRecord(
  context: ServiceContext,
  recordId: string
): Promise<AttendanceRecordEntity> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const existing = await context.dataAccess.attendance.findById(recordId);
  if (!existing) {
    throw new ServiceError(404, "attendance record not found");
  }
  if (!canMutateAttendance(context.actor, existing.employeeId)) {
    throw new ServiceError(403, "insufficient permissions");
  }
  if (existing.state === "APPROVED") {
    throw new ServiceError(409, "approved attendance cannot be edited");
  }

  return existing;
}

function toRecordUpdateInput(input: UpdateAttendanceInput): UpdateAttendanceRecordInput {
  return {
    checkInAt: input.checkInAt,
    checkOutAt: input.checkOutAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes
  };
}

export async function updateAttendanceRecord(
  context: ServiceContext,
  recordId: string,
  input: UpdateAttendanceInput
): Promise<AttendanceRecordEntity> {
  await requireEditableRecord(context, recordId);

  const record = await context.dataAccess.attendance.update(recordId, toRecordUpdateInput(input));
  await context.dataAccess.audit.append({
    action: "attendance.corrected",
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: input
  });
  await getEventPublisher(context).publish({
    name: "attendance.corrected.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      ...input
    }
  });

  return record;
}

export async function approveAttendanceRecord(
  context: ServiceContext,
  recordId: string
): Promise<AttendanceRecordEntity> {
  if (!context.actor || !hasAnyRole(context.actor, ["admin", "manager"])) {
    throw new ServiceError(403, "approval requires admin or manager role");
  }

  const existing = await context.dataAccess.attendance.findById(recordId);
  if (!existing) {
    throw new ServiceError(404, "attendance record not found");
  }
  if (existing.state !== "PENDING") {
    throw new ServiceError(409, "only pending attendance can be approved");
  }

  const record = await context.dataAccess.attendance.update(recordId, {
    state: "APPROVED",
    approvedAt: new Date(),
    approvedBy: context.actor.id
  });
  await context.dataAccess.audit.append({
    action: "attendance.approved",
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      employeeId: record.employeeId
    }
  });
  await getEventPublisher(context).publish({
    name: "attendance.approved.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      employeeId: record.employeeId,
      approvedAt: record.approvedAt?.toISOString() ?? null
    }
  });

  return record;
}
