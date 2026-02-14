import type { Actor } from "@/lib/actor";
import { canMutateAttendance, hasAnyRole } from "@/lib/permissions";
import { derivePayableMinutes, type PayableMinutes } from "@/lib/payroll-rules";
import type {
  AttendanceRecordEntity,
  DataAccess,
  UpdateAttendanceRecordInput
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { requireEmployeeExists } from "@/features/shared/require-employee";
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

type ListAttendanceInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  state?: "PENDING" | "APPROVED" | "REJECTED";
};

type ListAttendanceAggregatesInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
};

export type AttendanceAggregate = {
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    payable: number;
  };
  totals: PayableMinutes;
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

  await requireEmployeeExists(context.dataAccess, input.employeeId);

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
  if (existing.state !== "PENDING") {
    throw new ServiceError(409, "only pending attendance can be edited");
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

export async function rejectAttendanceRecord(
  context: ServiceContext,
  recordId: string,
  reason?: string
): Promise<AttendanceRecordEntity> {
  if (!context.actor || !hasAnyRole(context.actor, ["admin", "manager"])) {
    throw new ServiceError(403, "rejection requires admin or manager role");
  }

  const existing = await context.dataAccess.attendance.findById(recordId);
  if (!existing) {
    throw new ServiceError(404, "attendance record not found");
  }
  if (existing.state !== "PENDING") {
    throw new ServiceError(409, "only pending attendance can be rejected");
  }

  const record = await context.dataAccess.attendance.update(recordId, {
    state: "REJECTED",
    approvedAt: null,
    approvedBy: null
  });
  await context.dataAccess.audit.append({
    action: "attendance.rejected",
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      employeeId: record.employeeId,
      reason: reason ?? null
    }
  });
  await getEventPublisher(context).publish({
    name: "attendance.rejected.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      employeeId: record.employeeId,
      reason: reason ?? null
    }
  });

  return record;
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}

const emptyTotals: PayableMinutes = {
  regular: 0,
  overtime: 0,
  night: 0,
  holiday: 0
};

export async function listAttendanceRecords(
  context: ServiceContext,
  input: ListAttendanceInput
): Promise<AttendanceRecordEntity[]> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);

  const actor = context.actor;
  if (actor.role === "employee") {
    const employeeId = input.employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own attendance records");
    }
    return await context.dataAccess.attendance.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      employeeId,
      state: input.state
    });
  }

  if (actor.role === "manager") {
    if (!input.employeeId) {
      throw new ServiceError(400, "employeeId is required for manager list queries");
    }
    return await context.dataAccess.attendance.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      employeeId: input.employeeId,
      state: input.state
    });
  }

  if (!hasAnyRole(actor, ["admin", "payroll_operator"])) {
    throw new ServiceError(403, "attendance list requires admin, payroll_operator, manager, or employee");
  }

  return await context.dataAccess.attendance.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    employeeId: input.employeeId,
    state: input.state
  });
}

export async function listAttendanceAggregates(
  context: ServiceContext,
  input: ListAttendanceAggregatesInput
): Promise<AttendanceAggregate[]> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);

  const actor = context.actor;
  let employeeId = input.employeeId;

  if (actor.role === "employee") {
    employeeId = employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own attendance aggregates");
    }
  } else if (actor.role === "manager") {
    if (!employeeId) {
      throw new ServiceError(400, "employeeId is required for manager aggregate queries");
    }
  } else if (!hasAnyRole(actor, ["admin", "payroll_operator"])) {
    throw new ServiceError(
      403,
      "attendance aggregates require admin, payroll_operator, manager, or employee"
    );
  }

  const records = await context.dataAccess.attendance.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    employeeId
  });

  const aggregates = new Map<string, AttendanceAggregate>();

  function ensureAggregate(targetEmployeeId: string): AttendanceAggregate {
    const existing = aggregates.get(targetEmployeeId);
    if (existing) {
      return existing;
    }

    const created: AttendanceAggregate = {
      employeeId: targetEmployeeId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      counts: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        payable: 0
      },
      totals: { ...emptyTotals }
    };
    aggregates.set(targetEmployeeId, created);
    return created;
  }

  if (employeeId) {
    ensureAggregate(employeeId);
  }

  for (const record of records) {
    const aggregate = ensureAggregate(record.employeeId);

    aggregate.counts.total += 1;
    if (record.state === "PENDING") {
      aggregate.counts.pending += 1;
    } else if (record.state === "APPROVED") {
      aggregate.counts.approved += 1;
    } else {
      aggregate.counts.rejected += 1;
    }

    if (record.state !== "APPROVED" || !record.checkOutAt) {
      continue;
    }

    aggregate.counts.payable += 1;
    const split = derivePayableMinutes(
      record.checkInAt,
      record.checkOutAt,
      record.breakMinutes,
      record.isHoliday
    );
    aggregate.totals = {
      regular: aggregate.totals.regular + split.regular,
      overtime: aggregate.totals.overtime + split.overtime,
      night: aggregate.totals.night + split.night,
      holiday: aggregate.totals.holiday + split.holiday
    };
  }

  return Array.from(aggregates.values()).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
}
