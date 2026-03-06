import type { Actor } from "@/lib/actor";
import { requireOwnOrAny, requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { derivePayableMinutes, type PayableMinutes } from "@/lib/payroll-rules";
import { applyApprovalExecutionAction, assertApprovalPolicyGate } from "@/features/approval/service";
import {
  notifyAttendanceApproved,
  notifyAttendanceRejected
} from "@/features/notifications/service";
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
import {
  assertAntiSpoofingPolicyForCreate,
  assertAntiSpoofingPolicyForUpdate,
  assertDeviceAttestationForCreate,
  assertDeviceAttestationForUpdate,
  assertGeofencePolicyForCreate,
  assertGeofencePolicyForUpdate,
  assertGpsCapturePolicyForCreate,
  assertGpsCapturePolicyForUpdate,
  assertTrustedDevicePolicyForCreate,
  assertTrustedDevicePolicyForUpdate
} from "@/features/attendance/helpers/capture-policy";

type CreateAttendanceInput = {
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
  forceWeeklyHourLimitOverride?: boolean;
  capture?: {
    channel: AttendanceCaptureChannel;
    deviceId?: string;
    attestationToken?: string;
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
    attestationToken?: string;
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

type AutoCloseAttendanceInput = {
  now?: Date;
  thresholdHours?: number;
  defaultWorkHours?: number;
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

export type AutoCloseAttendanceResult = {
  closedCount: number;
  records: AttendanceRecordEntity[];
};

export type WeeklyHoursSummary = {
  employeeId: string;
  weekOf: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  limit: number;
  exceeded: boolean;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

const MINUTES_PER_HOUR = 60;
const DAY_MS = 24 * MINUTES_PER_HOUR * MINUTES_PER_HOUR * 1000;
const KOREA_UTC_OFFSET_MS = 9 * MINUTES_PER_HOUR * MINUTES_PER_HOUR * 1000;
const AUTO_CLOSE_THRESHOLD_HOURS = 12;
const AUTO_CLOSE_WORK_HOURS = 9;
const WEEKLY_REGULAR_HOUR_LIMIT = 40;
export const WEEKLY_HOUR_LIMIT = 52;
const WEEKLY_HOUR_LIMIT_MINUTES = WEEKLY_HOUR_LIMIT * MINUTES_PER_HOUR;

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
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

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

function minutesToHours(minutes: number) {
  return roundHours(minutes / MINUTES_PER_HOUR);
}

function toKoreanWeekStart(inputDate: Date) {
  const shifted = new Date(inputDate.getTime() + KOREA_UTC_OFFSET_MS);
  const dayOfWeek = shifted.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(shifted.getUTCDate() - daysSinceMonday);
  return new Date(shifted.getTime() - KOREA_UTC_OFFSET_MS);
}

function toKoreanWeekEndInclusive(weekStartDate: Date) {
  const weekStart = toKoreanWeekStart(weekStartDate);
  return new Date(weekStart.getTime() + 7 * DAY_MS - 1);
}

function toKoreanDateOnly(value: Date) {
  return new Date(value.getTime() + KOREA_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

function toKoreanMonthKey(value: Date) {
  const shifted = new Date(value.getTime() + KOREA_UTC_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function isAttendancePeriodFinalized(
  context: ServiceContext,
  organizationId: string,
  attendanceDate: Date
) {
  const run = await context.dataAccess.payroll.findConfirmedForPeriod(
    organizationId,
    attendanceDate
  );
  return run !== null;
}

async function ensureAttendancePeriodMutable(
  context: ServiceContext,
  organizationId: string,
  attendanceDate: Date
) {
  if (await isAttendancePeriodFinalized(context, organizationId, attendanceDate)) {
    throw new ServiceError(400, "confirmed payroll period — attendance locked");
  }
}

function calculateWorkedMinutes(checkInAt: Date, checkOutAt: Date | null, breakMinutes: number) {
  if (!checkOutAt) {
    return 0;
  }
  const durationMs = checkOutAt.getTime() - checkInAt.getTime();
  if (durationMs <= 0) {
    return 0;
  }

  const grossMinutes = Math.floor(durationMs / (MINUTES_PER_HOUR * 1000));
  const normalizedBreakMinutes = Math.max(0, Math.trunc(breakMinutes));
  return Math.max(0, grossMinutes - normalizedBreakMinutes);
}

function splitWeeklyMinutes(totalMinutes: number) {
  const regularMinutes = Math.min(
    totalMinutes,
    WEEKLY_REGULAR_HOUR_LIMIT * MINUTES_PER_HOUR
  );
  const overtimeMinutes = Math.max(0, totalMinutes - regularMinutes);
  return {
    regularMinutes,
    overtimeMinutes
  };
}

type WeeklyHoursComputation = WeeklyHoursSummary & {
  weekStartDate: Date;
  totalMinutes: number;
};

async function calculateWeeklyHoursInternal(
  context: ServiceContext,
  employeeId: string,
  weekStartDate: Date
): Promise<WeeklyHoursComputation> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requireEmployeeWithinTenant(context.dataAccess, actor, employeeId);

  const normalizedWeekStart = toKoreanWeekStart(weekStartDate);
  const weekEnd = toKoreanWeekEndInclusive(normalizedWeekStart);
  const records = await context.dataAccess.attendance.listInPeriod({
    periodStart: normalizedWeekStart,
    periodEnd: weekEnd,
    organizationId: resolveTenantScope(actor) ?? undefined,
    employeeId
  });

  let totalMinutes = 0;
  for (const record of records) {
    if (record.state !== "APPROVED" && record.state !== "PENDING") {
      continue;
    }
    totalMinutes += calculateWorkedMinutes(record.checkInAt, record.checkOutAt, record.breakMinutes);
  }

  const split = splitWeeklyMinutes(totalMinutes);
  return {
    employeeId,
    weekOf: toKoreanDateOnly(normalizedWeekStart),
    regularHours: minutesToHours(split.regularMinutes),
    overtimeHours: minutesToHours(split.overtimeMinutes),
    totalHours: minutesToHours(totalMinutes),
    limit: WEEKLY_HOUR_LIMIT,
    exceeded: totalMinutes > WEEKLY_HOUR_LIMIT_MINUTES,
    weekStartDate: normalizedWeekStart,
    totalMinutes
  };
}

export async function calculateWeeklyHours(
  context: ServiceContext,
  employeeId: string,
  weekStartDate: Date
): Promise<WeeklyHoursSummary> {
  const summary = await calculateWeeklyHoursInternal(context, employeeId, weekStartDate);
  return {
    employeeId: summary.employeeId,
    weekOf: summary.weekOf,
    regularHours: summary.regularHours,
    overtimeHours: summary.overtimeHours,
    totalHours: summary.totalHours,
    limit: summary.limit,
    exceeded: summary.exceeded
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
  assertGeofencePolicyForCreate(actor, input);
  assertTrustedDevicePolicyForCreate(actor, input);
  assertDeviceAttestationForCreate(actor, input);
  await assertAntiSpoofingPolicyForCreate(actor, input);

  const forceOverrideRequested = input.forceWeeklyHourLimitOverride === true;
  if (forceOverrideRequested && actor.role !== "admin") {
    throw new ServiceError(403, "force override requires admin role");
  }

  if (employee.organizationId) {
    await ensureAttendancePeriodMutable(context, employee.organizationId, input.checkInAt);
  }

  const weeklyHours = await calculateWeeklyHoursInternal(
    context,
    input.employeeId,
    input.checkInAt
  );
  const additionalMinutes = calculateWorkedMinutes(
    input.checkInAt,
    input.checkOutAt,
    input.breakMinutes
  );
  const projectedTotalMinutes = weeklyHours.totalMinutes + additionalMinutes;
  const wouldExceedWeeklyLimit = projectedTotalMinutes > WEEKLY_HOUR_LIMIT_MINUTES;
  if (wouldExceedWeeklyLimit && !forceOverrideRequested) {
    throw new ServiceError(400, "Weekly work hour limit (52h) would be exceeded");
  }

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

  if (wouldExceedWeeklyLimit && forceOverrideRequested) {
    await context.dataAccess.audit.append({
      action: "attendance.weekly_limit_override",
      entityType: "AttendanceRecord",
      entityId: record.id,
      organizationId: employee.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        employeeId: record.employeeId,
        weekOf: weeklyHours.weekOf,
        limit: WEEKLY_HOUR_LIMIT,
        existingTotalHours: weeklyHours.totalHours,
        additionalHours: minutesToHours(additionalMinutes),
        projectedTotalHours: minutesToHours(projectedTotalMinutes)
      }
    });
  }
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
  assertGeofencePolicyForUpdate(context.actor!, existing, input);
  assertTrustedDevicePolicyForUpdate(context.actor!, existing, input);
  assertDeviceAttestationForUpdate(context.actor!, existing, input);
  await assertAntiSpoofingPolicyForUpdate(context.actor!, existing, input);
  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    existing.employeeId
  );
  if (employee.organizationId) {
    await ensureAttendancePeriodMutable(context, employee.organizationId, existing.checkInAt);
    const nextCheckInAt = input.checkInAt ?? existing.checkInAt;
    if (toKoreanMonthKey(nextCheckInAt) !== toKoreanMonthKey(existing.checkInAt)) {
      await ensureAttendancePeriodMutable(context, employee.organizationId, nextCheckInAt);
    }
  }

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

export async function deleteAttendanceRecord(
  context: ServiceContext,
  recordId: string
): Promise<AttendanceRecordEntity> {
  const existing = await requireEditableRecord(context, recordId);
  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    existing.employeeId
  );
  if (employee.organizationId) {
    await ensureAttendancePeriodMutable(context, employee.organizationId, existing.checkInAt);
  }

  const record = await context.dataAccess.attendance.delete(recordId);
  await context.dataAccess.audit.append({
    action: "attendance.deleted",
    entityType: "AttendanceRecord",
    entityId: record.id,
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      employeeId: record.employeeId,
      checkInAt: record.checkInAt.toISOString(),
      checkOutAt: record.checkOutAt?.toISOString() ?? null
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

  let approvalFinalized = true;
  if (employee.organizationId) {
    const execution = await applyApprovalExecutionAction(context, {
      domain: "ATTENDANCE",
      organizationId: employee.organizationId,
      targetEntityType: "AttendanceRecord",
      targetEntityId: existing.id,
      action: "APPROVE"
    });
    approvalFinalized = execution.finalized;
  } else {
    await assertApprovalPolicyGate(context, {
      domain: "ATTENDANCE",
      organizationId: employee.organizationId,
      targetEntityType: "AttendanceRecord",
      targetEntityId: existing.id
    });
  }

  if (!approvalFinalized) {
    return existing;
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

  if (employee.organizationId) {
    notifyAttendanceApproved(context, {
      organizationId: employee.organizationId,
      employeeId: record.employeeId
    }).catch(() => {});
  }

  return record;
}

export async function rejectAttendanceRecord(
  context: ServiceContext,
  recordId: string,
  reason: string
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
  const normalizedReason = reason.trim();
  if (normalizedReason.length === 0) {
    throw new ServiceError(400, "rejection reason is required");
  }

  if (employee.organizationId) {
    const execution = await applyApprovalExecutionAction(context, {
      domain: "ATTENDANCE",
      organizationId: employee.organizationId,
      targetEntityType: "AttendanceRecord",
      targetEntityId: existing.id,
      action: "REJECT"
    });
    if (!execution.finalized || execution.execution.state !== "REJECTED") {
      throw new ServiceError(409, "attendance reject action is not finalized");
    }
  } else {
    await assertApprovalPolicyGate(context, {
      domain: "ATTENDANCE",
      organizationId: employee.organizationId,
      targetEntityType: "AttendanceRecord",
      targetEntityId: existing.id
    });
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
      reason: normalizedReason
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
      reason: normalizedReason
    }
  });

  if (employee.organizationId) {
    notifyAttendanceRejected(context, {
      organizationId: employee.organizationId,
      employeeId: record.employeeId,
      reason: normalizedReason
    }).catch(() => {});
  }

  return record;
}

function assertPositiveHourValue(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ServiceError(400, `${label} must be a positive number`);
  }
}

export async function autoCloseAttendanceRecords(
  context: ServiceContext,
  input: AutoCloseAttendanceInput = {}
): Promise<AutoCloseAttendanceResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (actor.role !== "admin") {
    throw new ServiceError(403, "auto close requires admin role");
  }

  const now = input.now ?? new Date();
  const thresholdHours = input.thresholdHours ?? AUTO_CLOSE_THRESHOLD_HOURS;
  const defaultWorkHours = input.defaultWorkHours ?? AUTO_CLOSE_WORK_HOURS;
  assertPositiveHourValue(thresholdHours, "thresholdHours");
  assertPositiveHourValue(defaultWorkHours, "defaultWorkHours");

  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  const defaultWorkMs = defaultWorkHours * 60 * 60 * 1000;
  const clockInBefore = new Date(now.getTime() - thresholdMs);
  const organizationId = resolveTenantScope(actor) ?? undefined;

  const targets = await context.dataAccess.attendance.listOpenRecordsNeedingAutoClose({
    clockInBefore,
    organizationId
  });

  const records: AttendanceRecordEntity[] = [];
  for (const target of targets) {
    const autoClosedClockOutAt = new Date(target.checkInAt.getTime() + defaultWorkMs);
    const record = await context.dataAccess.attendance.update(target.id, {
      checkOutAt: autoClosedClockOutAt,
      anomalyType: "AUTO_CLOSED"
    });

    const employee = await context.dataAccess.employees.findById(record.employeeId);
    await context.dataAccess.audit.append({
      action: "attendance.auto_closed",
      entityType: "AttendanceRecord",
      entityId: record.id,
      organizationId: employee?.organizationId ?? null,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        employeeId: record.employeeId,
        checkInAt: record.checkInAt.toISOString(),
        checkOutAt: record.checkOutAt?.toISOString() ?? null,
        anomalyType: record.anomalyType ?? null
      }
    });

    records.push(record);
  }

  return {
    closedCount: records.length,
    records
  };
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



