import type { Actor } from "@/lib/actor";
import { requireOwnOrAny, requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { derivePayableMinutes, type PayableMinutes } from "@/lib/payroll-rules";
import type {
  AttendanceCaptureChannel,
  AttendanceRecordEntity,
  DataAccess,
  UpdateAttendanceRecordInput
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

type CreateAttendanceInput = {
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
  capture?: {
    channel: AttendanceCaptureChannel;
    deviceId?: string;
    ipAddress?: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  };
};

type UpdateAttendanceInput = {
  checkInAt?: Date;
  checkOutAt?: Date;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string;
  capture?: {
    channel?: AttendanceCaptureChannel;
    deviceId?: string | null;
    ipAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    accuracyMeters?: number | null;
  };
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

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isAttendanceGpsPolicyEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED ?? process.env.ATTENDANCE_GPS_REQUIRED
  );
}

function assertGpsCapturePolicyForCreate(actor: Actor, input: CreateAttendanceInput) {
  if (!isAttendanceGpsPolicyEnabled() || actor.role !== "employee") {
    return;
  }

  if (
    !input.capture ||
    input.capture.channel !== "GPS" ||
    input.capture.latitude === undefined ||
    input.capture.longitude === undefined
  ) {
    throw new ServiceError(400, "attendance capture policy requires GPS channel with coordinates");
  }
}

function assertGpsCapturePolicyForUpdate(
  actor: Actor,
  existing: AttendanceRecordEntity,
  input: UpdateAttendanceInput
) {
  if (!isAttendanceGpsPolicyEnabled() || actor.role !== "employee") {
    return;
  }

  const nextChannel = input.capture?.channel ?? existing.captureChannel;
  const nextLatitude =
    input.capture?.latitude !== undefined ? input.capture.latitude : existing.captureLatitude;
  const nextLongitude =
    input.capture?.longitude !== undefined ? input.capture.longitude : existing.captureLongitude;

  if (nextChannel !== "GPS" || nextLatitude === null || nextLongitude === null) {
    throw new ServiceError(400, "attendance capture policy requires GPS channel with coordinates");
  }
}

function toCapturePayload(record: AttendanceRecordEntity) {
  return {
    channel: record.captureChannel,
    deviceId: record.captureDeviceId,
    ipAddress: record.captureIpAddress,
    latitude: record.captureLatitude,
    longitude: record.captureLongitude,
    accuracyMeters: record.captureAccuracyMeters
  };
}

function toCreateCaptureInput(input: CreateAttendanceInput["capture"]) {
  return {
    captureChannel: input?.channel ?? "MANUAL",
    captureDeviceId: input?.deviceId ?? null,
    captureIpAddress: input?.ipAddress ?? null,
    captureLatitude: input?.latitude ?? null,
    captureLongitude: input?.longitude ?? null,
    captureAccuracyMeters: input?.accuracyMeters ?? null
  };
}

function toUpdateCaptureInput(input: UpdateAttendanceInput["capture"]) {
  if (!input) {
    return {};
  }

  return {
    captureChannel: input.channel,
    captureDeviceId: input.deviceId,
    captureIpAddress: input.ipAddress,
    captureLatitude: input.latitude,
    captureLongitude: input.longitude,
    captureAccuracyMeters: input.accuracyMeters
  };
}

export async function createAttendanceRecord(
  context: ServiceContext,
  input: CreateAttendanceInput
): Promise<AttendanceRecordEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requireOwnOrAny(context, {
    own: Permissions.attendanceRecordWriteOwn,
    any: Permissions.attendanceRecordWriteAny,
    employeeId: input.employeeId
  });

  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    input.employeeId
  );

  assertGpsCapturePolicyForCreate(actor, input);

  const record = await context.dataAccess.attendance.create({
    employeeId: input.employeeId,
    checkInAt: input.checkInAt,
    checkOutAt: input.checkOutAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes,
    ...toCreateCaptureInput(input.capture)
  });

  await context.dataAccess.audit.append({
    action: "attendance.recorded",
    entityType: "AttendanceRecord",
    entityId: record.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId,
      capture: toCapturePayload(record)
    }
  });
  await getEventPublisher(context).publish({
    name: "attendance.recorded.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId,
      capture: toCapturePayload(record)
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
  await requireEmployeeWithinTenant(context.dataAccess, context.actor, existing.employeeId);
  await requireOwnOrAny(context, {
    own: Permissions.attendanceRecordWriteOwn,
    any: Permissions.attendanceRecordWriteAny,
    employeeId: existing.employeeId
  });
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
    notes: input.notes,
    ...toUpdateCaptureInput(input.capture)
  };
}

export async function updateAttendanceRecord(
  context: ServiceContext,
  recordId: string,
  input: UpdateAttendanceInput
): Promise<AttendanceRecordEntity> {
  const existing = await requireEditableRecord(context, recordId);
  assertGpsCapturePolicyForUpdate(context.actor!, existing, input);
  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    existing.employeeId
  );

  const record = await context.dataAccess.attendance.update(recordId, toRecordUpdateInput(input));
  await context.dataAccess.audit.append({
    action: "attendance.corrected",
    entityType: "AttendanceRecord",
    entityId: record.id,
    organizationId: employee.organizationId,
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
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.attendanceRecordApprove, "approval requires permission");

  const existing = await context.dataAccess.attendance.findById(recordId);
  if (!existing) {
    throw new ServiceError(404, "attendance record not found");
  }
  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    existing.employeeId
  );
  if (existing.state !== "PENDING") {
    throw new ServiceError(409, "only pending attendance can be approved");
  }

  const record = await context.dataAccess.attendance.update(recordId, {
    state: "APPROVED",
    approvedAt: new Date(),
    approvedBy: actor.id
  });
  await context.dataAccess.audit.append({
    action: "attendance.approved",
    entityType: "AttendanceRecord",
    entityId: record.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId
    }
  });
  await getEventPublisher(context).publish({
    name: "attendance.approved.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: actor.role,
    actorId: actor.id,
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
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.attendanceRecordReject, "rejection requires permission");

  const existing = await context.dataAccess.attendance.findById(recordId);
  if (!existing) {
    throw new ServiceError(404, "attendance record not found");
  }
  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    existing.employeeId
  );
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
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
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
    actorRole: actor.role,
    actorId: actor.id,
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
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.employeeId) {
    await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  }

  const actor = context.actor;
  const permissions = await resolveActorPermissions(context);

  if (permissions.has(Permissions.attendanceRecordListAny)) {
    return await context.dataAccess.attendance.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId: input.employeeId,
      state: input.state
    });
  }

  if (permissions.has(Permissions.attendanceRecordListByEmployee)) {
    if (!input.employeeId) {
      throw new ServiceError(400, "employeeId is required for manager list queries");
    }
    return await context.dataAccess.attendance.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId: input.employeeId,
      state: input.state
    });
  }

  if (permissions.has(Permissions.attendanceRecordListOwn)) {
    const employeeId = input.employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own attendance records");
    }
    return await context.dataAccess.attendance.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId,
      state: input.state
    });
  }

  throw new ServiceError(403, "attendance list requires permission");
}

export async function listAttendanceAggregates(
  context: ServiceContext,
  input: ListAttendanceAggregatesInput
): Promise<AttendanceAggregate[]> {
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

  if (permissions.has(Permissions.attendanceAggregateListAny)) {
    // optional employeeId filter is allowed
  } else if (permissions.has(Permissions.attendanceAggregateListByEmployee)) {
    if (!employeeId) {
      throw new ServiceError(400, "employeeId is required for manager aggregate queries");
    }
  } else if (permissions.has(Permissions.attendanceAggregateListOwn)) {
    employeeId = employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own attendance aggregates");
    }
  } else {
    throw new ServiceError(403, "attendance aggregates require permission");
  }

  const records = await context.dataAccess.attendance.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
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
